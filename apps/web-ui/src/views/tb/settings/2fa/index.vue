<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type {
  PlatformTwoFaSettings,
  SystemLevelUsersFilter,
  TwoFaProviderConfig,
} from '#/api/tb/two-factor-auth';

import { h, onMounted, ref } from 'vue';

import { VbenButton, VbenSegmented } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'antdv-next';

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  getPlatformTwoFaSettings,
  savePlatformTwoFaSettings,
} from '#/api/tb/two-factor-auth';
import { FormSection } from '#/components/form-section';
import { TwoFaProviderType } from '#/enums';
import { useFormRequest } from '#/hooks/use-form-request';

import SettingsPanel from '../components/settings-panel.vue';

interface ProviderValues extends Omit<TwoFaProviderConfig, 'providerType'> {
  enable: boolean;
}
type ProvidersValues = Record<TwoFaProviderType, ProviderValues>;
interface EnforcementValues {
  enforceTwoFa: boolean;
  type: string;
  filterByTenants: 'tenantProfiles' | 'tenants';
  tenantsIds: string[];
  tenantProfilesIds: string[];
}
interface LimitsValues {
  totalAllowedTimeForVerification: number;
  minVerificationCodeSendPeriod: number;
  maxVerificationFailuresBeforeUserLockout: number;
  rateLimitEnable: boolean;
  rateLimitNumber: number;
  rateLimitTime: number;
}

const { isLoading, isSaving, isReady, read, write } = useFormRequest();
const PROVIDERS = [
  TwoFaProviderType.TOTP,
  TwoFaProviderType.SMS,
  TwoFaProviderType.EMAIL,
  TwoFaProviderType.BACKUP_CODE,
];
const ENFORCE_TYPES = [
  'ALL_USERS',
  'TENANT_ADMINISTRATORS',
  'SYSTEM_ADMINISTRATORS',
];
const nonBackupEnabled = ref(false);

const formLayout = {
  layout: 'vertical',
  showDefaultActions: false,
  commonConfig: { labelClass: 'text-sm font-medium', formItemClass: 'pb-0' },
  wrapperClass: 'grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
} as const;
const isDisabled = () => !isReady.value || isLoading.value || isSaving.value;

function numberRule(min: number, max = Number.MAX_SAFE_INTEGER) {
  return z
    .number({ message: $t('settings.validation.requiredField') })
    .int({ message: $t('settings.validation.twoFactor') })
    .min(min, { message: $t('settings.validation.twoFactor') })
    .max(max, { message: $t('settings.validation.twoFactor') });
}

function numberField(
  fieldName: string,
  label: string,
  min: number,
  max?: number,
): VbenFormSchema {
  return {
    component: 'InputNumber',
    componentProps: () => ({
      class:
        '!h-10 !w-full !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full',
      disabled: isDisabled(),
      precision: 0,
      min,
      max,
    }),
    fieldName,
    label: $t(label),
    rules: numberRule(min, max),
  };
}

