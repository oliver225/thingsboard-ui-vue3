import type { ComponentPublicInstance, Ref } from 'vue';

import type { FormValidationIssue } from '#/types/form';

import { computed, nextTick, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

/** State only: each business component renders and configures its own Modal. */
export function useEditorDraft<T>(options: {
  get: () => T;
  set: (value: T) => void;
  validate?: (value: T) => FormValidationIssue[];
  create?: boolean;
  onCancel?: () => void;
}) {
  const draft = ref(cloneDeep(options.get())) as Ref<T>;
  const isEditing = ref(false);
  const attempted = ref(false);
  const boundaryRef = ref<{ validate: () => boolean }>();
  const contentRef = ref<HTMLElement>();
  const error = computed(() =>
    attempted.value ? options.validate?.(draft.value)[0]?.message : undefined,
  );
  let applied = false;
  const [Modal, modalApi] = useVbenModal({
    onOpenChange(open) {
      if (!open) return;
      draft.value = cloneDeep(options.get());
      attempted.value = false;
      applied = false;
      isEditing.value = true;
    },
    onClosed() {
      isEditing.value = false;
      if (!applied) options.onCancel?.();
    },
    async onConfirm() {
      if (modalState.value.submitting) return;
      modalApi.lock();
      try {
        attempted.value = true;
        const valid = boundaryRef.value?.validate() ?? true;
        if (error.value || !valid) {
          await nextTick();
          const target = contentRef.value?.querySelector<HTMLElement>(
            '[aria-invalid="true"],[data-alarm-invalid]',
          );
          target?.scrollIntoView({ block: 'center' });
          (
            target?.querySelector<HTMLElement>(
              'input,button,[role="combobox"]',
            ) ?? target
          )?.focus();
          return;
        }
        applied = true;
        options.set(cloneDeep(draft.value));
        modalApi.close();
      } finally {
        modalApi.unlock();
      }
    },
  });
  const modalState = modalApi.useStore();
  onMounted(() => {
    if (options.create) modalApi.open();
  });
  return {
    Modal,
    modalApi,
    modalState,
    draft,
    isEditing,
    error,
    boundaryRef(value: ComponentPublicInstance | Element | null) {
      boundaryRef.value = (value ?? undefined) as unknown as
        | undefined
        | {
            validate: () => boolean;
          };
    },
    contentRef(value: ComponentPublicInstance | Element | null) {
      contentRef.value = value instanceof HTMLElement ? value : undefined;
    },
  };
}
