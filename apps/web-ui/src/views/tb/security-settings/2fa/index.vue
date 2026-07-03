<script lang="ts" setup>
import type {
  PlatformTwoFaSettings,
  SystemLevelUsersFilter,
  TwoFaProviderConfig,
} from '#/api/tb/two-factor-auth';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Checkbox,
  Input,
  InputNumber,
  message,
  Segmented,
  Select,
  Switch,
} from 'antdv-next';

import { getTenantInfos } from '#/api/tb/tenant';
import { getTenantProfileInfos } from '#/api/tb/tenant-profile';
import {
  getPlatformTwoFaSettings,
  savePlatformTwoFaSettings,
} from '#/api/tb/two-factor-auth';
import { TwoFaProviderType } from '#/enums';

/** 渲染顺序 */
const PROVIDERS: TwoFaProviderType[] = [
  TwoFaProviderType.TOTP,
  TwoFaProviderType.SMS,
  TwoFaProviderType.EMAIL,
  TwoFaProviderType.BACKUP_CODE,
];

/** 强制对象类型(复用通知接收组的过滤类型文案) */
const ENFORCE_TYPES = [
  'ALL_USERS',
  'TENANT_ADMINISTRATORS',
  'SYSTEM_ADMINISTRATORS',
] as const;

interface SelectOption {
  label: string;
  value: string;
}

interface ProviderForm {
  codesQuantity?: number;
  enable: boolean;
  issuerName?: string;
  smsVerificationMessageTemplate?: string;
  verificationCodeLifetime?: number;
}

function defaultProviders(): Record<TwoFaProviderType, ProviderForm> {
  return {
    BACKUP_CODE: { codesQuantity: 10, enable: false },
    EMAIL: { enable: false, verificationCodeLifetime: 120 },
    SMS: {
      enable: false,
      smsVerificationMessageTemplate: `Verification code: \${code}`,
      verificationCodeLifetime: 120,
    },
    TOTP: { enable: false, issuerName: 'ThingsBoard' },
  };
}

const form = reactive({
  enforce: {
    filterByTenants: 'tenants' as 'tenantProfiles' | 'tenants',
    tenantProfilesIds: [] as string[],
    tenantsIds: [] as string[],
    type: 'ALL_USERS' as string,
  },
  enforceTwoFa: false,
  maxVerificationFailuresBeforeUserLockout: 30 as null | number,
  minVerificationCodeSendPeriod: 30 as null | number,
  providers: defaultProviders(),
  rateLimitEnable: false,
  rateLimitNumber: 3 as null | number,
  rateLimitTime: 900 as null | number,
  totalAllowedTimeForVerification: 3600 as null | number,
});

const tenantOptions = ref<SelectOption[]>([]);
const tenantProfileOptions = ref<SelectOption[]>([]);

/** 是否有除备用码外的供应商已启用 */
const nonBackupEnabled = computed(
  () =>
    form.providers.TOTP.enable ||
    form.providers.SMS.enable ||
    form.providers.EMAIL.enable,
);

// 备用码不能作为唯一启用的供应商:无其它供应商时自动关闭(对齐 ui-ngx)
watch(nonBackupEnabled, (enabled) => {
  if (!enabled) {
    form.providers.BACKUP_CODE.enable = false;
  }
});

async function loadTenantOptions() {
  if (tenantOptions.value.length > 0) {
    return;
  }
  const pageData = await getTenantInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'title',
  });
  tenantOptions.value = pageData.data.map((item) => ({
    label: item.title,
    value: item.id?.id ?? '',
  }));
}

async function loadTenantProfileOptions() {
  if (tenantProfileOptions.value.length > 0) {
    return;
  }
  const pageData = await getTenantProfileInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'name',
  });
  tenantProfileOptions.value = pageData.data.map((item) => ({
    label: item.name,
    value: item.id.id,
  }));
}

// 选「租户管理员」时按需加载租户/租户配置选项
watch(
  () => form.enforce.type,
  (type) => {
    if (type === 'TENANT_ADMINISTRATORS') {
      loadTenantOptions();
      loadTenantProfileOptions();
    }
  },
);