function providerFields(type: TwoFaProviderType): VbenFormSchema[] {
  const textField = (
    field: string,
    label: string,
    rules: VbenFormSchema['rules'],
  ): VbenFormSchema => ({
    component: 'VbenInput',
    componentProps: () => ({
      class: 'h-10 text-sm shadow-xs',
      disabled: isDisabled(),
    }),
    fieldName: `${type}.${field}`,
    label: $t(label),
    rules,
  });
  const fields: Record<TwoFaProviderType, VbenFormSchema[]> = {
    TOTP: [
      textField(
        'issuerName',
        'settings.features.twoFactor.issuerName',
        z
          .string()
          .trim()
          .min(1, {
            message: $t('settings.features.twoFactor.issuerRequired'),
          }),
      ),
    ],
    SMS: [
      textField(
        'smsVerificationMessageTemplate',
        'settings.features.twoFactor.smsTemplate',
        z.string().refine((value) => value.includes(`\${code}`), {
          message: $t('settings.features.twoFactor.smsTemplateInvalid'),
        }),
      ),
      numberField(
        'SMS.verificationCodeLifetime',
        'settings.features.twoFactor.verificationCodeLifetime',
        1,
      ),
    ],
    EMAIL: [
      numberField(
        'EMAIL.verificationCodeLifetime',
        'settings.features.twoFactor.verificationCodeLifetime',
        1,
      ),
    ],
    BACKUP_CODE: [
      numberField(
        'BACKUP_CODE.codesQuantity',
        'settings.features.twoFactor.codesQuantity',
        1,
      ),
    ],
  };
  const fieldClasses =
    type === TwoFaProviderType.SMS
      ? [
          'mt-5 rounded-t-md bg-muted/20 p-4 md:rounded-l-md md:rounded-tr-none md:pr-3',
          'rounded-b-md bg-muted/20 px-4 pb-4 pt-1 md:mt-5 md:rounded-r-md md:rounded-bl-none md:pl-3 md:pt-4',
        ]
      : ['mt-5 rounded-md bg-muted/20 p-4 md:col-span-2'];
  return fields[type].map((field, index) => ({
    ...field,
    // show 保留输入；关闭渠道时同时移除规则，隐藏字段不阻止保存。
    dependencies: {
      triggerFields: [`${type}.enable`],
      show: (formValues) => !!formValues[type]?.enable,
      rules: (formValues) =>
        formValues[type]?.enable ? (field.rules ?? z.any()) : z.any(),
    },
    formItemClass: fieldClasses[index],
  }));
}

const [EnforcementForm, enforcementApi] = useVbenForm({
  ...formLayout,
  wrapperClass: 'grid-cols-1 gap-y-5',
  schema: [
    {
      component: 'TbSwitch',
      fieldName: 'enforceTwoFa',
      hideLabel: true,
      componentProps: () => ({
        disabled: isDisabled(),
        title: $t('settings.features.twoFactor.enforce.toggle'),
      }),
    },
    {
      component: 'VbenSelect',
      fieldName: 'type',
      label: $t('settings.features.twoFactor.enforce.enforceFor'),
      componentProps: () => ({
        class: '!h-10 w-full bg-background shadow-xs',
        disabled: isDisabled(),
        options: ENFORCE_TYPES.map((type) => ({
          value: type,
          label: $t(`settings.features.twoFactor.enforce.types.${type}`),
        })),
      }),
      dependencies: {
        triggerFields: ['enforceTwoFa'],
        show: (formValues) => !!formValues.enforceTwoFa,
        rules: (formValues) => (formValues.enforceTwoFa ? 'required' : z.any()),
      },
    },
    {
      component: 'VbenSelect',
      fieldName: 'filterByTenants',
      hideLabel: true,
      dependencies: {
        triggerFields: ['enforceTwoFa', 'type'],
        show: (formValues) =>
          formValues.enforceTwoFa &&
          formValues.type === 'TENANT_ADMINISTRATORS',
      },
    },
    ...(['tenants', 'tenantProfiles'] as const).map(
      (filter): VbenFormSchema => ({
        component: 'EntityInput',
        fieldName: `${filter}Ids`,
        hideLabel: true,
        componentProps: () => ({
          class:
            '!min-h-10 w-full !rounded-md !border-input !text-sm !shadow-xs',
          disabled: isDisabled(),
          entityType: filter === 'tenants' ? 'TENANT' : 'TENANT_PROFILE',
          multiple: true,
          params: {
            sortProperty: filter === 'tenants' ? 'title' : 'name',
            sortOrder: 'ASC',
          },
          placeholder: $t(`settings.features.twoFactor.enforce.${filter}`),
          'aria-label': $t(`settings.features.twoFactor.enforce.${filter}`),
          showSearch: true,
        }),
        dependencies: {
          triggerFields: ['enforceTwoFa', 'type', 'filterByTenants'],
          show: (formValues) =>
            formValues.enforceTwoFa &&
            formValues.type === 'TENANT_ADMINISTRATORS' &&
            formValues.filterByTenants === filter,
        },
      }),
    ),
  ],
});

