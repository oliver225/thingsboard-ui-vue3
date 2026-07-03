<script lang="ts" setup>
/**
 * API 密钥 新建/编辑弹窗(useVbenModal + useVbenForm)
 * 新建:描述 + 启用 + 过期日期(预设时长);编辑:仅描述
 * token 仅在创建时返回一次,创建成功后用 confirm 对话框一次性展示(同租户管理员激活链接的模式)。
 */
import type { ApiKeyInfo } from '#/api/tb/api-key';

import { defineComponent, h, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { Alert, message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { saveApiKey, updateApiKeyDescription } from '#/api/tb/api-key';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const userStore = useUserStore();

const editing = ref<ApiKeyInfo | null>(null);

/** 过期时间预设(返回时间戳;0 表示永不过期) */
function buildExpirationOptions() {
  const day = 24 * 60 * 60 * 1000;
  const make = (days: number) => {
    const ts = Date.now() + days * day;
    return {
      label: `${days} ${$t('tb.apiKey.days')} (${formatDate(ts)})`,
      value: ts,
    };
  };
  return [
    { label: $t('tb.apiKey.never'), value: 0 },
    make(7),
    make(30),
    make(60),
    make(90),
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: { colon: true, labelWidth: 100 },
  schema: [
    {
      component: 'Textarea',
      componentProps: { maxlength: 255, rows: 3, showCount: true },
      fieldName: 'description',
      label: $t('tb.apiKey.description'),
      rules: z.string().min(1, { message: $t('tb.apiKey.descriptionTip') }),
    },
    // 仅新建时可设置启用状态与过期时间(编辑时通过 dependencies.if 隐藏)
    {
      component: 'Checkbox',
      defaultValue: true,
      dependencies: {
        if: () => !editing.value,
        triggerFields: ['description'],
      },
      fieldName: 'enabled',
      label: '',
      renderComponentContent: () => ({
        default: () => $t('tb.apiKey.enableLabel'),
      }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: buildExpirationOptions(),
        style: { width: '100%' },
      },
      defaultValue: 0,
      dependencies: {
        if: () => !editing.value,
        triggerFields: ['description'],
      },
      fieldName: 'expirationTime',
      label: $t('tb.apiKey.expiration'),
    },
  ],
  showDefaultActions: false,
});

async function copyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token);
    message.success($t('tb.account.copied'));
  } catch {
    message.error($t('tb.account.copyFailed'));
  }
}

/** 一次性 token 对话框内容:警告文案 + token 框 + 复制按钮 */
function createTokenContent(token: string) {
  return defineComponent({
    setup() {
      return () =>
        h('div', { class: 'space-y-3' }, [
          h(
            'div',
            { class: 'text-warning text-sm leading-6' },
            $t('tb.apiKey.tokenOnce'),
          ),
          h(
            'div',
            { class: 'bg-accent flex items-center gap-2 rounded-md px-3 py-2' },
            [
              h('span', { class: 'flex-1 break-all font-mono text-xs' }, token),
              h(
                'button',
                {
                  class: 'text-muted-foreground hover:text-primary shrink-0',
                  onClick: () => copyToken(token),
                  title: $t('tb.apiKey.copyToken'),
                  type: 'button',
                },
                h(IconifyIcon, { class: 'size-4', icon: 'lucide:clipboard' }),
              ),
            ],
          ),
        ]);
    },
  });
}

function showToken(token: string) {
  confirm({
    content: createTokenContent(token),
    showCancel: false,
    title: $t('tb.apiKey.tokenTitle'),
  }).catch(() => {});
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    modalApi.lock();
    try {
      let token = '';
      if (editing.value) {
        await updateApiKeyDescription(
          editing.value.id?.id as string,
          values.description,
        );
      } else {
        const apiKey = await saveApiKey({
          description: values.description,
          enabled: values.enabled ?? true,
          expirationTime: values.expirationTime ?? 0,
          userId: {
            entityType: EntityType.USER,
            id: userStore.userInfo?.userId ?? '',
          },
        });
        token = apiKey.value ?? '';
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
      if (token) {
        showToken(token);
      }
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { apiKey } = modalApi.getData<{ apiKey?: ApiKeyInfo }>() ?? {};
    editing.value = apiKey ?? null;
    await formApi.resetForm();
    modalApi.setState({
      title: apiKey ? $t('tb.apiKey.edit') : $t('tb.apiKey.create'),
    });
    if (apiKey) {
      await formApi.setValues({ description: apiKey.description });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :fullscreen-button="false"
    :close-on-click-modal="false"
  >
    <Alert
      v-if="!editing"
      :title="$t('tb.apiKey.inheritTip')"
      type="warning"
      class="!mb-4"
      show-icon
    />
    <Form />
  </Modal>
</template>
