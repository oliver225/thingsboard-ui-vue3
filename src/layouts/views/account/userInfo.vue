<template>
  <CollapseContainer :title="t('sys.account.basicTab')" :canExpan="false" class="overflow-x-hidden">
    <template #action>
      <span v-if="record.additionalInfo?.lastLoginTs">
        <span>最后登录：</span>
        {{ dayjs(record.additionalInfo.lastLoginTs).format('YYYY-MM-DD HH:mm:ss') }}
      </span>
    </template>
    <ARow :gutter="24" class="mt-3">
      <ACol :span="14">
        <BasicForm @register="register" />
      </ACol>
      <ACol :span="10">
        <div class="change-avatar mt-6">
          <CropperAvatar
            :value="avatar"
            :btnText="t('sys.account.changeAvatar')"
            :btnProps="{ preIcon: 'i-ant-design:cloud-upload-outlined' }"
            @change="updateAvatar"
            :uploadApi="({ file, name, filename }) => uploadImage(file, name)"
            width="150"
          />
        </div>
      </ACol>
    </ARow>
    <div class="ml-30">
      <Button type="primary" @click="handleSubmit">
        <Icon icon="i-ant-design:check-outlined" /> {{ t('sys.account.updateBtn') }}
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
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { CollapseContainer } from '/@/components/Container';
  import { CropperAvatar } from '/@/components/Cropper';
  import { UserInfo } from '/#/store';
  import AvatarImg from '/@/assets/images/avatar.jpg';
  import { useUserStore } from '/@/store/modules/user';
  import { saveUser, userInfoApi } from '/@/api/tb/user';
  import { uploadImage } from '/@/api/tb/images';
  import dayjs from 'dayjs';
  import { localeSetting } from '/@/settings/localeSetting';

  const { t } = useI18n();
  const { showMessage } = useMessage();
  const avatarBase64 = ref<string>('');
  const userStore = useUserStore();
  const record = ref<UserInfo>({} as UserInfo);
  const ARow = Row;
  const ACol = Col;

  const userInfoSchemas: FormSchema[] = [
    {
      field: 'email',
      component: 'Input',
      label: t('sys.account.email'),
      required: true,
      colProps: { span: 18 },
      rules: [
        { required: true, message: t('邮箱地址必须输入') },
        { type: 'email', message: t('请填写正确的邮箱地址') },
      ],
    },
    {
      label: t('用户姓名'),
      field: 'firstName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { span: 18 },
    },
    {
      label: t('用户职务'),
      field: 'lastName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      colProps: { span: 18 },
    },
    {
      label: t('sys.account.mobile'),
      field: 'phone',
      component: 'Input',
      required: true,
      rules: [
        { required: true, message: t('手机号码必须输入') },
        { pattern: /^1[3-9]\d{9}$/, message: t('请填写正确的手机号码') },
      ],
      colProps: { span: 18 },
    },
    {
      label: t('描述信息'),
      field: 'additionalInfo.description',
      component: 'InputTextArea',
      colProps: { span: 18 },
    },
  ];

  const [register, { setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: userInfoSchemas,
    showActionButtonGroup: false,
  });

  onMounted(async () => {
    record.value = await userInfoApi();
    setFieldsValue(record.value);
  });

  const avatar = computed(() => {
    const { avatarUrl } = userStore.getUserInfo.additionalInfo;
    return avatarUrl || AvatarImg;
  });

  function updateAvatar(parmas: any) {
    const { source, data } = parmas;
    if (data?.publicLink) {
      console.log(data.publicLink);
      record.value.additionalInfo = { ...record.value.additionalInfo, avatarUrl: data.publicLink };
      avatarBase64.value = source;
    }
  }

  async function handleSubmit() {
    try {
      const data = await validate();
      record.value.email = data.email;
      record.value.firstName = data.firstName;
      record.value.lastName = data.lastName;
      record.value.phone = data.phone;
      record.value.additionalInfo = {
        ...record.value.additionalInfo,
        description: data.additionalInfo.description,
        lang: localeSetting.locale,
      };
      // console.log('submit', data);
      const res = await saveUser(record.value);
      const userInfoRes = await userInfoApi();

      userStore.setUserInfo(userInfoRes);
      showMessage('更新用户信息成功');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(error.message || t('common.validateError'));
      }
      console.log('error', error);
    }
  }
</script>
<style lang="less">
  .change-avatar {
    img {
      display: block;
      margin-bottom: 15px;
      border-radius: 50%;
    }
  }
</style>