const [ProvidersForm, providersApi] = useVbenForm({
  ...formLayout,
  wrapperClass: 'grid-cols-1 gap-0 md:grid-cols-2',
  schema: PROVIDERS.flatMap((type, index): VbenFormSchema[] => [
    {
      component: 'TbSwitch',
      fieldName: `${type}.enable`,
      hideLabel: true,
      formItemClass:
        index === 0
          ? 'md:col-span-2'
          : 'mt-5 border-t border-border pt-5 md:col-span-2',
      componentProps: () => ({ disabled: isDisabled() }),
      dependencies:
        type === TwoFaProviderType.BACKUP_CODE
          ? {
              triggerFields: ['TOTP.enable', 'SMS.enable', 'EMAIL.enable'],
              disabled: (formValues) =>
                !hasPrimaryProvider(formValues as ProvidersValues),
            }
          : undefined,
    },
    ...providerFields(type),
  ]),
  handleValuesChange: (formValues) => {
    nonBackupEnabled.value = hasPrimaryProvider(formValues as ProvidersValues);
    // 备用码不能作为唯一认证方式；只调整启用状态，保留其配置草稿。
    if (!nonBackupEnabled.value && formValues.BACKUP_CODE?.enable) {
      void providersApi.setFieldValue('BACKUP_CODE.enable', false);
    }
  },
});

const [LimitsForm, limitsApi] = useVbenForm({
  ...formLayout,
  wrapperClass: 'grid-cols-1 gap-x-0 gap-y-0 md:grid-cols-2',
  schema: [
    {
      ...numberField(
        'totalAllowedTimeForVerification',
        'settings.features.twoFactor.totalAllowedTimeForVerification',
        60,
      ),
      formItemClass: 'pb-5 md:pr-3',
    },
    {
      ...numberField(
        'minVerificationCodeSendPeriod',
        'settings.features.twoFactor.minVerificationCodeSendPeriod',
        5,
      ),
      formItemClass: 'pb-5 md:pl-3',
    },
    {
      ...numberField(
        'maxVerificationFailuresBeforeUserLockout',
        'settings.features.twoFactor.maxVerificationFailuresBeforeLockout',
        0,
        65_535,
      ),
      formItemClass: 'md:pr-3',
    },
    {
      component: 'TbCheckbox',
      fieldName: 'rateLimitEnable',
      hideLabel: true,
      componentProps: () => ({
        disabled: isDisabled(),
        title: $t('settings.features.twoFactor.rateLimit'),
      }),
      formItemClass: 'mt-6 md:col-span-2',
    },
    ...(['rateLimitNumber', 'rateLimitTime'] as const).map(
      (fieldName, index): VbenFormSchema => ({
        ...numberField(
          fieldName,
          index === 0
            ? 'settings.features.twoFactor.rateLimitTimesPer'
            : 'settings.features.twoFactor.rateLimitSeconds',
          1,
        ),
        hideLabel: true,
        componentProps: () => ({
          class:
            '!h-10 !w-28 !rounded-md !border-input !bg-background !text-sm !shadow-xs [&_input]:!h-full',
          disabled: isDisabled(),
          min: 1,
          precision: 0,
          'aria-label':
            index === 0
              ? $t('settings.features.twoFactor.rateLimitTimesPer')
              : $t('settings.features.twoFactor.rateLimitSeconds'),
        }),
        formItemClass:
          index === 0 ? 'mt-3 px-4 pb-4 md:pr-3' : 'px-4 pb-4 md:mt-3 md:pl-3',
        suffix: () =>
          h(
            'span',
            { class: 'text-sm text-muted-foreground' },
            index === 0
              ? $t('settings.features.twoFactor.rateLimitTimesPer')
              : $t('settings.features.twoFactor.rateLimitSeconds'),
          ),
        dependencies: {
          triggerFields: ['rateLimitEnable'],
          show: (formValues) => !!formValues.rateLimitEnable,
          rules: (formValues) =>
            formValues.rateLimitEnable ? numberRule(1) : z.any(),
        },
      }),
    ),
  ],
});

