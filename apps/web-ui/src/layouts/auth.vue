<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('authentication.messages.pageDesc')"
    :page-title="$t('authentication.menu')"
  >
    <template #copyright>
      <a
        v-if="preferences.copyright.enable && preferences.copyright.icp"
        :href="preferences.copyright.icpLink || 'https://beian.miit.gov.cn/'"
        class="text-primary hover:text-primary-hover"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ preferences.copyright.icp }}
      </a>
    </template>
  </AuthPageLayout>
</template>
