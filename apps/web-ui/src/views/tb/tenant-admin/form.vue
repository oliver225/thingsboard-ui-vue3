<script lang="ts" setup>
import type { TbUser } from '#/types/tb';

import { computed, defineComponent, h, onUnmounted, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getUserActivationLinkInfo,
  getUserById,
  saveUser,
} from '#/api/tb/user';
import {
  PHONE_PATTERN,
  SUPPORT_LANGUAGES,
  UNIT_SYSTEM_OPTIONS,
} from '#/constants';
import { Authority, EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | TbUser>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('tb.tenantAdmin.fields.email'),
      rules: z
        .string()
        .min(1, { message: $t('tb.tenantAdmin.validation.emailRequired') })
        .email({ message: $t('tb.tenantAdmin.validation.emailInvalid') }),
    },
    {
      component: 'Input',
      fieldName: 'firstName',
      label: $t('tb.tenantAdmin.fields.firstName'),
      rules: z
        .string()
        .min(1, { message: $t('tb.tenantAdmin.validation.firstNameRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'lastName',
      label: $t('tb.tenantAdmin.fields.lastName'),
    },
    {
      component: 'PhoneInput',
      fieldName: 'phone',
      label: $t('tb.tenantAdmin.fields.phone'),
      rules: z
        .string()
        .optional()
        .refine((value) => !value || PHONE_PATTERN.test(value), {
          message: $t('tb.tenantAdmin.validation.phoneFormatTip'),
        }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.tenantAdmin.fields.description'),
    },

    {
      component: 'Select',
      componentProps: {
        options: SUPPORT_LANGUAGES,
        placeholder: $t('tb.account.langAuto'),
        style: { width: '100%' },
      },
      fieldName: 'lang',
      label: $t('tb.account.language'),
    },
    {
      component: 'Select',
      componentProps: {
        options: UNIT_SYSTEM_OPTIONS,
        placeholder: $t('tb.account.unitAuto'),
        style: { width: '100%' },
      },
      fieldName: 'unitSystem',
      label: $t('tb.account.unitSystem'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: [
          {
            label: $t('tb.tenantAdmin.activation.showLink'),
            value: false,
          },
          {
            label: $t('tb.tenantAdmin.activation.sendMail'),
            value: true,
          },
        ],
        style: { width: '100%' },
      },
      defaultValue: false,
      dependencies: {
        if: () => !record.value?.id,
        triggerFields: ['email'],
      },
      fieldName: 'sendActivationMail',
      label: $t('tb.tenantAdmin.activation.method'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    const sendActivationMail = !record.value?.id && values.sendActivationMail;

    const user: TbUser = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: values.description,
        lang: values.lang,
        unitSystem: values.unitSystem,
      },
      authority: Authority.TENANT_ADMIN,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      tenantId: record.value?.tenantId,
    };

    modalApi.lock();
    try {
      const saved = await saveUser(user, sendActivationMail);
      message.success($t('tb.common.saveSuccess'));
      const needLink =
        !record.value?.id && !sendActivationMail && !!saved.id?.id;
      modalApi.close();
      emit('success');
      if (needLink && saved.id?.id) {
        await showActivationLink(saved.id.id);
      }
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<{ tenantId: string; userId?: string }>() ?? {
      tenantId: '',
    };
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: data.userId
        ? $t('tb.tenantAdmin.actions.edit')
        : $t('tb.tenantAdmin.actions.create'),
    });
    if (data.userId) {
      const user = await getUserById(data.userId);
      record.value = user;
      await formApi.setValues({
        description: user.additionalInfo?.description,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        lang: user.additionalInfo?.lang,
        unitSystem: user.additionalInfo?.unitSystem,
      });
    } else {
      record.value = {
        tenantId: { id: data.tenantId, entityType: EntityType.TENANT },
      } as unknown as TbUser;
    }
  },
});

async function showActivationLink(userId: string) {
  const { ttlMs, value } = await getUserActivationLinkInfo(userId);
  confirm({
    content: createActivationContent(value, ttlMs),
    showCancel: false,
    title: $t('tb.tenantAdmin.activation.linkTitle'),
  }).catch(() => {});
}

/** 把剩余毫秒格式化为「{h} 小时 {m} 分钟 {s} 秒」 */
function formatTtl(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return $t('tb.tenantAdmin.activation.duration', {
    h: hours,
    m: minutes,
    s: seconds,
  });
}

async function copyActivationLink(link: string) {
  await navigator.clipboard.writeText(link);
  message.success($t('tb.tenantAdmin.activation.copied'));
}

/** 激活链接对话框内容:带可点击链接、剩余有效期倒计时、复制按钮 */
function createActivationContent(link: string, ttlMs: number) {
  return defineComponent({
    setup() {
      const remaining = ref(ttlMs);
      const timer = window.setInterval(() => {
        remaining.value -= 1000;
        if (remaining.value <= 0) {
          remaining.value = 0;
          window.clearInterval(timer);
        }
      }, 1000);
      onUnmounted(() => window.clearInterval(timer));

      const countdown = computed(() => formatTtl(remaining.value));

      return () =>
        h('div', { class: 'space-y-3' }, [
          h('div', { class: 'text-sm leading-6' }, [
            $t('tb.tenantAdmin.activation.descBefore'),
            h(
              'a',
              {
                class: 'text-primary hover:underline',
                href: link,
                rel: 'noopener noreferrer',
                target: '_blank',
              },
              $t('tb.tenantAdmin.activation.linkWord'),
            ),
            $t('tb.tenantAdmin.activation.expireTip', {
              duration: countdown.value,
            }),
          ]),
          h(
            'div',
            {
              class: 'bg-accent flex items-center gap-2 rounded-md px-3 py-2',
            },
            [
              h('span', { class: 'flex-1 break-all font-mono text-xs' }, link),
              h(
                'button',
                {
                  class: 'text-muted-foreground hover:text-primary shrink-0',
                  onClick: () => copyActivationLink(link),
                  title: $t('tb.tenantAdmin.activation.copyLink'),
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
</script>

<template>
  <Modal
    class="w-1/3"
    :centered="true"
    :fullscreen-button="false"
    :close-on-click-modal="false"
  >
    <Form />
  </Modal>
</template>
