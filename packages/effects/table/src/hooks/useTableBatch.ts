import type { ComputedRef, Ref } from 'vue';

import type {
  BasicTableProps,
  TableActionType,
  TableBatchAction,
  TableBatchMessages,
  TableSelection,
} from '../types/table';

import { computed, h, ref, toValue, watch } from 'vue';

import { i18n } from '@vben/locales';

import { confirm } from '@vben-core/popup-ui';

import { message } from 'antdv-next';

export function useTableBatch(
  table: Ref<null | TableActionType>,
  options: ComputedRef<Partial<BasicTableProps>>,
  selection: ComputedRef<TableSelection>,
) {
  const pending = ref(false);
  const { t } = i18n.global;
  const messages = computed<TableBatchMessages>(
    () =>
      options.value.batchMessages ?? {
        title: () => t('table.batchDelete.title'),
        confirmText: () => t('common.delete'),
        cancelText: () => t('common.cancel'),
        selected: (count) => t('table.selectionBarTips', { count }),
        confirm: (entity, count) =>
          t('table.batchDelete.confirm', { entity, count }),
        success: (entity, count) =>
          t('table.batchDelete.success', { entity, count }),
        partialFailure: (entity, deleted, failed) =>
          t('table.batchDelete.partialFailure', { entity, deleted, failed }),
      },
  );

  async function deleteSelected() {
    const batch = options.value.batch;
    const instance = table.value;
    const deleteApi = batch?.deleteApi;
    if (
      !batch ||
      !deleteApi ||
      !instance ||
      pending.value ||
      toValue(batch.enabled) === false ||
      !selection.value.count
    )
      return;
    const selectedKeys = [...selection.value.keys];
    const ids = [...new Set(selectedKeys.map(String))];
    const entity = toValue(batch.entityName);
    const text = messages.value;
    let remaining = ids;
    let submitting = false;
    const errorMessage = ref('');
    pending.value = true;
    try {
      await confirm({
        title: text.title(),
        icon: 'error',
        confirmButtonProps: { danger: true, variant: 'destructive' },
        confirmText: text.confirmText(),
        cancelText: text.cancelText(),
        content: text.confirm(entity, ids.length),
        footer: () =>
          errorMessage.value
            ? h(
                'p',
                {
                  role: 'alert',
                  class: 'text-destructive min-w-0 flex-1 text-sm',
                },
                errorMessage.value,
              )
            : null,
        async beforeClose({ isConfirm }) {
          if (submitting) return false;
          if (!isConfirm) return true;
          if (toValue(batch.enabled) === false) return false;
          submitting = true;
          errorMessage.value = '';
          try {
            if (remaining.length > 0) {
              const { failedIds } = await deleteApi([...remaining]);
              remaining = remaining.filter((id) => failedIds.includes(id));
            }
            try {
              await instance.reload();
            } finally {
              instance.setSelectedRowKeys(
                selectedKeys.filter((key) =>
                  remaining.includes(String(key)),
                ) as number[] | string[],
              );
            }
            if (remaining.length > 0) {
              errorMessage.value = text.partialFailure(
                entity,
                ids.length - remaining.length,
                remaining.length,
              );
              return false;
            }
            message.success(text.success(entity, ids.length));
            return true;
          } catch (error) {
            errorMessage.value =
              error instanceof Error ? error.message : String(error);
            return false;
          } finally {
            submitting = false;
          }
        },
      });
    } catch (error) {
      if (!(error instanceof Error && error.message === 'dialog cancelled'))
        throw error;
    } finally {
      pending.value = false;
    }
  }

  const actions = computed<TableBatchAction[]>(() => {
    const batch = options.value.batch;
    if (!batch || toValue(batch.enabled) === false) return [];
    const result: TableBatchAction[] = (batch.actions ?? []).map((action) => ({
      ...action,
      async onClick() {
        if (
          pending.value ||
          toValue(batch.enabled) === false ||
          toValue(action.disabled)
        )
          return;
        const snapshot = selection.value;
        if (!snapshot.count) return;
        pending.value = true;
        try {
          await action.onClick(snapshot);
        } finally {
          pending.value = false;
        }
      },
    }));
    if (batch.deleteApi)
      result.push({
        key: 'delete',
        label: messages.value.title,
        icon: 'lucide:trash-2',
        danger: true,
        onClick: deleteSelected,
      });
    return result;
  });

  watch(
    [table, actions, pending, messages],
    () => {
      if (!options.value.batch) return;
      table.value?.setProps({
        selectionActions: actions.value,
        selectionLocked: pending.value,
        batchMessages: messages.value,
      });
    },
    { immediate: true },
  );

  return pending;
}
