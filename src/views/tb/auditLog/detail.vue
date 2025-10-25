<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :showOkBtn="false"
    :cancelText="t('common.closeText')"
    @ok="closeModal()"
    @register="registerModal"
    width="50%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <div class="border border-solid border-gray-400 h-120">
      <CodeEditor v-model:value="record.actionData" :readonly="true" :mode="MODE.JSON" />
    </div>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbAuditLogDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { AuditLog } from '/@/api/tb/auditLog';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { meta } = unref(router.currentRoute);
  const record = ref<AuditLog>({} as AuditLog);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('tb.auditLog.detail.detailTitle'),
  }));

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as AuditLog;

    setModalProps({ loading: false });
  });
</script>
