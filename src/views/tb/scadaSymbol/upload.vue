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

    <BasicForm @register="registerForm">
      <template #dataUpload="{ model, field }">
        <div class="flex items-center">
          <div v-if="model.imageBase64" class="h-30 w-30 mr-4">
            <img class="img-content-clip" :src="model.imageBase64" />
          </div>
          <Upload.Dragger
            class="flex-1"
            accept=".svgz,.svg"
            :max-count="1"
            :showUploadList="false"
            :before-upload="
              async (file) => {
                model[field] = file;
                model['imageBase64'] = await imageToBase64(file);
                return false;
              }
            "
          >
            <p class="ant-upload-drag-icon">
              <Icon :icon="'ant-design:upload-outlined'" />
            </p>
            <p class="ant-upload-text">{{ t('tb.images.form.dragTip') }}</p>
          </Upload.Dragger>
        </div>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbScadaSymbolUpload',
  });
</script>
<script lang="ts" setup>
  import { Icon } from '/@/components/Icon';
  import { defineComponent, ref } from 'vue';
  import { Upload } from 'ant-design-vue';
  import { FormSchema, BasicForm, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { uploadImage } from '/@/api/tb/images';
  import { imageToBase64 } from '/@/utils/file/base64Conver';

  const emit = defineEmits(['register', 'success']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const record = ref<ResourceInfo>({} as ResourceInfo);

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'imageBase64',
      component: 'Input',
      show: false,
    },
    {
      label: t('tb.images.form.file'),
      field: 'file',
      component: 'Input',
      slot: 'dataUpload',
      required: true,
    },
    {
      label: t('tb.images.form.title'),
      field: 'title',
      component: 'Input',
      required: true,
    },
  ];

  const [registerForm, { resetFields, validate }] = useForm({
    labelWidth: 100,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    resetFields();
    record.value = { ...data } as ResourceInfo;
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      const result = await uploadImage(data.file, data.title, 'SCADA_SYMBOL');
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
