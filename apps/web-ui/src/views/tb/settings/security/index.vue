<script setup lang="ts">
import { ref } from 'vue';

import { VbenSegmented } from '@vben/common-ui';

import { $t } from '#/locales';

import JwtSettings from './jwt.vue';
import PasswordPolicy from './password-policy.vue';

const activeTab = ref('password');
</script>
<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <div class="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-4">
      <VbenSegmented
        class="[&_[role=tab]]:!min-w-0 [&_[role=tab]]:!px-3"
        v-model="activeTab"
        variant="navigation"
        :tabs="[
          {
            value: 'password',
            label: $t(
              'settings.features.security.passwordPolicy.passwordPolicy',
            ),
          },
          { value: 'jwt', label: $t('settings.features.security.jwt.title') },
        ]"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-hidden">
      <KeepAlive>
        <component
          :is="activeTab === 'password' ? PasswordPolicy : JwtSettings"
        />
      </KeepAlive>
    </div>
  </div>
</template>
