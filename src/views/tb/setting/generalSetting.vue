<template>
  <Spin :spinning="dataLoading">
    <div class="general-setting">
      <div class="text-lg font-bold my-4">基本设置</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item
          label="基本URL"
          :name="['jsonValue', 'baseUrl']"
          :rules="[{ required: true, message: '请输入基本URL!' }]"
        >
          <Input v-model:value="formState.jsonValue.baseUrl" placeholder="请输入基本URL" />
        </Form.Item>
        <Form.Item
          :name="['jsonValue', 'prohibitDifferentUrl']"
          help="应为生产环境启用此设置。禁用时可能会导致安全问题"
        >
          <div class="border border-solid border-neutral-300 rounded-md px-4 py-3">
            <Switch size="small" v-model:checked="formState.jsonValue.prohibitDifferentUrl" />
            <span class="ml-2"> 禁止从客户端请求头中使用主机名 </span>
          </div>
        </Form.Item>
      </Form>

      <div class="footer">
        <Space>
          <a-button @click="fetchData">
            <Icon :icon="'ant-design:reload-outlined'" />
            重置
          </a-button>
          <a-button :loading="dataLoading" type="primary" @click="handleSubmit">
            <Icon :icon="'ant-design:check-outlined'" />
            保存
          </a-button>
        </Space>
      </div>
    </div>
  </Spin>
</template>
<script lang="ts" setup name="ViewsTbSettingGeneralSetting">
  import { ref, onMounted, reactive } from 'vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { getAdminSetting, saveAdminSetting, AdminSetting } from '/@/api/tb/adminSetting';
  import { Switch, Space, Spin, Form, Input } from 'ant-design-vue';

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const formRef = ref<FormInstance>();
  const record = ref<AdminSetting>({} as AdminSetting);
  const dataLoading = ref(false);

  const formState = reactive<AdminSetting>({
    tenantId: { entityType: EntityType.TENANT, id: '' },
    key: 'general',
    jsonValue: {
      baseUrl: '',
      prohibitDifferentUrl: '',
    },
  } as AdminSetting);

  onMounted(() => {
    fetchData();
  });

  async function fetchData() {
    try {
      dataLoading.value = true;
      clear();
      const result = await getAdminSetting('general');
      record.value = result;
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }
  function clear() {
    formState.tenantId = { entityType: EntityType.TENANT, id: '' };
    formState.key = 'general';
    formState.jsonValue = { baseUrl: '', prohibitDifferentUrl: '' };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      dataLoading.value = true;
      // console.log('submit', params, data, record);
      const res = await saveAdminSetting({ ...record.value, ...data });
      fetchData();
      showMessage('保存通用配置成功！');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      dataLoading.value = false;
    }
  }
</script>
<style lang="less">
  .general-setting {
    padding: 6px 46px 24px 24px;

    .footer {
      margin-top: 42px;
    }
  }
</style>
