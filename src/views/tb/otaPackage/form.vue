<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item label="标题" name="title" :rules="[{ required: true, message: '请输入标题!' }]">
            <Input v-model:value="formState.title" placeholder="请输入标题" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="版本" name="version" :rules="[{ required: true, message: '请输入版本!' }]">
            <Input v-model:value="formState.version" placeholder="请输入版本" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="版本标签" name="tag" help="自定义标签应与您设备报告的软件包版本相匹配。">
        <Input v-model:value="formState.tag" placeholder="请输入版本标签" />
      </Form.Item>
      <Form.Item :name="['deviceProfileId', 'entityType']" v-show="false">
        <Input v-model:value="formState.deviceProfileId.entityType" />
      </Form.Item>
      <Form.Item
        label="设备配置"
        :name="['deviceProfileId', 'id']"
        :rules="[{ required: true, message: '请选择设备配置' }]"
        help="上传的包仅适用于具有所选配置的设备。"
      >
        <Select
          v-model:value="formState.deviceProfileId.id"
          :options="deviceProfileOptions"
          placeholder="请选择设备配置"
        />
      </Form.Item>
      <Form.Item
        label="包类型"
        name="type"
        :rules="[{ required: true, message: '请选择包类型' }]"
        help="上传包后，您将无法修改标题、版本、设备配置和包类型"
      >
        <Select v-model:value="formState.type" :defaultValue="'FIRMWARE'" placeholder="请选择包类型">
          <Select.Option value="FIRMWARE">固件</Select.Option>
          <Select.Option value="SOFTWARE">软件</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="isURL">
        <RadioGroup
          v-model:value="formState.isURL"
          :options="[
            { label: '上传二进制文件', value: false },
            { label: '使用外部URL', value: true },
          ]"
        />
      </Form.Item>
      <template v-if="formState.isURL == true">
        <Form.Item label="直接URL" name="url" :rules="[{ required: true, message: '请输入直接URL' }]">
          <Input v-model:value="formState.url" placeholder="请输入直接URL" />
        </Form.Item>
      </template>
      <template v-else>
        <Form.Item name="fileList" :rules="[{ validator: validatorFile }]">
          <Upload.Dragger v-model:fileList="fileList" :before-upload="beforeUpload">
            <p class="ant-upload-drag-icon">
              <Icon :icon="'ant-design:upload-outlined'" />
            </p>
            <p class="ant-upload-text">拖放或者点击选择一个文件</p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item name="autoCheck">
          <Checkbox v-model:checked="formState.autoCheck" @change="handleAutoCheckChange">自动生成校验和</Checkbox>
        </Form.Item>
        <template v-if="formState.autoCheck == false">
          <Row :gutter="20">
            <Col :span="10">
              <Form.Item label="校验和算法" name="checksumAlgorithm">
                <Select v-model:value="formState.checksumAlgorithm" :options="CHECK_SUM_ALGORITHM_OPTIONS" />
              </Form.Item>
            </Col>
            <Col :span="14">
              <Form.Item label="校验和" name="checksum" help="如果校验和为空，会自动生成">
                <Input v-model:value="formState.checksum" placeholder="请输入校验和" />
              </Form.Item>
            </Col>
          </Row>
        </template>
      </template>

      <Form.Item label="说明" :name="['additionalInfo', 'description']">
        <Textarea v-model:value="formState.additionalInfo.description" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbOtaPackageForm">
  import { Icon } from '/@/components/Icon';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { computed, reactive, ref, unref, watch } from 'vue';
  import { getDeviceProfileInfoList } from '/@/api/tb/deviceProfile';
  import { Checkbox, Col, Form, Input, RadioGroup, Row, Select, Textarea, Upload } from 'ant-design-vue';
  import { OtaPackageInfo, getOtaPackageInfoById, saveOtaPackageInfo, saveOtaPackageData } from '/@/api/tb/otaPackage';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { router } from '/@/router';
  import { CHECK_SUM_ALGORITHM, CHECK_SUM_ALGORITHM_OPTIONS } from '/@/enums/otaPackageEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const fileList = ref<Array<any>>([]);
  const formRef = ref<FormInstance>();

  const record = ref<OtaPackageInfo>({} as OtaPackageInfo);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑OTA包') : t('添加OTA包'),
  }));

  const deviceProfileOptions = ref<Array<any>>();

  const formState = reactive<any>({
    title: '',
    version: '',
    tag: '',
    type: 'FIRMWARE',
    deviceProfileId: { entityType: EntityType.DEVICE_PROFILE, id: '' },
    isURL: false,
    url: '',
    autoCheck: true,
    checksumAlgorithm: CHECK_SUM_ALGORITHM.SHA256,
    checksum: '',
    additionalInfo: { description: '' },
  });

  watch([() => formState.title, () => formState.version], () => {
    formState.tag = (formState.title || '') + ' ' + (formState.version || '');
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as OtaPackageInfo;
    clear();
    if (data?.id?.id) {
      const res = await getOtaPackageInfoById(data.id.id);
      record.value = (res || {}) as OtaPackageInfo;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    }
    await fetchDeviceProfile();
    setModalProps({ loading: false });
  });

  function clear() {
    formState.title = undefined;
    formState.version = undefined;
    formState.tag = undefined;
    formState.type = 'FIRMWARE';
    formState.deviceProfileId.if = undefined;
    formState.isURL = false;
    formState.url = undefined;
    formState.autoCheck = true;
    formState.checksumAlgorithm = CHECK_SUM_ALGORITHM.SHA256;
    formState.checksum = undefined;
    formState.additionalInfo = { description: undefined };
    fileList.value = [];
  }

  function validatorFile() {
    if (formState.isURL == false && fileList.value.length < 1) {
      return Promise.reject('请选择一个软件包！');
    } else {
      return Promise.resolve();
    }
  }

  async function fetchDeviceProfile() {
    const res = await getDeviceProfileInfoList({
      pageSize: 2147483647,
      page: 0,
      sortProperty: 'name',
      sortOrder: 'ASC',
    });
    deviceProfileOptions.value = res.data.map((profile) => ({ label: profile.name, value: profile.id?.id }));
  }

  function handleAutoCheckChange() {
    formState.checksumAlgorithm = CHECK_SUM_ALGORITHM.SHA256;
  }

  function beforeUpload(file: any) {
    fileList.value = [file];
    return false;
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      // const data = await validate();
      setModalProps({ confirmLoading: true });

      // console.log('submit', params, data, record);
      const res = await saveOtaPackageInfo({ ...data, id: record.value.id }).then(async (packageInfo) => {
        if (formState.isURL == false) {
          return await saveOtaPackageData({
            otaPackageId: packageInfo.id.id,
            file: fileList.value[0].originFileObj,
            checksumAlgorithm: formState.checksumAlgorithm,
            checksum: formState.checksum,
          });
        }
      });
      showMessage(`${record.value.id?.id ? '修改' : '添加'}OTA包成功！`);
      setTimeout(closeModal);
      emit('success', data);
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
