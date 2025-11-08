<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :can-fullscreen="false"
    @register="registerModal"
    @ok="handleSubmit"
    width="50%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span>{{ getTitle.value }}</span>
    </template>

    <BasicForm @register="registerForm">
      <template #dataUpload="{ model, field }">
        <Upload.Dragger
          v-if="model.resourceSubType == ResourceSubType.EXTENSION"
          accept=".mjs,.js"
          :max-count="1"
          :before-upload="
            async (file) => {
              const base64 = await fileToBase64(file);
              model[field] = base64;
              model['fileName'] = file.name;
              return false;
            }
          "
        >
          <p class="ant-upload-drag-icon">
            <Icon :icon="'ant-design:upload-outlined'" />
          </p>
          <p class="ant-upload-text">{{ t('tb.javascriptLibrary.form.uploadTip') }}</p>
        </Upload.Dragger>
        <div v-if="model.resourceSubType == ResourceSubType.MODULE" class="border border-solid border-gray-400 h-80">
          <CodeEditor v-model:value="model[field]" :mode="MODE.JAVASCRIPT" />
        </div>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbJavascriptLibraryForm',
  });
</script>
<script lang="ts" setup>
  import { Icon } from '/@/components/Icon';
  import { computed, defineComponent, unref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Upload } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { saveResource } from '/@/api/tb/resourceLibrary';
  import { fileToBase64, textToBase64 } from '/@/utils/file/base64Conver';
  import { FormSchema, BasicForm, useForm } from '/@/components/Form';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { JAVASCRIPT_TYPE_OPTIONS, ResourceSubType, ResourceType } from '/@/enums/resourceTypeEnum';
  import { isEmpty } from '/@/utils/is';
  const { meta } = unref(router.currentRoute);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('tb.javascriptLibrary.action.add'),
  }));

  const emit = defineEmits(['register', 'success']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    resetFields();
    setModalProps({ loading: false });
  });

  const inputFormSchemas: FormSchema[] = [
    {
      field: 'resourceType',
      component: 'Input',
      defaultValue: ResourceType.JS_MODULE,
      show: false,
      required: true,
    },
    {
      label: t('tb.javascriptLibrary.form.resourceSubType'),
      field: 'resourceSubType',
      component: 'Select',
      componentProps: {
        options: JAVASCRIPT_TYPE_OPTIONS,
      },
      defaultValue: ResourceSubType.EXTENSION,
      required: true,
    },
    {
      label: t('tb.javascriptLibrary.form.title'),
      field: 'title',
      component: 'Input',
      required: true,
    },
    {
      field: 'fileName',
      component: 'Input',
      show: false,
    },
    {
      label: t('tb.javascriptLibrary.form.upload'),
      field: 'data',
      component: 'Input',
      required: true,
      slot: 'dataUpload',
    },
  ];

  const [registerForm, { resetFields, validate }] = useForm({
    labelWidth: 140,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      if (isEmpty(data.fileName)) {
        data.fileName = data.title + '.js';
      }
      if (data.resourceSubType == ResourceSubType.MODULE) {
        data.data = textToBase64(data.data);
      }

      const result = await saveResource({
        ...data,
      });
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
