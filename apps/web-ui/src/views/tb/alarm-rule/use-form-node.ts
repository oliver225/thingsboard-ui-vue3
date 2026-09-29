import type { ComputedRef, InjectionKey, Ref } from 'vue';

import type { FormValidationIssue } from '#/types/form';

import {
  computed,
  inject,
  onBeforeUnmount,
  provide,
  ref,
  shallowReactive,
} from 'vue';
interface FormNode {
  errors: ComputedRef<string[]>;
  attempted: Ref<boolean>;
  validationRun: Ref<number>;
  validate: () => boolean;
  reset: () => void;
  register: (node: FormNode) => () => void;
}
const nodeKey: InjectionKey<FormNode> = Symbol('alarm-rule-form');
/** Propagate validation through the mounted business tree, without duplicating values. */
export function useFormNode(
  check: () => Array<FormValidationIssue[] | string | undefined> = () => [],
  detached = false,
) {
  const ancestor = inject(nodeKey, undefined);
  const parent = detached ? undefined : ancestor;
  const children = shallowReactive(new Set<FormNode>());
  const attempted = ref(parent?.attempted.value ?? false);
  const validationRun = ref(0);
  const ownErrors = computed(() =>
    check().flatMap((error) => {
      if (Array.isArray(error)) return error.map((issue) => issue.message);
      return error ? [error] : [];
    }),
  );
  const errors = computed(() => [
    ...ownErrors.value,
    ...[...children].flatMap((child) => child.errors.value),
  ]);
  const node: FormNode = {
    errors,
    attempted,
    validationRun,
    validate() {
      attempted.value = true;
      validationRun.value++;
      for (const child of children) child.validate();
      return errors.value.length === 0;
    },
    reset() {
      attempted.value = false;
      for (const child of children) child.reset();
    },
    register(child) {
      children.add(child);
      return () => children.delete(child);
    },
  };
  const unregister = parent?.register(node);
  onBeforeUnmount(() => unregister?.());
  provide(nodeKey, node);
  return {
    ...node,
    ownErrors,
    invalid: computed(() => attempted.value && errors.value.length > 0),
  };
}