function applySettings(settings: null | PlatformTwoFaSettings) {
  const providers = defaultProviders();
  form.minVerificationCodeSendPeriod =
    settings?.minVerificationCodeSendPeriod ?? 30;
  form.maxVerificationFailuresBeforeUserLockout =
    settings?.maxVerificationFailuresBeforeUserLockout ?? 30;
  form.totalAllowedTimeForVerification =
    settings?.totalAllowedTimeForVerification ?? 3600;

  const [num, time] = (settings?.verificationCodeCheckRateLimit ?? '').split(
    ':',
  );
  form.rateLimitEnable = !!num && Number(num) > 0;
  form.rateLimitNumber = num ? Number(num) : 3;
  form.rateLimitTime = time ? Number(time) : 900;

  for (const cfg of settings?.providers ?? []) {
    const target = providers[cfg.providerType];
    if (target) {
      Object.assign(target, cfg, { enable: true });
    }
  }
  form.providers = providers;

  // 强制对象
  const filter = settings?.enforcedUsersFilter;
  form.enforceTwoFa = settings?.enforceTwoFa ?? false;
  form.enforce.type = filter?.type ?? 'ALL_USERS';
  form.enforce.tenantsIds = filter?.tenantsIds ?? [];
  form.enforce.tenantProfilesIds = filter?.tenantProfilesIds ?? [];
  // 已存在 tenantProfilesIds 数组 → 按租户配置过滤,否则按租户(对齐 ui-ngx)
  form.enforce.filterByTenants = Array.isArray(filter?.tenantProfilesIds)
    ? 'tenantProfiles'
    : 'tenants';
  if (form.enforce.type === 'TENANT_ADMINISTRATORS') {
    loadTenantOptions();
    loadTenantProfileOptions();
  }
}

async function loadSettings() {
  try {
    applySettings(await getPlatformTwoFaSettings());
  } catch {
    // 读取失败(如权限不足)静默
  }
}

function buildProviderConfig(type: TwoFaProviderType): TwoFaProviderConfig {
  const p = form.providers[type];
  switch (type) {
    case TwoFaProviderType.BACKUP_CODE: {
      return { codesQuantity: p.codesQuantity, providerType: type };
    }
    case TwoFaProviderType.EMAIL: {
      return {
        providerType: type,
        verificationCodeLifetime: p.verificationCodeLifetime,
      };
    }
    case TwoFaProviderType.SMS: {
      return {
        providerType: type,
        smsVerificationMessageTemplate: p.smsVerificationMessageTemplate,
        verificationCodeLifetime: p.verificationCodeLifetime,
      };
    }
    case TwoFaProviderType.TOTP: {
      return { issuerName: p.issuerName, providerType: type };
    }
  }
}

function buildEnforcedUsersFilter(): SystemLevelUsersFilter {
  const filter: SystemLevelUsersFilter = { type: form.enforce.type };
  if (form.enforce.type === 'TENANT_ADMINISTRATORS') {
    if (form.enforce.filterByTenants === 'tenants') {
      filter.tenantsIds = form.enforce.tenantsIds;
      filter.tenantProfilesIds = null;
    } else {
      filter.tenantProfilesIds = form.enforce.tenantProfilesIds;
      filter.tenantsIds = null;
    }
  }
  return filter;
}

async function saveSettings() {
  if (
    !form.minVerificationCodeSendPeriod ||
    !form.totalAllowedTimeForVerification
  ) {
    message.error($t('tb.securitySettings.requiredField'));
    return;
  }
  const enabledProviders = PROVIDERS.filter((t) => form.providers[t].enable);
  if (form.enforceTwoFa && enabledProviders.length === 0) {
    message.error($t('tb.securitySettings.twoFa.providersRequired'));
    return;
  }
  if (form.providers.TOTP.enable && !form.providers.TOTP.issuerName?.trim()) {
    message.error($t('tb.securitySettings.twoFa.issuerRequired'));
    return;
  }
  if (
    form.providers.SMS.enable &&
    !form.providers.SMS.smsVerificationMessageTemplate?.includes(`\${code}`)
  ) {
    message.error($t('tb.securitySettings.twoFa.smsTemplateInvalid'));
    return;
  }
  const payload: PlatformTwoFaSettings = {
    enforcedUsersFilter: buildEnforcedUsersFilter(),
    enforceTwoFa: form.enforceTwoFa,
    maxVerificationFailuresBeforeUserLockout:
      form.maxVerificationFailuresBeforeUserLockout,
    minVerificationCodeSendPeriod: form.minVerificationCodeSendPeriod,
    providers: enabledProviders.map((t) => buildProviderConfig(t)),
    totalAllowedTimeForVerification: form.totalAllowedTimeForVerification,
    verificationCodeCheckRateLimit: form.rateLimitEnable
      ? `${form.rateLimitNumber}:${form.rateLimitTime}`
      : undefined,
  };
  applySettings(await savePlatformTwoFaSettings(payload));
  message.success($t('tb.common.saveSuccess'));
}

