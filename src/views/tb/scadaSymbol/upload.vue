<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :ok-text="t('tb.images.form.upload')"
    :can-fullscreen="false"
    @register="registerModal"
    @ok="handleSubmit"
    width="50%"
  >
    <template #title>
      <Icon icon="ant-design:upload-outlined" class="pr-1 m-1" />
      <span>{{ t('tb.scadaSymbol.action.upload') }}</span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="fileList" :rules="[{ validator: validatorFile }]">
        <Upload.Dragger
          v-model:fileList="formState.fileList"
          accept=".svgz,.svg"
          list-type="picture"
          :maxCount="1"
          :before-upload="beforeUpload"
        >
          <p class="ant-upload-drag-icon">
            <Icon :icon="'ant-design:upload-outlined'" />
          </p>
          <p class="ant-upload-text">{{ t('tb.images.form.dragTip') }}</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item
        v-show="formState.fileList.length > 0"
        :label="t('tb.scadaSymbol.table.name')"
        name="title"
        :rules="[{ required: true, message: t('tb.images.form.titleRequired') }]"
      >
        <Input v-model:value="formState.title" :placeholder="t('tb.images.form.titlePlaceholder')" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbScadaSymbolUpload',
  });
</script>
<script lang="ts" setup>
  import { Icon } from '/@/components/Icon';
  import { defineComponent, ref, reactive } from 'vue';
  import { Form, Upload, Input } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { uploadImage } from '/@/api/tb/images';

  const emit = defineEmits(['register', 'success']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const formRef = ref<FormInstance>();

  const record = ref<ResourceInfo>({} as ResourceInfo);

  const formState = reactive<any>({
    fileList: [],
    title: '',
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { ...data } as ResourceInfo;
    setModalProps({ loading: false });
  });

  function beforeUpload(file: any) {
    formState.fileList = [file];
    formState.title = file.name;
    return false;
  }

  function clear() {
    record.value = {} as ResourceInfo;
    formState.fileList = [];
    formState.title = '';
  }

  function validatorFile() {
    if (formState.fileList.length < 1) {
      return Promise.reject(t('tb.images.form.fileRequired'));
    } else {
      return Promise.resolve();
    }
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      setModalProps({ confirmLoading: true });
      if (data == undefined) {
        throw new Error(t('tb.images.message.dataEmpty'));
      }
      const result = await uploadImage(data.fileList[0].originFileObj, data.title, 'SCADA_SYMBOL');
      setTimeout(closeModal);
      emit('success', result);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
