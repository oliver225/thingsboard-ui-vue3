<template>
  <CollapseContainer :title="t('sys.account.securityTab')" :canExpan="false">
    <div class="border border-neutral-400 p-4 ">
      <div class="text-base font-bold">JWT 令牌</div>
      <div class="flex items-start justify-between mt-4 mr-4">
        <div class="text-base text-slate-400">令牌有效期至 {{ tokenExpireTime }}</div>
        <a-button type="primary" @click="handleCopyJWT">
          复制JWT令牌
        </a-button>
      </div>
    </div>
    <div class="border  border-neutral-400 p-4 mt-4  flex">
      <div class="flex-1 border-r border-neutral-400 pr-4">
        <div class="text-base font-bold mb-4">更改密码</div>
        <BasicForm @register="register" />
        <div class="mt-4 flex justify-end">
          <a-button :loading="submitLoading" class="mr-4" type="primary" @click="handleChangePassword">
            更改密码
          </a-button>
        </div>
      </div>
      <div class="flex-1 pl-4">
        <div class="text-base font-bold mb-4">密码要求</div>
        <ul>
          <li v-if="passwordPolicy?.minimumLength"
            :class="policyChecked.minimumLength == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <!-- <CheckIcon v-if="" /> -->
            <Icon :icon="policyChecked.minimumLength == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            最少 {{ passwordPolicy?.minimumLength }} 位字符
          </li>
          <li v-if="passwordPolicy?.minimumDigits"
            :class="policyChecked.minimumDigits == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <Icon :icon="policyChecked.minimumDigits == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            最少 {{ passwordPolicy?.minimumDigits }} 位数字
          </li>
          <li v-if="passwordPolicy?.minimumUppercaseLetters"
            :class="policyChecked.minimumUppercaseLetters == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <Icon
              :icon="policyChecked.minimumUppercaseLetters == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            最少 {{ passwordPolicy?.minimumUppercaseLetters }} 位大写字母
          </li>
          <li v-if="passwordPolicy?.minimumLowercaseLetters"
            :class="policyChecked.minimumLowercaseLetters == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <Icon
              :icon="policyChecked.minimumLowercaseLetters == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            最少 {{ passwordPolicy?.minimumLowercaseLetters }} 位小写字母
          </li>
          <li v-if="passwordPolicy?.minimumSpecialCharacters"
            :class="policyChecked.minimumSpecialCharacters == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <Icon
              :icon="policyChecked.minimumSpecialCharacters == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            最少 {{ passwordPolicy?.minimumSpecialCharacters }} 位特殊字符
          </li>
          <li v-if="passwordPolicy?.allowWhitespaces == false"
            :class="policyChecked.allowWhitespaces == true ? 'my-2 text-teal-500' : 'my-2 text-rose-500'">
            <Icon
              :icon="policyChecked.allowWhitespaces == true ? 'ant-design:check-outlined' : 'ant-design:close-outlined'"
              class="mr-2" />
            不允许包含空格
          </li>
        </ul>

      </div>
    </div>


  </CollapseContainer>
</template>
<script lang="ts" setup>
import { CollapseContainer } from '/@/components/Container';
import { useI18n } from '/@/hooks/web/useI18n';
import { Icon } from '/@/components/Icon';
import { useUserStore } from '/@/store/modules/user';
import { useMessage } from '/@/hooks/web/useMessage';
import { copyToClipboard } from '/@/utils';
import { jwtDecode } from 'jwt-decode'
import { BasicForm, FormSchema, useForm } from '/@/components/Form';
import { computed, ref, onMounted, reactive } from 'vue';
import dayjs from 'dayjs';
import { getUserPasswordPolicy } from '/@/api/things/noauth';
import { PasswordPolicy } from '/@/api/things/adminSetting';
import { changePassword } from '/@/api/things/auth';

const { t } = useI18n();
const userStore = useUserStore();
const { showMessage } = useMessage();

const submitLoading = ref(false);
const passwordPolicy = ref<PasswordPolicy>();
const policyChecked = reactive({
  minimumLength: false,
  minimumDigits: false,
  minimumUppercaseLetters: false,
  minimumLowercaseLetters: false,
  minimumSpecialCharacters: false,
  allowWhitespaces: false,
})

const tokenExpireTime = computed(() => {
  return dayjs.unix(jwtDecode(userStore.getRefreshToken || '').exp || 0).format('YYYY-MM-DD HH:mm:ss')
})

