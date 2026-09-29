<script lang="ts" setup>
import type { TbUser } from '#/types/tb';

import { h, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { alert } from '@vben-core/popup-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getUserActivationLinkInfo,
  getUserById,
  saveUser,
} from '#/api/tb/user';
import { getLanguageOptions, getUnitSystemOptions } from '#/constants';
import { Authority, EntityType } from '#/enums';
import { $t } from '#/locales';

import ActivationLinkContent from './activation-link-content.vue';

interface TenantAdminFormValues {
  activationMethod: 'DISPLAY_ACTIVATION_LINK' | 'SEND_ACTIVATION_MAIL';
  description?: string;
  email: string;
  firstName?: string;
  lang?: string;
  lastName?: string;
  phone?: string;
  unitSystem?: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | TbUser>(null);

const [Form, formApi] = useVbenForm<TenantAdminFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'email',
        type: 'email',
        placeholder: 'name@example.com',
      },
      defaultValue: '',
      fieldName: 'email',
      label: $t('tenant-admin.fields.email'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('tenant-admin.validation.emailRequired') })
        .pipe(z.email({ error: $t('tenant-admin.validation.emailInvalid') })),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'given-name',
        placeholder: $t('tenant-admin.features.form.firstNamePlaceholder'),
      },
      fieldName: 'firstName',
      label: $t('tenant-admin.fields.firstName'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'family-name',
        placeholder: $t('tenant-admin.features.form.lastNamePlaceholder'),
      },
      fieldName: 'lastName',
      label: $t('tenant-admin.fields.lastName'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'tel',
        type: 'tel',
        placeholder: '+86 138 0013 8000',
      },
      fieldName: 'phone',
      label: $t('tenant-admin.fields.phone'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .nullish()
        .refine(
          (value) => {
            if (!value) return true;
            // 保留国内号码及国际号码的常见分隔符，至少包含 5 位数字。
            return (
              /^[+\d][\d ()-]{4,24}$/.test(value) &&
              value.replaceAll(/\D/g, '').length >= 5
            );
          },
          { message: $t('tenant-admin.validation.phoneFormatTip') },
        ),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('tenant-admin.features.form.descriptionPlaceholder'),
      },
      fieldName: 'description',
      label: $t('tenant-admin.fields.description'),
      formItemClass: 'sm:col-span-2',
    },

    {
      component: 'VbenSelect',
      componentProps: () => ({
        options: getLanguageOptions().map((option) => ({
          ...option,
          value: option.value || 'AUTO',
        })),
        placeholder: $t('account.options.langAuto'),
      }),
      defaultValue: 'AUTO',
      fieldName: 'lang',
      label: $t('account.fields.language'),
    },
    {
      component: 'VbenSelect',
      componentProps: () => ({
        options: getUnitSystemOptions().map((option) => ({
          ...option,
          value: option.value || 'AUTO',
        })),
        placeholder: $t('account.options.unitAuto'),
      }),
      defaultValue: 'AUTO',
      fieldName: 'unitSystem',
      label: $t('account.fields.unitSystem'),
    },
    {
      component: 'VbenSelect',
      componentProps: {
        allowClear: false,
        options: [
          {
            label: $t('authentication.features.activation.showLink'),
            value: 'DISPLAY_ACTIVATION_LINK',
          },
          {
            label: $t('authentication.features.activation.sendMail'),
            value: 'SEND_ACTIVATION_MAIL',
          },
        ],
      },
      defaultValue: 'DISPLAY_ACTIVATION_LINK',
      dependencies: {
        if: () => !record.value?.id,
        triggerFields: ['email'],
      },
      fieldName: 'activationMethod',
      label: $t('authentication.features.activation.method'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{
  tenantId: string;
  userId?: string;
}>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();
    const isCreate = !record.value?.id;
    const sendActivationMail =
      isCreate && formValues.activationMethod === 'SEND_ACTIVATION_MAIL';

    const user: TbUser = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: formValues.description,
        lang:
          formValues.lang === 'AUTO' ? undefined : formValues.lang || undefined,
        unitSystem:
          formValues.unitSystem === 'AUTO'
            ? undefined
            : formValues.unitSystem || undefined,
      },
      authority: Authority.TENANT_ADMIN,
      email: formValues.email.trim(),
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      phone: formValues.phone,
      tenantId: record.value?.tenantId,
    };

    modalApi.lock();
    try {
      const savedUser = await saveUser(user, sendActivationMail);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
      if (isCreate && !sendActivationMail && savedUser.id?.id) {
        await showActivationLink(savedUser.id.id);
      }
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { tenantId, userId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: userId
        ? $t('tenant-admin.actions.edit')
        : $t('tenant-admin.actions.create'),
    });
    modalApi.lock();
    try {
      if (userId) {
        const user = await getUserById(userId);
        record.value = user;
        await formApi.setValues({
          description: user.additionalInfo?.description,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          lang: user.additionalInfo?.lang || 'AUTO',
          unitSystem: user.additionalInfo?.unitSystem || 'AUTO',
        });
      } else if (tenantId) {
        record.value = {
          authority: Authority.TENANT_ADMIN,
          email: '',
          tenantId: { id: tenantId, entityType: EntityType.TENANT },
        };
      } else {
        modalApi.close();
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();

async function showActivationLink(userId: string) {
  const activationLinkInfo = await getUserActivationLinkInfo(userId);
  alert({
    content: () => h(ActivationLinkContent, { activationLinkInfo }),
    containerClass: 'sm:w-[min(52rem,calc(100vw_-_2rem))]!',
    showCancel: true,
    title: $t('authentication.features.activation.linkTitle'),
  }).catch(() => {});
}
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form />
  </Modal>
</template>