onMounted(loadSettings);
</script>

<template>
  <div class="border-border bg-card rounded-lg border px-5 py-4 space-y-4">
    <div class="text-lg font-semibold">
      {{ $t('tb.securitySettings.twoFa.title') }}
    </div>
    <!-- 卡片1:强制双因素认证 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="mb-3 text-sm font-bold">
        {{ $t('tb.securitySettings.twoFa.enforce.title') }}
      </div>
      <div class="mt-4 flex items-center gap-2">
        <Switch v-model:checked="form.enforceTwoFa" size="small" />
        <span class="text-sm">
          {{ $t('tb.securitySettings.twoFa.enforce.toggle') }}
        </span>
      </div>

      <div v-if="form.enforceTwoFa" class="mt-4 space-y-3">
        <div>
          <div class="text-muted-foreground mb-1 text-sm">
            {{ $t('tb.securitySettings.twoFa.enforce.enforceFor') }}
          </div>
          <Select
            v-model:value="form.enforce.type"
            class="w-full"
            size="large"
            :options="
              ENFORCE_TYPES.map((type) => ({
                label: $t(`tb.notification.recipient.filterType.${type}`),
                value: type,
              }))
            "
          />
        </div>

        <div
          v-if="form.enforce.type === 'TENANT_ADMINISTRATORS'"
          class="flex flex-col items-center gap-2 w-full"
        >
          <Segmented
            v-model:value="form.enforce.filterByTenants"
            :block="true"
            class=""
            :style="{ width: '50%' }"
            :options="[
              {
                label: $t('tb.securitySettings.twoFa.enforce.byTenant'),
                value: 'tenants',
              },
              {
                label: $t('tb.securitySettings.twoFa.enforce.byTenantProfile'),
                value: 'tenantProfiles',
              },
            ]"
          />
          <Select
            v-if="form.enforce.filterByTenants === 'tenants'"
            v-model:value="form.enforce.tenantsIds"
            allow-clear
            size="large"
            class="w-full"
            mode="multiple"
            option-filter-prop="label"
            :options="tenantOptions"
            :placeholder="$t('tb.securitySettings.twoFa.enforce.tenants')"
            show-search
          />
          <Select
            v-else
            v-model:value="form.enforce.tenantProfilesIds"
            allow-clear
            size="large"
            class="w-full"
            mode="multiple"
            option-filter-prop="label"
            :options="tenantProfileOptions"
            :placeholder="
              $t('tb.securitySettings.twoFa.enforce.tenantProfiles')
            "
            show-search
          />
        </div>
      </div>
    </div>

    <!-- 卡片2:可用供应商 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="mb-3 text-sm font-bold">
        {{ $t('tb.securitySettings.twoFa.availableProviders') }}
      </div>
      <div class="mt-4 space-y-4">
        <div
          v-for="p in PROVIDERS"
          :key="p"
          class="border-border rounded-md border px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <Switch
              v-model:checked="form.providers[p].enable"
              :disabled="p === 'BACKUP_CODE' && !nonBackupEnabled"
              size="small"
            />
            <span class="text-sm font-bold">
              {{ $t(`tb.securitySettings.twoFa.provider.${p}`) }}
            </span>
          </div>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ $t(`tb.securitySettings.twoFa.providerDesc.${p}`) }}
          </p>
          <p
            v-if="p === 'BACKUP_CODE' && !nonBackupEnabled"
            class="text-muted-foreground mt-1 text-xs italic"
          >
            {{ $t('tb.securitySettings.twoFa.backupCodeHint') }}
          </p>

          <div v-if="form.providers[p].enable" class="mt-3">
            <!-- TOTP -->
            <div v-if="p === 'TOTP'">
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('tb.securitySettings.twoFa.issuerName') }}
              </div>
              <Input
                v-model:value="form.providers.TOTP.issuerName"
                size="large"
                allow-clear
              />
            </div>

            <!-- SMS -->
            <div v-else-if="p === 'SMS'" class="space-y-3">
              <div>
                <div class="text-muted-foreground mb-1 text-sm">
                  {{ $t('tb.securitySettings.twoFa.smsTemplate') }}
                </div>
                <Input
                  v-model:value="
                    form.providers.SMS.smsVerificationMessageTemplate
                  "
                  size="large"
                  allow-clear
                />
              </div>
              <div>
                <div class="text-muted-foreground mb-1 text-sm">
                  {{ $t('tb.securitySettings.twoFa.verificationCodeLifetime') }}
                </div>
                <InputNumber
                  v-model:value="form.providers.SMS.verificationCodeLifetime"
                  size="large"
                  class="w-full sm:!w-1/2"
                  :min="1"
                />
              </div>
            </div>

            <!-- EMAIL -->
            <div v-else-if="p === 'EMAIL'">
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('tb.securitySettings.twoFa.verificationCodeLifetime') }}
              </div>
              <InputNumber
                v-model:value="form.providers.EMAIL.verificationCodeLifetime"
                class="w-full sm:!w-1/2"
                size="large"
                :min="1"
              />
            </div>

            <!-- BACKUP_CODE -->
            <div v-else-if="p === 'BACKUP_CODE'">
              <div class="text-muted-foreground mb-1 text-sm">
                {{ $t('tb.securitySettings.twoFa.codesQuantity') }}
              </div>
              <InputNumber
                v-model:value="form.providers.BACKUP_CODE.codesQuantity"
                class="w-full sm:!w-1/2"
                size="large"
                :min="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片3:验证限制 -->
    <div class="border-border bg-card rounded-lg border px-5 py-4">
      <div class="mb-3 text-sm font-bold">
        {{ $t('tb.securitySettings.twoFa.verificationSettings') }}
      </div>
      <div class="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <div>
          <div class="text-muted-foreground mb-1 text-sm">
            {{
              $t('tb.securitySettings.twoFa.totalAllowedTimeForVerification')
            }}
          </div>
          <InputNumber
            v-model:value="form.totalAllowedTimeForVerification"
            class="w-full sm:!w-4/5"
            size="large"
            :min="60"
          />
        </div>
        <div>
          <div class="text-muted-foreground mb-1 text-sm">
            {{ $t('tb.securitySettings.twoFa.minVerificationCodeSendPeriod') }}
          </div>
          <InputNumber
            v-model:value="form.minVerificationCodeSendPeriod"
            class="w-full sm:!w-4/5"
            size="large"
            :min="5"
          />
        </div>
        <div>
          <div class="text-muted-foreground mb-1 text-sm">
            {{
              $t(
                'tb.securitySettings.twoFa.maxVerificationFailuresBeforeLockout',
              )
            }}
          </div>
          <InputNumber
            v-model:value="form.maxVerificationFailuresBeforeUserLockout"
            class="w-full sm:!w-4/5"
            size="large"
            :max="65_535"
            :min="0"
          />
        </div>
      </div>

      <div class="mt-3">
        <Checkbox v-model:checked="form.rateLimitEnable">
          {{ $t('tb.securitySettings.twoFa.rateLimit') }}
        </Checkbox>
        <div
          v-if="form.rateLimitEnable"
          class="mt-2 flex flex-wrap items-center gap-2"
        >
          <InputNumber
            v-model:value="form.rateLimitNumber"
            class="w-28"
            size="large"
            :min="1"
          />
          <span class="text-muted-foreground text-sm">
            {{ $t('tb.securitySettings.twoFa.rateLimitTimesPer') }}
          </span>
          <InputNumber
            v-model:value="form.rateLimitTime"
            class="w-28"
            size="large"
            :min="1"
          />
          <span class="text-muted-foreground text-sm">
            {{ $t('tb.securitySettings.twoFa.rateLimitSeconds') }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-start gap-2">
      <VbenButton variant="outline" @click="loadSettings">
        {{ $t('tb.common.undo') }}
      </VbenButton>
      <VbenButton @click="saveSettings">
        {{ $t('tb.common.save') }}
      </VbenButton>
    </div>
  </div>
</template>
