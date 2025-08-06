<script lang="ts" setup>
  import { default as AuthPageLayout } from './src/authentication.vue';
  import { useGlobSetting } from '/@/hooks/setting';

  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');
  const { title } = useGlobSetting();

  const appName = title;
  const logo = '/as';
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :page-description="t('基于 Vue3 的Thingsboard 前端应用')"
    :page-title="t('Thingsboard Iot Platform')"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
