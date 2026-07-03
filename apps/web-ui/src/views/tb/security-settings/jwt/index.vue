<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { JwtSettings } from '#/api/tb/admin';

import { h, onMounted } from 'vue';

import { confirm, VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getJwtSettings, saveJwtSettings } from '#/api/tb/admin';

const accessStore = useAccessStore();
let loadedIssuer = '';
let loadedSigningKey = '';

/** 生成签名密钥:64 位随机字符的 base64 */
function genSigningKey() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let raw = '';
  for (let i = 0; i < 64; i += 1) {
    raw += chars[Math.floor(Math.random() * chars.length)];
  }
  return btoa(raw);
}

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { allowClear: true, size: 'large' },
    fieldName: 'tokenIssuer',
    label: $t('tb.securitySettings.jwt.tokenIssuer'),
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { size: 'large' },
    fieldName: 'tokenSigningKey',
    label: $t('tb.securitySettings.jwt.tokenSigningKey'),
    renderComponentContent: (_values: any, formApi: any) => ({
      addonAfter: () =>
        h(
          'a',
          {
            class: 'cursor-pointer',
            onClick: () =>
              formApi.setFieldValue('tokenSigningKey', genSigningKey()),
          },
          $t('tb.securitySettings.jwt.generateKey'),
        ),
    }),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 60, precision: 0, size: 'large' },
    fieldName: 'tokenExpirationTime',
    label: $t('tb.securitySettings.jwt.tokenExpirationTime'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 900, precision: 0, size: 'large' },
    dependencies: {
      rules: (values: any) =>
        z
          .number({ message: $t('tb.securitySettings.requiredField') })
          .refine((v) => v > (values.tokenExpirationTime ?? 0), {
            message: $t('tb.securitySettings.jwt.refreshLessToken'),
          }),
      triggerFields: ['tokenExpirationTime', 'refreshTokenExpTime'],
    },
    fieldName: 'refreshTokenExpTime',
    label: $t('tb.securitySettings.jwt.refreshTokenExpTime'),
  },
];

const [JwtForm, jwtFormApi] = useVbenForm({
  layout: 'vertical',
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

async function loadJwt() {
  try {
    const data = await getJwtSettings();
    loadedIssuer = data.tokenIssuer ?? '';
    loadedSigningKey = data.tokenSigningKey ?? '';
    await jwtFormApi.setValues({ ...data });
  } catch {
    // 读取失败(如权限不足)静默
  }
}

async function doSaveJwt(values: JwtSettings) {
  const pair = await saveJwtSettings(values);
  // 令牌已轮换,写回以保持当前会话登录
  if (pair?.token) {
    accessStore.setAccessToken(pair.token);
    accessStore.setRefreshToken(pair.refreshToken);
  }
  await loadJwt();
  message.success($t('tb.common.saveSuccess'));
}

async function saveJwt() {
  const { valid } = await jwtFormApi.validate();
  if (!valid) {
    return;
  }
  const values = await jwtFormApi.getValues<JwtSettings>();
  const sensitiveChanged =
    values.tokenIssuer !== loadedIssuer ||
    values.tokenSigningKey !== loadedSigningKey;
  if (!sensitiveChanged) {
    await doSaveJwt(values);
    return;
  }
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      await doSaveJwt(values);
    },
    content: $t('tb.securitySettings.jwt.changeWarning'),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.securitySettings.jwt.changeWarningTitle'),
  }).catch(() => {});
}

onMounted(loadJwt);
</script>

<template>
  <div class="border-border bg-card rounded-lg border px-5 py-4">
    <div class="text-lg font-semibold">
      {{ $t('tb.securitySettings.jwt.title') }}
    </div>

    <div class="mt-4">
      <JwtForm />
    </div>

    <div class="mt-2 flex items-center justify-start gap-2">
      <VbenButton variant="outline" @click="loadJwt">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton @click="saveJwt">
        {{ $t('tb.common.save') }}
      </VbenButton>
    </div>
  </div>
</template>
