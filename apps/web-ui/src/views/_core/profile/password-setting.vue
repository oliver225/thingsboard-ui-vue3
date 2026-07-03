<script lang="ts" setup>
/**
 * 修改密码(POST /auth/changePassword)+ 密码策略实时校验
 * 逻辑参考旧版 modPwd.vue:逐条校验全部密码策略,满足显示对号,不满足显示叉号。
 * 成功后返回新 JwtPair,更新本地 token 以避免被登出。
 */
import type { VbenFormSchema } from '#/adapter/form';
import type { UserPasswordPolicy } from '#/api/tb/auth';

import { computed, onMounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { changePassword, getUserPasswordPolicy } from '#/api/tb/auth';

defineOptions({ name: 'AccountChangePassword' });

interface ChangePasswordFormValues {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
}

/** 每条策略的实时校验结果 */
interface PolicyChecked {
  allowWhitespaces: boolean;
  maximumLength: boolean;
  minimumDigits: boolean;
  minimumLength: boolean;
  minimumLowercaseLetters: boolean;
  minimumSpecialCharacters: boolean;
  minimumUppercaseLetters: boolean;
}

const accessStore = useAccessStore();

const saving = ref(false);
const policy = ref<UserPasswordPolicy>({});

const policyChecked = reactive<PolicyChecked>({
  allowWhitespaces: false,
  maximumLength: true,
  minimumDigits: false,
  minimumLength: false,
  minimumLowercaseLetters: false,
  minimumSpecialCharacters: false,
  minimumUppercaseLetters: false,
});

/** 需要展示的策略条目(仅展示后端启用的规则) */
const policyItems = computed(() => {
  const p = policy.value;
  const items: { key: keyof PolicyChecked; label: string }[] = [];
  if (p.minimumLength)
    items.push({
      key: 'minimumLength',
      label: $t('tb.account.pwdMinLength', { n: p.minimumLength }),
    });
  if (p.maximumLength)
    items.push({
      key: 'maximumLength',
      label: $t('tb.account.pwdMaxLength', { n: p.maximumLength }),
    });
  if (p.minimumUppercaseLetters)
    items.push({
      key: 'minimumUppercaseLetters',
      label: $t('tb.account.pwdMinUpper', { n: p.minimumUppercaseLetters }),
    });
  if (p.minimumLowercaseLetters)
    items.push({
      key: 'minimumLowercaseLetters',
      label: $t('tb.account.pwdMinLower', { n: p.minimumLowercaseLetters }),
    });
  if (p.minimumDigits)
    items.push({
      key: 'minimumDigits',
      label: $t('tb.account.pwdMinDigits', { n: p.minimumDigits }),
    });
  if (p.minimumSpecialCharacters)
    items.push({
      key: 'minimumSpecialCharacters',
      label: $t('tb.account.pwdMinSpecial', { n: p.minimumSpecialCharacters }),
    });
  if (p.allowWhitespaces === false)
    items.push({
      key: 'allowWhitespaces',
      label: $t('tb.account.pwdNoWhitespace'),
    });
  return items;
});

/**
 * 逐条评估新密码是否满足全部启用的策略。
 * 返回 valid(是否全部通过)用于驱动表单校验与提交。
 */
function evaluatePolicy(newPassword: string): boolean {
  const p = policy.value;

  policyChecked.minimumLength = p.minimumLength
    ? newPassword.length >= p.minimumLength
    : true;
  policyChecked.maximumLength = p.maximumLength
    ? newPassword.length <= p.maximumLength
    : true;
  policyChecked.minimumDigits = p.minimumDigits
    ? (newPassword.match(/\d/g)?.length ?? 0) >= p.minimumDigits
    : true;
  policyChecked.minimumUppercaseLetters = p.minimumUppercaseLetters
    ? (newPassword.match(/[A-Z]/g)?.length ?? 0) >= p.minimumUppercaseLetters
    : true;
  policyChecked.minimumLowercaseLetters = p.minimumLowercaseLetters
    ? (newPassword.match(/[a-z]/g)?.length ?? 0) >= p.minimumLowercaseLetters
    : true;
  policyChecked.minimumSpecialCharacters = p.minimumSpecialCharacters
    ? (newPassword.replaceAll(/[a-z0-9]/gi, '').length ?? 0) >=
      p.minimumSpecialCharacters
    : true;
  policyChecked.allowWhitespaces =
    p.allowWhitespaces === false ? !newPassword.includes(' ') : true;

  return policyItems.value.every((item) => policyChecked[item.key]);
}

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: $t('tb.account.currentPassword'),
    },
    fieldName: 'currentPassword',
    label: $t('tb.account.currentPassword'),
    labelWidth: 140,
    rules: z
      .string({ required_error: $t('tb.account.currentPasswordTip') })
      .min(1, { message: $t('tb.account.currentPasswordTip') }),
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: $t('tb.account.newPassword'),
    },
    dependencies: {
      rules(values) {
        const currentPassword = values.currentPassword ?? '';
        return z
          .string({ required_error: $t('authentication.passwordTip') })
          .min(1, { message: $t('authentication.passwordTip') })
          .refine((value) => value !== currentPassword, {
            message: $t('tb.account.newPasswordSameAsCurrent'),
          })
          .refine((value) => evaluatePolicy(value), {
            message: $t('tb.account.passwordPolicyNotMet'),
          });
      },
      triggerFields: ['currentPassword', 'newPassword'],
    },
    fieldName: 'newPassword',
    label: $t('tb.account.newPassword'),
    labelWidth: 140,
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: $t('tb.account.confirmNewPassword'),
    },
    dependencies: {
      rules(values) {
        const { newPassword } = values;
        return z
          .string({ required_error: $t('authentication.passwordTip') })
          .min(1, { message: $t('authentication.passwordTip') })
          .refine((value) => value === newPassword, {
            message: $t('authentication.confirmPasswordTip'),
          });
      },
      triggerFields: ['newPassword'],
    },
    fieldName: 'confirmPassword',
    label: $t('tb.account.confirmNewPassword'),
    labelWidth: 140,
  },
]);

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    handleValuesChange(values: Record<string, any>) {
      // 实时驱动右侧策略对号/叉号
      evaluatePolicy(values.newPassword ?? '');
    },
    layout: 'horizontal',
    schema: formSchema,
    showDefaultActions: false,
    wrapperClass: 'grid-cols-1',
  }),
);

