<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    @ok="handleDelete"
    width="40%"
    :okButtonProps="{
      type: 'primary',
      danger: true,
    }"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" color="red" />
      <span> {{ t('tb.telemetry.deleteModal.title') }} </span>
    </template>

    <BasicForm @register="registerForm">
      <template #info>
        {{ t('tb.telemetry.deleteModal.infoPrefix') }}<br />
        <Space wrap>
          <Tag v-for="(key, index) in record?.keys" :key="index">{{ key }}</Tag>
        </Space>
      </template>
      <template #deleteAllDataForKeys="{ model, field }">
        <div class="w-full">
          <Radio.Group v-model:value="model[field]" button-style="solid" @change="handleDelAllDataChange">
            <Radio.Button :value="true">{{ t('tb.telemetry.deleteModal.deleteAll') }}</Radio.Button>
            <Radio.Button :value="false">{{ t('tb.telemetry.deleteModal.deleteByTime') }}</Radio.Button>
          </Radio.Group>
        </div>
      </template>
      <template #rewriteLatestIfDeleted="{ model, field }">
        <Checkbox v-model:checked="model[field]">{{ t('tb.telemetry.deleteModal.rewriteLatest') }}</Checkbox>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="TelemetryDelete">
  import { ref, computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Tag, Checkbox, Radio, Space } from 'ant-design-vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { TelemetryDelete, deleteEntityTimeseries } from '/@/api/tb/telemetry';
  import { isArray, isEmpty } from 'lodash-es';
  import dayjs from 'dayjs';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const record = ref<TelemetryDelete>();

  const getTitle = computed(() => ({
    icon: 'ant-design:delete-outlined',
    value: t('tb.telemetry.deleteModal.title'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'info',
      component: 'Text',
      slot: 'info',
    },
    {
      field: 'deleteAllDataForKeys',
      component: 'RadioGroup',
      defaultValue: true,
      slot: 'deleteAllDataForKeys',
    },
    {
      field: 'startTs',
      component: 'RangePicker',
      componentProps: {
        showTime: true,
      },
      ifShow: false,
      rules: [{ required: true, message: t('tb.telemetry.deleteModal.rangeRequired') }],
    },
    {
      field: 'rewriteLatestIfDeleted',
      defaultValue: true,
      component: 'Checkbox',
      componentProps: {
        maxlength: 100,
      },
      slot: 'rewriteLatestIfDeleted',
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });
  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = data;
    resetFields();
    handleDelAllDataChange({ target: { value: true } });
    setModalProps({ loading: false });
  });

  async function handleDelete() {
    try {
      if (isEmpty(record.value)) {
        showMessage(t('tb.telemetry.deleteModal.notFound'), 'error');
        return;
      }
      const data = await validate();
      setModalProps({ confirmLoading: true });
      if (data.startTs && isArray(data.startTs)) {
        const tmp = data.startTs;
        data.startTs = dayjs(tmp[0]).valueOf();
        data.endTs = dayjs(tmp[1]).valueOf();
      }
      await deleteEntityTimeseries({ ...record.value, ...data, keys: record.value.keys.join(',') });
      showMessage(t('tb.telemetry.deleteModal.success'));
      setTimeout(closeModal);
      emit('success', {});
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  function handleDelAllDataChange({ target: { value } }) {
    updateSchema({
      field: 'startTs',
      component: 'RangePicker',
      componentProps: {
        showTime: true,
      },
      required: true,
      ifShow: !!!value,
    });
  }
</script>