const formSchema: FormSchema[] = [
  {
    field: 'currentPassword',
    label: t('sys.account.oldPassword'),
    component: 'InputPassword',
    required: true,
  },
  {
    field: 'newPassword',
    label: t('sys.account.newPassword'),
    component: 'InputPassword',
    dynamicRules: ({ values }) => {
      return [{
        required: true,
        validator: (_, value) => validateNewPassword(values, value),
        trigger: ['change', 'blur']
      }]
    }
  },
  {
    field: 'confirmPassword',
    label: t('sys.account.confirmNewPassword'),
    component: 'InputPassword',
    dynamicRules: ({ values }) => {
      return [{
        required: true,
        validator: (_, value) => validateConfirmPassword(values, value),
        trigger: ['change', 'blur']
      }]
    }

  },
]

const [register, { validate, resetFields }] = useForm({
  size: 'large',
  labelWidth: 100,
  showActionButtonGroup: false,
  schemas: formSchema,
});


onMounted(async () => {
  passwordPolicy.value = await getUserPasswordPolicy()
})

function handleCopyJWT() {
  copyToClipboard(userStore.getRefreshToken || '', '复制JWT令牌成功！')
}


async function handleChangePassword() {
  try {
    const data = await validate();
    submitLoading.value = true;
    // console.log('submit', params, data, record);
    const res = await changePassword({ ...data });
    showMessage('更改密码成功！');
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  } finally {
    submitLoading.value = false;
  }
}

function validateConfirmPassword(values: any, confirmPassword: string) {
  if (!confirmPassword) {
    return Promise.reject(t('sys.account.newPasswordNotBlank'));
  }
  if (confirmPassword !== values.newPassword) {
    return Promise.reject(t('sys.account.newPasswordNotEquals'));
  }
  return Promise.resolve();
}

function validateNewPassword(values: any, newPassword: string) {
  policyChecked.minimumDigits = false;
  policyChecked.minimumLength = false;
  policyChecked.allowWhitespaces = false;
  policyChecked.minimumLowercaseLetters = false;
  policyChecked.minimumUppercaseLetters = false;
  policyChecked.minimumSpecialCharacters = false;

  if (!newPassword) {
    return Promise.reject(t('sys.account.newPasswordNotBlank'));
  }
  if (newPassword == values.currentPassword) {
    return Promise.reject('新密码不能和当前密码相同');
  }

  if (passwordPolicy.value?.minimumLength) {
    if (newPassword.length < passwordPolicy.value.minimumLength) {
      return Promise.reject(`密码最少${passwordPolicy.value.minimumLength}位字符`);
    } else {
      policyChecked.minimumLength = true;
    }
  }
  if (passwordPolicy.value?.minimumDigits) {
    const digitsStr = newPassword.replace(/[^\d]/g, "");
    if (digitsStr.length < passwordPolicy.value.minimumDigits) {
      return Promise.reject(`密码最少包含${passwordPolicy.value.minimumDigits}位数字`);
    } else {
      policyChecked.minimumDigits = true;
    }

  }
  if (passwordPolicy.value?.minimumUppercaseLetters) {
    const uppercaseStr = newPassword.replace(/[^\A-Z]/g, '');
    if (uppercaseStr.length < passwordPolicy.value.minimumUppercaseLetters) {
      return Promise.reject(`密码最少包含${passwordPolicy.value.minimumUppercaseLetters}位大写字母`);
    } else {
      policyChecked.minimumUppercaseLetters = true;
    }
  }
  if (passwordPolicy.value?.minimumLowercaseLetters) {
    const lowercaseStr = newPassword.replace(/[^\a-z]/g, '');
    if (lowercaseStr.length < passwordPolicy.value.minimumLowercaseLetters) {
      return Promise.reject(`密码最少包含${passwordPolicy.value.minimumLowercaseLetters}位小写字母`);
    } else {
      policyChecked.minimumLowercaseLetters = true;
    }

  }
  if (passwordPolicy.value?.minimumSpecialCharacters) {
    const specialStr = newPassword.replace(/[a-zA-Z0-9]/g, '');
    if (specialStr.length < passwordPolicy.value.minimumSpecialCharacters) {
      return Promise.reject(`密码最少包含${passwordPolicy.value.minimumSpecialCharacters}位特殊字符`);
    } else {
      policyChecked.minimumSpecialCharacters = true;
    }

  }
  if (passwordPolicy.value?.allowWhitespaces == false) {
    if (newPassword.indexOf(' ') > -1) {
      return Promise.reject(`密码不能包含空格`);
    } else {
      policyChecked.allowWhitespaces = true;
    }

  }
  return Promise.resolve();

}

</script>
<style lang="less" scoped>
.extra {
  float: right;
  margin-top: 10px;
  margin-right: 30px;
  font-weight: normal;
  color: #1890ff;
  cursor: pointer;
}
</style>