function hasPrimaryProvider(formValues: ProvidersValues) {
  return !!(
    formValues.TOTP?.enable ||
    formValues.SMS?.enable ||
    formValues.EMAIL?.enable
  );
}

async function applySettings(settings: null | PlatformTwoFaSettings) {
  const providers: ProvidersValues = {
    TOTP: { enable: false, issuerName: 'ThingsBoard' },
    SMS: {
      enable: false,
      smsVerificationMessageTemplate: `Verification code: \${code}`,
      verificationCodeLifetime: 120,
    },
    EMAIL: { enable: false, verificationCodeLifetime: 120 },
    BACKUP_CODE: { enable: false, codesQuantity: 10 },
  };
  for (const config of settings?.providers ?? []) {
    const { providerType, ...formValues } = config;
    if (providers[providerType])
      Object.assign(providers[providerType], formValues, { enable: true });
  }
  if (!hasPrimaryProvider(providers)) providers.BACKUP_CODE.enable = false;
  const filter = settings?.enforcedUsersFilter;
  const [number, time] = (settings?.verificationCodeCheckRateLimit ?? '').split(
    ':',
  );
  await Promise.all([
    enforcementApi.setValues({
      enforceTwoFa: settings?.enforceTwoFa ?? false,
      type: filter?.type ?? 'ALL_USERS',
      filterByTenants: Array.isArray(filter?.tenantProfilesIds)
        ? 'tenantProfiles'
        : 'tenants',
      tenantsIds: filter?.tenantsIds ?? [],
      tenantProfilesIds: filter?.tenantProfilesIds ?? [],
    }),
    providersApi.setValues(providers),
    limitsApi.setValues({
      totalAllowedTimeForVerification:
        settings?.totalAllowedTimeForVerification ?? 3600,
      minVerificationCodeSendPeriod:
        settings?.minVerificationCodeSendPeriod ?? 30,
      maxVerificationFailuresBeforeUserLockout:
        settings?.maxVerificationFailuresBeforeUserLockout ?? 30,
      rateLimitEnable: !!number && Number(number) > 0,
      rateLimitNumber: number ? Number(number) : 3,
      rateLimitTime: time ? Number(time) : 900,
    }),
  ]);
  await Promise.all([
    enforcementApi.clearValidation(),
    providersApi.clearValidation(),
    limitsApi.clearValidation(),
  ]);
}

function buildProviderConfig(
  type: TwoFaProviderType,
  formValues: ProviderValues,
): TwoFaProviderConfig {
  switch (type) {
    case TwoFaProviderType.TOTP: {
      return { providerType: type, issuerName: formValues.issuerName };
    }
    case TwoFaProviderType.SMS: {
      return {
        providerType: type,
        smsVerificationMessageTemplate:
          formValues.smsVerificationMessageTemplate,
        verificationCodeLifetime: formValues.verificationCodeLifetime,
      };
    }
    case TwoFaProviderType.EMAIL: {
      return {
        providerType: type,
        verificationCodeLifetime: formValues.verificationCodeLifetime,
      };
    }
    case TwoFaProviderType.BACKUP_CODE: {
      return { providerType: type, codesQuantity: formValues.codesQuantity };
    }
  }
}

