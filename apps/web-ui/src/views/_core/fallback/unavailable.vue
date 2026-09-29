<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { Result } from 'antdv-next';
</script>
<template>
  <Page>
    <Result
      status="info"
      title="登录成功"
      sub-title="当前阶段已迁移系统管理员的租户管理。此账号的业务页面尚未迁移。"
    />
  </Page>
</template>
