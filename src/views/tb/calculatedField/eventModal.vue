<template>
  <BasicModal v-bind="$attrs" :showOkBtn="false" :showFooter="true" @register="registerModal" width="80%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Event ref="eventRef" :pageSize="10" :entityId="record?.id?.id" :entityType="EntityType.CALCULATED_FIELD" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDeviceForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import Event from '/@/views/tb/event/index.vue';
  import { EntityType } from '/@/enums/entityTypeEnum';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { CalculatedField } from '/@/api/tb/calculatedField';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const eventRef = ref();
  const { meta } = unref(router.currentRoute);
  const record = ref<CalculatedField>({} as CalculatedField);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: `${t('tb.calculatedField.title')}调试`,
  }));

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = data || ({} as CalculatedField);

    if (eventRef.value && eventRef.value.reload) {
      eventRef.value.reload();
    }

    setModalProps({ loading: false });
  });
</script>
