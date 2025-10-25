<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item
            :label="t('tb.otaPackage.form.title')"
            name="title"
            :rules="[{ required: true, message: t('tb.otaPackage.form.titleRequired') }]"
          >
            <Input v-model:value="formState.title" :placeholder="t('tb.otaPackage.form.titlePlaceholder')" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="t('tb.otaPackage.form.version')"
            name="version"
            :rules="[{ required: true, message: t('tb.otaPackage.form.versionRequired') }]"
          >
            <Input v-model:value="formState.version" :placeholder="t('tb.otaPackage.form.versionPlaceholder')" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item :label="t('tb.otaPackage.form.tag')" name="tag" :help="t('tb.otaPackage.form.tagHelp')">
        <Input v-model:value="formState.tag" :placeholder="t('tb.otaPackage.form.tagPlaceholder')" />
      </Form.Item>
      <Form.Item :name="['deviceProfileId', 'entityType']" v-show="false">
        <Input v-model:value="formState.deviceProfileId.entityType" />
      </Form.Item>
      <Form.Item
        :label="t('tb.otaPackage.form.deviceProfile')"
        :name="['deviceProfileId', 'id']"
        :rules="[{ required: true, message: t('tb.otaPackage.form.deviceProfileRequired') }]"
        :help="t('tb.otaPackage.form.deviceProfileHelp')"
      >
        <Select
          v-model:value="formState.deviceProfileId.id"
          :options="deviceProfileOptions"
          :placeholder="t('tb.otaPackage.form.deviceProfilePlaceholder')"
        />
      </Form.Item>
      <Form.Item
        :label="t('tb.otaPackage.form.type')"
        name="type"
        :rules="[{ required: true, message: t('tb.otaPackage.form.typeRequired') }]"
        :help="t('tb.otaPackage.form.typeHelp')"
      >
        <Select v-model:value="formState.type" :defaultValue="'FIRMWARE'" :placeholder="t('tb.otaPackage.form.type')">
          <Select.Option value="FIRMWARE">{{ t('tb.otaPackage.form.firmware') }}</Select.Option>
          <Select.Option value="SOFTWARE">{{ t('tb.otaPackage.form.software') }}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="isURL">
        <RadioGroup
          v-model:value="formState.isURL"
          :options="[
            { label: t('tb.otaPackage.form.uploadBinary'), value: false },
            { label: t('tb.otaPackage.form.useExternalURL'), value: true },
          ]"
        />
      </Form.Item>
      <template v-if="formState.isURL == true">
        <Form.Item
          :label="t('tb.otaPackage.form.url')"
          name="url"
          :rules="[{ required: true, message: t('tb.otaPackage.form.urlRequired') }]"
        >
          <Input v-model:value="formState.url" :placeholder="t('tb.otaPackage.form.urlPlaceholder')" />
        </Form.Item>
      </template>
      <template v-else>
        <Form.Item name="fileList" :rules="[{ validator: validatorFile }]">
          <Upload.Dragger v-model:fileList="fileList" :before-upload="beforeUpload">
            <p class="ant-upload-drag-icon">
              <Icon :icon="'ant-design:upload-outlined'" />
            </p>
            <p class="ant-upload-text">{{ t('tb.otaPackage.form.dragTip') }}</p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item name="autoCheck">
          <Checkbox v-model:checked="formState.autoCheck" @change="handleAutoCheckChange">{{
            t('tb.otaPackage.form.autoCheck')
          }}</Checkbox>
        </Form.Item>
        <template v-if="formState.autoCheck == false">
          <Row :gutter="20">
            <Col :span="10">
              <Form.Item :label="t('tb.otaPackage.form.checksumAlgorithm')" name="checksumAlgorithm">
                <Select v-model:value="formState.checksumAlgorithm" :options="CHECK_SUM_ALGORITHM_OPTIONS" />
              </Form.Item>
            </Col>
            <Col :span="14">
              <Form.Item
                :label="t('tb.otaPackage.form.checksum')"
                name="checksum"
                :help="t('tb.otaPackage.form.checksumHelp')"
              >
                <Input v-model:value="formState.checksum" :placeholder="t('tb.otaPackage.form.checksumPlaceholder')" />
              </Form.Item>
            </Col>
          </Row>
        </template>
      </template>

      <Form.Item :label="t('tb.otaPackage.form.description')" :name="['additionalInfo', 'description']">
        <Textarea
          v-model:value="formState.additionalInfo.description"
          :placeholder="t('tb.otaPackage.form.descriptionPlaceholder')"
        />
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
    value: record.value.id?.id ? t('tb.otaPackage.action.edit') : t('tb.otaPackage.action.add'),
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
      return Promise.reject(t('tb.otaPackage.form.fileRequired'));
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
      showMessage(record.value.id?.id ? t('tb.otaPackage.form.editSuccess') : t('tb.otaPackage.form.addSuccess'));
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
