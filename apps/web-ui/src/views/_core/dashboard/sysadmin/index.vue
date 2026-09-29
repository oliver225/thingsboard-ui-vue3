<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Col, Flex, Row } from 'antdv-next';

import { EntityType } from '#/enums';
import { $t } from '#/locales';
import TenantProfileForm from '#/views/tb/tenant-profile/form.vue';
import TenantForm from '#/views/tb/tenant/form.vue';

import ActivityCard from '../components/activity-card.vue';
import ConfiguredFeatures from '../components/configured-features.vue';
import CountValue from '../components/count-value.vue';
import GetStarted from '../components/get-started.vue';
import SystemResources from '../components/system-resources.vue';

const [TenantModal, tenantApi] = useVbenModal({
  connectedComponent: TenantForm,
  destroyOnClose: true,
});
const [ProfileModal, profileApi] = useVbenModal({
  connectedComponent: TenantProfileForm,
  destroyOnClose: true,
});
const entities = [
  {
    key: 'device',
    type: EntityType.DEVICE,
    icon: 'lucide:cpu',
    tone: 'text-sky-600 bg-sky-500/10',
  },
  {
    key: 'assets',
    type: EntityType.ASSET,
    icon: 'lucide:box',
    tone: 'text-amber-600 bg-amber-500/10',
  },
  {
    key: 'users',
    type: EntityType.USER,
    icon: 'lucide:user-round',
    tone: 'text-violet-500 bg-violet-500/10',
  },
  {
    key: 'customers',
    type: EntityType.CUSTOMER,
    icon: 'lucide:users-round',
    tone: 'text-emerald-600 bg-emerald-500/10',
  },
];
const tenants = [
  {
    key: 'tenants',
    type: EntityType.TENANT,
    icon: 'lucide:building-2',
    to: '/tenants',
    add: () => tenantApi.setData({}).open(),
  },
  {
    key: 'tenantProfiles',
    type: EntityType.TENANT_PROFILE,
    icon: 'lucide:sliders-horizontal',
    to: '/tenantProfiles',
    add: () => profileApi.setData({}).open(),
  },
];
</script>

<template>
  <Flex class="h-full min-h-0 w-full gap-3 max-[1200px]:gap-2.5">
    <Flex class="min-h-0 min-w-0" flex="1 1 0" vertical :gap="12">
      <Row class="min-h-0 min-w-0 flex-1" :gutter="12" :wrap="false">
        <Col
          class="min-h-0 min-w-0"
          :xs="{ flex: '1 1 0' }"
          :xl="{ flex: '0.95 1 0' }"
        >
          <Flex class="h-full min-h-0 min-w-0" vertical :gap="12">
            <Row class="min-h-0 flex-[0_0_88px]" :gutter="10" :wrap="false">
              <Col v-for="item in tenants" :key="item.key" :span="12">
                <div
                  class="bg-card h-full min-w-0 rounded-xl border px-3 py-2.5 shadow-sm max-[1200px]:p-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <RouterLink
                      :to="item.to"
                      class="metric-link inline-flex min-w-0 items-center gap-1.5 text-sm"
                    >
                      {{ $t(`home.${item.key}`) }}
                      <IconifyIcon
                        icon="lucide:arrow-up-right"
                        class="text-muted-foreground size-3.5"
                      />
                    </RouterLink>
                    <Button
                      type="text"
                      size="small"
                      :aria-label="$t(`home.add.${item.key}`)"
                      @click="item.add"
                    >
                      <IconifyIcon
                        icon="lucide:plus"
                        class="text-primary size-4"
                      />
                    </Button>
                  </div>
                  <div class="mt-1 flex items-center justify-between">
                    <CountValue
                      :command="{
                        type: 'ENTITY_COUNT',
                        query: {
                          entityFilter: {
                            type: 'entityType',
                            entityType: item.type,
                          },
                        },
                      }"
                    />
                    <span
                      class="text-primary bg-primary/10 flex size-8 items-center justify-center rounded-lg"
                    >
                      <IconifyIcon :icon="item.icon" class="size-4" />
                    </span>
                  </div>
                </div>
              </Col>
            </Row>
            <Row class="min-h-0 flex-[0_0_76px]" :gutter="10" :wrap="false">
              <Col v-for="item in entities" :key="item.key" :span="6">
                <div
                  class="bg-card h-full min-w-0 rounded-xl border px-3 py-2.5 shadow-sm max-[1200px]:p-2"
                >
                  <div class="mb-1 flex items-center justify-between gap-1">
                    <span class="text-muted-foreground text-xs">
                      {{ $t(`home.${item.key}`) }}
                    </span>
                    <span
                      class="flex size-6 shrink-0 items-center justify-center rounded-md"
                      :class="item.tone"
                    >
                      <IconifyIcon :icon="item.icon" class="size-3.5" />
                    </span>
                  </div>
                  <CountValue
                    :command="{
                      type: 'ENTITY_COUNT',
                      query: {
                        entityFilter: {
                          type: 'entityType',
                          entityType: item.type,
                        },
                      },
                    }"
                  />
                </div>
              </Col>
            </Row>
            <ConfiguredFeatures class="flex-1" />
          </Flex>
        </Col>
        <Col
          class="min-h-0 min-w-0"
          :xs="{ flex: '1 1 0' }"
          :xl="{ flex: '1.05 1 0' }"
        >
          <SystemResources />
        </Col>
      </Row>
      <ActivityCard class="flex-[0.72_1_0]" system />
    </Flex>
    <GetStarted
      class="min-w-[250px] flex-[0_0_27%] max-[1200px]:min-w-[240px] max-[1200px]:basis-[240px]"
      system
    />
    <TenantModal />
    <ProfileModal />
  </Flex>
</template>

<style scoped>
/* 覆盖 Ant Design 的全局链接颜色，使卡片链接跟随主题。 */
.metric-link {
  color: inherit;
}

.metric-link:hover {
  color: hsl(var(--primary));
}
</style>
