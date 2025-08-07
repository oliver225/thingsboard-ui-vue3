<script lang="ts" setup>
  import { AuthenticationQrCodeLogin } from '/@/components/Authentication';
  import { PageEnum } from '/@/enums/pageEnum';
  defineOptions({ name: 'QrCodeLogin' });
</script>

<template>
  <AuthenticationQrCodeLogin :login-path="PageEnum.BASE_LOGIN" />
</template>
