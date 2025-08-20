<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { AdminSetting } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Loading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Form, Input, message, Switch } from 'ant-design-vue';

import { getAdminSettingsApi, saveAdminSettingsApi } from '#/api';
import { EntityType } from '#/constants';

defineOptions({
  name: 'GeneralSettings',
});
const formRef = ref<FormInstance>();

const record = ref<AdminSetting>({} as AdminSetting);

const loading = ref(false);

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

function clear() {
  formState.tenantId = { entityType: EntityType.TENANT, id: '' };
  formState.key = 'general';
  formState.jsonValue = { baseUrl: '', prohibitDifferentUrl: '' };
}

async function fetchData() {
  try {
    loading.value = true;
    clear();
    record.value = await getAdminSettingsApi('general');
    Object.keys(record.value).forEach((key) => {
      const k = key as keyof AdminSetting;
      formState[k] = record.value[k];
    });
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    const data = await formRef.value?.validate();
    loading.value = true;
    // console.log('submit', params, data, record);
    await saveAdminSettingsApi({ ...record.value, ...data });
    fetchData();
    message.success({
      content: `${$t('保存通用配置成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div>
    <Loading :spinning="loading">
      <template #icon>
        <IconifyIcon
          icon="svg-spinners:bars-scale"
          class="text-primary size-12"
        />
      </template>
      <div class="my-2 text-lg font-semibold">基本设置</div>
      <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item
          label="基本URL"
          :name="['jsonValue', 'baseUrl']"
          :rules="[{ required: true, message: '请输入基本URL' }]"
        >
          <Input
            size="large"
            v-model:value="formState.jsonValue.baseUrl"
            placeholder="请输入基本URL"
          />
        </Form.Item>
        <Form.Item
          :name="['jsonValue', 'prohibitDifferentUrl']"
          help="应为生产环境启用此设置。禁用时可能会导致安全问题"
        >
          <div
            class="rounded-[var(--radius)] border border-solid border-[hsl(var(--border))] px-4 py-3 hover:border-[hsl(var(--primary))]"
          >
            <Switch
              size="small"
              v-model:checked="formState.jsonValue.prohibitDifferentUrl"
            />
            <span class="ml-2"> 禁止从客户端请求头中使用主机名 </span>
          </div>
        </Form.Item>
      </Form>
      <div class="flex gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
        </Button>
        <Button
          :loading="loading"
          class="w-24"
          type="primary"
          @click="handleSubmit"
        >
          <IconifyIcon icon="ant-design:check-outlined" />
          保存
        </Button>
      </div>
    </Loading>
  </div>
</template>