async function performSave() {
  const results = await Promise.all([
    enforcementApi.validate(),
    providersApi.validate(),
    limitsApi.validate(),
  ]);
  if (results.some((result) => !result.valid)) return;
  const [enforcement, providers, limits] = await Promise.all([
    enforcementApi.getValues<EnforcementValues>(),
    providersApi.getValues<ProvidersValues>(),
    limitsApi.getValues<LimitsValues>(),
  ]);
  const enabled = PROVIDERS.filter((type) => providers[type].enable);
  if (enforcement.enforceTwoFa && enabled.length === 0) {
    message.error($t('settings.features.twoFactor.providersRequired'));
    return;
  }
  const filter: SystemLevelUsersFilter = { type: enforcement.type };
  if (enforcement.type === 'TENANT_ADMINISTRATORS') {
    filter.tenantsIds =
      enforcement.filterByTenants === 'tenants' ? enforcement.tenantsIds : null;
    filter.tenantProfilesIds =
      enforcement.filterByTenants === 'tenantProfiles'
        ? enforcement.tenantProfilesIds
        : null;
  }
  const payload: PlatformTwoFaSettings = {
    enforceTwoFa: enforcement.enforceTwoFa,
    enforcedUsersFilter: filter,
    providers: enabled.map((type) =>
      buildProviderConfig(type, providers[type]),
    ),
    totalAllowedTimeForVerification: limits.totalAllowedTimeForVerification,
    minVerificationCodeSendPeriod: limits.minVerificationCodeSendPeriod,
    maxVerificationFailuresBeforeUserLockout:
      limits.maxVerificationFailuresBeforeUserLockout,
    verificationCodeCheckRateLimit: limits.rateLimitEnable
      ? `${limits.rateLimitNumber}:${limits.rateLimitTime}`
      : undefined,
  };
  await applySettings(await savePlatformTwoFaSettings(payload));
  message.success($t('tb.common.saveSuccess'));
}

const handleReload = () =>
  read(async () => applySettings(await getPlatformTwoFaSettings()));
const handleSave = () => write(performSave);
onMounted(handleReload);
</script>

<template>
  <SettingsPanel :title="$t('settings.features.twoFactor.title')">
    <div class="flex flex-col gap-6">
      <FormSection :title="$t('settings.features.twoFactor.enforce.title')">
        <EnforcementForm>
          <template #filterByTenants="{ componentField }">
            <VbenSegmented
              v-bind="componentField"
              class="[&_[role=tab]]:!min-w-0 [&_[role=tab]]:!px-3"
              :class="{ 'pointer-events-none opacity-50': isDisabled() }"
              :inert="isDisabled()"
              variant="navigation"
              :tabs="[
                {
                  value: 'tenants',
                  label: $t('settings.features.twoFactor.enforce.byTenant'),
                },
                {
                  value: 'tenantProfiles',
                  label: $t(
                    'settings.features.twoFactor.enforce.byTenantProfile',
                  ),
                },
              ]"
            />
          </template>
        </EnforcementForm>
      </FormSection>
      <FormSection
        :title="$t('settings.features.twoFactor.availableProviders')"
      >
        <ProvidersForm>
          <template
            v-for="type in PROVIDERS"
            :key="type"
            #[`${type}.enable`]="{ componentProps }"
          >
            <TbSwitch
              v-bind="componentProps"
              :title="$t(`settings.features.twoFactor.provider.${type}`)"
              :description="
                $t(`settings.features.twoFactor.providerDesc.${type}`)
              "
            >
              <template #description>
                <p class="m-0">
                  {{ $t(`settings.features.twoFactor.providerDesc.${type}`) }}
                </p>
                <p
                  v-if="type === 'BACKUP_CODE' && !nonBackupEnabled"
                  class="m-0 mt-2"
                >
                  {{ $t('settings.features.twoFactor.backupCodeHint') }}
                </p>
              </template>
            </TbSwitch>
          </template>
        </ProvidersForm>
      </FormSection>
      <FormSection
        :title="$t('settings.features.twoFactor.verificationSettings')"
      >
        <LimitsForm />
      </FormSection>
    </div>
    <template #footer>
      <VbenButton
        variant="outline"
        class="min-w-20"
        :loading="isLoading"
        :disabled="isSaving"
        @click="handleReload"
      >
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton
        class="min-w-20"
        :loading="isSaving"
        :disabled="!isReady || isLoading"
        @click="handleSave"
      >
        {{ $t('tb.common.save') }}
      </VbenButton>
    </template>
  </SettingsPanel>
</template>
