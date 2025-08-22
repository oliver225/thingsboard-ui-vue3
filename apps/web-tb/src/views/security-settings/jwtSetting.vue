<script lang="ts" setup>
import type { JwtSetting } from '#/api';

import { onMounted, ref } from 'vue';

import { Loading, useVbenForm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, message } from 'ant-design-vue';

import { getJwtSettingApi, saveJwtSettingApi } from '#/api';

defineOptions({
  name: 'JwtSetting',
});

const record = ref<JwtSetting>({} as JwtSetting);

const loading = ref(false);

onMounted(() => {
  fetchData();
});

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('发行者签名'),
      fieldName: 'tokenIssuer',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: $t('请输入发行者签名'),
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('签名秘钥'),
      fieldName: 'tokenSigningKey',
      component: 'Input',
      componentProps: {
        placeholder: $t('请输入tokenSigningKey'),
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('令牌过期时间'),
      fieldName: 'tokenExpirationTime',
      component: 'InputNumber',
      componentProps: {
        min: 10,
        addonAfter: '秒',
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('令牌刷新时间'),
      fieldName: 'refreshTokenExpTime',
      component: 'InputNumber',
      componentProps: {
        min: 10,
        addonAfter: '秒',
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

async function fetchData() {
  try {
    loading.value = true;
    const result = await getJwtSettingApi();
    record.value = result;
    formApi.setValues(result);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(values: Record<string, any>) {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    loading.value = true;
    await saveJwtSettingApi({ ...values });
    fetchData();
    message.success({
      content: `${$t('保存JWT配置成功！')}`,
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
      <div class="my-2 text-lg font-semibold">JWT 安全设置</div>
      <Form />
      <div class="flex gap-4">
        <Button @click="fetchData" class="w-24">
          <IconifyIcon icon="ant-design:reload-outlined" />
          重置
        </Button>
        <Button
          :loading="loading"
          class="w-24"
          type="primary"
          @click="formApi.validateAndSubmitForm"
        >
          <IconifyIcon icon="ant-design:check-outlined" />
          保存
        </Button>
      </div>
    </Loading>
  </div>
</template>
