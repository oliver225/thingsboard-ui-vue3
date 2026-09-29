<script setup lang="ts">
import type {
  AlarmRule,
  AlarmRuleFilter,
  AlarmRulePredicate,
  AlarmRuleValue,
} from '#/api/tb/alarm-rule';

import { computed } from 'vue';

import dayjs from 'dayjs';

import { $t } from '#/locales';

const props = defineProps<{ condition: AlarmRule['condition'] }>();

type Token = { kind: 'argument' | 'dynamic' | 'text' | 'value'; text: string };
const text = (value: string): Token => ({ kind: 'text', text: value });
function valueToken(
  value?: AlarmRuleValue<unknown>,
  valueType?: string,
): Token {
  if (typeof value?.dynamicValueArgument === 'string')
    return {
      kind: 'dynamic',
      text: value.dynamicValueArgument || $t('alarm-rule.actions.set'),
    };
  const raw = value?.staticValue;
  let formatted = JSON.stringify(raw) ?? $t('alarm-rule.actions.set');
  if (valueType === 'DATE_TIME' && typeof raw === 'number') {
    formatted = dayjs(raw).format('YYYY-MM-DD HH:mm:ss');
  } else if (typeof raw === 'boolean') {
    formatted = raw ? 'True' : 'False';
  }
  return { kind: 'value', text: formatted };
}
function join(groups: Token[][], operation: string): Token[] {
  return groups.flatMap((group, index) =>
    index
      ? [
          text(
            operation === 'OR'
              ? $t('alarm-rule.options.joinOr')
              : $t('alarm-rule.options.joinAnd'),
          ),
          ...group,
        ]
      : group,
  );
}
function predicate(item: AlarmRulePredicate, filter: AlarmRuleFilter): Token[] {
  if (item.type === 'COMPLEX')
    return [
      text('('),
      ...join(
        (item.predicates ?? []).map((child) => predicate(child, filter)),
        item.operation,
      ),
      text(')'),
    ];
  return [
    { kind: 'argument', text: filter.argument },
    text($t(`alarm-rule.options.${item.operation}`)),
    valueToken(
      item.type === 'NO_DATA' ? item.duration : item.value,
      item.type === 'NO_DATA' ? undefined : filter.valueType,
    ),
    ...(item.type === 'NO_DATA'
      ? [text($t(`alarm-rule.options.${item.unit}`))]
      : []),
    ...(item.type === 'STRING' && item.ignoreCase
      ? [text(`(${$t('alarm-rule.fields.ignoreCase')})`)]
      : []),
  ];
}
const tokens = computed(() =>
  join(
    (props.condition.expression.filters ?? []).map((filter) => {
      const content = join(
        filter.predicates.map((item) => predicate(item, filter)),
        filter.operation,
      );
      return filter.predicates.length > 1
        ? [text('('), ...content, text(')')]
        : content;
    }),
    props.condition.expression.operation ?? 'AND',
  ),
);
const timing = computed(() => {
  const condition = props.condition;
  if (condition.type === 'SIMPLE') return '';
  const value = valueToken(
    condition.type === 'DURATION' ? condition.value : condition.count,
  ).text;
  return `${$t(`alarm-rule.options.${condition.type}`)} ${value}${condition.type === 'DURATION' ? ` ${$t(`alarm-rule.options.${condition.unit}`)}` : ''}:`;
});
</script>
<template>
  <span class="block min-w-0 text-left">
    <span v-if="timing" class="text-muted-foreground mb-2 block text-sm">{{
      timing
    }}</span>
    <span
      v-if="condition.expression.type === 'TBEL'"
      class="block whitespace-pre-wrap break-all text-sm leading-6"
    >
      {{ $t('alarm-rule.options.TBEL') }}:
      {{ condition.expression.expression || $t('alarm-rule.actions.set') }}
    </span>
    <span
      v-else-if="tokens.length"
      class="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm leading-6"
    >
      <span
        v-for="(token, index) in tokens"
        :key="index"
        class="break-all"
        :class="{
          'border-border text-primary rounded border px-1 font-semibold':
            token.kind === 'argument',
          'border-border rounded border px-1 font-medium text-orange-600 dark:text-orange-400':
            token.kind === 'value',
          'border-border rounded border px-1 font-semibold text-cyan-600 dark:text-cyan-400':
            token.kind === 'dynamic',
        }"
        >{{ token.text }}</span>
    </span>
    <span v-else class="text-muted-foreground block text-sm">{{
      $t('alarm-rule.messages.noFilterPreview')
    }}</span>
  </span>
</template>
