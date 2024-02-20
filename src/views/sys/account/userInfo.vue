<template>
  <CollapseContainer :title="t('用户信息')" :canExpan="false" class="overflow-x-hidden">
    <template #action>
      <span v-if="record?.additionalInfo?.lastLoginTs > 0">
        最后登录时间：<strong>{{ dayjs(record.additionalInfo.lastLoginTs).format('YYYY-MM-DD HH:mm:ss') }}</strong>
      </span>
    </template>
    <ARow :gutter="24" class="mt-3">
      <ACol :span="14">
        <BasicForm @register="register" />
      </ACol>
      <ACol :span="10">
        <div class="change-avatar mt-6">
          <CropperAvatar :value="avatar" :btnText="t('sys.account.changeAvatar')"
            :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }" @change="updateAvatar" width="150" />
        </div>
      </ACol>
    </ARow>
    <div class="ml-30">
      <Button type="primary" @click="handleSubmit">
        <Icon icon="ant-design:check-outlined" /> {{ t('sys.account.updateBtn') }}
      </Button>
    </div>
  </CollapseContainer>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { Button, Row, Col } from 'ant-design-vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { Icon } from '/@/components/Icon';
import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
import { CollapseContainer } from '/@/components/Container';
import { CropperAvatar } from '/@/components/Cropper';
import headerImg from '/@/assets/images/header.png';
import { useUserStore } from '/@/store/modules/user';
import { getUserById, saveUser } from '/@/api/things/user';
import dayjs from 'dayjs';
// import { uploadApi } from '/@/api/sys/upload';

const { t } = useI18n();
const { showMessage } = useMessage();
const avatarBase64 = ref<String>('');
const record = ref();
const userStore = useUserStore();
const ARow = Row;
const ACol = Col;

const userInfoSchemas: FormSchema[] = [
  {
    field: 'email',
    component: 'Input',
    label: t('sys.account.email'),
    colProps: { span: 18 },
    rules: [{ required: true, message: t('邮箱地址必须输入') }, { type: 'email', message: t('请填写正确的邮箱地址') }],
  },
  {
    field: 'firstName',
    component: 'Input',
    label: t('用户姓名'),
    componentProps: {
      maxlength: 100,
    },
    colProps: { span: 18 },
    required: true,
  },
  {
    label: t('用户职务'),
    field: 'lastName',
    component: 'Input',
    colProps: { span: 18 },
    componentProps: {
      maxlength: 100,
    },
  },
  {
    field: 'phone',
    component: 'Input',
    label: t('手机号码'),
    colProps: { span: 18 },
    rules: [{ required: true, message: t('手机号码必须输入') }, { pattern: /^1[3-9]\d{9}$/, message: t('请填写正确的手机号码') }],
  },
  {
    field: 'additionalInfo.description',
    component: 'InputTextArea',
    label: t('sys.account.sign'),
    colProps: { span: 18 },
  },
  {
    field: 'additionalInfo.lang',
    component: 'Input',
    defaultValue: '"zh_CN"',
    show: false,
  },
];

const [register, { setFieldsValue, validate }] = useForm({
  labelWidth: 120,
  schemas: userInfoSchemas,
  showActionButtonGroup: false,
});

onMounted(async () => {
  const data = await getUserById(userStore.getUserInfo.id.id)
  record.value = data;
  setFieldsValue(data);
});

const avatar = computed(() => {
  const { additionalInfo: { avatarUrl } } = userStore.getUserInfo;
  return avatarUrl || headerImg;
});

function updateAvatar(source: string) {
  avatarBase64.value = source;
}

async function handleSubmit() {
  try {
    const data = await validate();
    const saveData = { ...record.value, ...data }
    saveData.additionalInfo = { ...record.value.additionalInfo, ...data.additionalInfo };
    if (avatarBase64.value != '') {
      // TODO: 后台优化
      // saveData.additionalInfo = { ...saveData.additionalInfo, avatarUrl: avatarBase64.value };
    }
    // console.log('submit', data);
    const res = await saveUser(saveData);
    const userInfo = await getUserById(userStore.getUserInfo.id.id);
    if (avatarBase64.value != '') {
      userInfo.additionalInfo.avatarUrl = avatarBase64.value;
    }
    userStore.setUserInfo(userInfo);
    showMessage('更新用户消息成功');
  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  }
}
</script>
<style lang="less" scoped>
.change-avatar {
  img {
    display: block;
    margin-bottom: 15px;
    border-radius: 50%;
  }
}
</style>