function handleReset() {
  formApi.resetForm();
  evaluatePolicy('');
}

async function handleSubmit() {
  if (saving.value) {
    return;
  }

  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  const values = await formApi.getValues<ChangePasswordFormValues>();
  saving.value = true;
  try {
    const jwtPair = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    // 旧凭证失效,写入新 token
    accessStore.setAccessToken(jwtPair.token);
    accessStore.setRefreshToken(jwtPair.refreshToken);
    message.success($t('tb.account.changePasswordSuccess'));
    handleReset();
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  policy.value = await getUserPasswordPolicy();
});
</script>

<template>
  <div class="space-y-4" @keydown.enter.prevent="handleSubmit">
    <h3 class="text-lg font-bold text-foreground">
      {{ $t('tb.account.changePassword') }}
    </h3>
    <div class="flex flex-col gap-8 md:flex-row">
      <div class="flex-1">
        <Form />
        <div class="flex gap-3 mt-3">
          <VbenButton variant="outline" :disabled="saving" @click="handleReset">
            {{ $t('tb.account.discardChanges') }}
          </VbenButton>
          <VbenButton type="submit" :loading="saving" @click="handleSubmit">
            {{ $t('tb.account.changePassword') }}
          </VbenButton>
        </div>
      </div>

      <div
        class="flex-1 border-l border-border pl-8 max-md:border-l-0 max-md:pl-0"
      >
        <div class="mb-3 font-medium">
          {{ $t('tb.account.passwordRequirements') }}
        </div>
        <ul class="space-y-2 text-sm">
          <li
            v-for="item in policyItems"
            :key="item.key"
            class="flex items-center gap-2"
            :class="policyChecked[item.key] ? 'text-teal-500' : 'text-rose-500'"
          >
            <IconifyIcon
              :icon="policyChecked[item.key] ? 'lucide:check' : 'lucide:x'"
            />
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
