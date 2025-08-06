<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :ok-text="'上传'"
    :can-fullscreen="false"
    @register="registerModal"
    @ok="handleSubmit"
    width="50%"
  >
    <template #title>
      <Icon icon="ant-design:upload-outlined" class="pr-1 m-1" />
      <span> 上传图片 </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="fileList" :rules="[{ validator: validatorFile }]">
        <Upload.Dragger
          v-model:fileList="formState.fileList"
          accept="image/*"
          list-type="picture"
          :maxCount="1"
          :before-upload="beforeUpload"
        >
          <p class="ant-upload-drag-icon">
            <Icon :icon="'ant-design:upload-outlined'" />
          </p>
          <p class="ant-upload-text">拖放或者点击选择一个图片</p>
        </Upload.Dragger>
      </Form.Item>
      <Form.Item
        v-show="formState.fileList.length > 0"
        label="标题"
        name="title"
        :rules="[{ required: true, message: '请输入标题!' }]"
      >
        <Input v-model:value="formState.title" placeholder="请输入标题" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ImageUpload',
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

  const { t } = useI18n('things');
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
      return Promise.reject('请选择一个图片！');
    } else {
      return Promise.resolve();
    }
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      setModalProps({ confirmLoading: true });
      if (data == undefined) {
        throw new Error('数据为空');
      }
      const result = await uploadImage(data.fileList[0].originFileObj, data.title);
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
