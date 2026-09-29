<script setup lang="ts">
import type { TbUserInfo } from '#/api/core/user';
import type { WsCommand } from '#/types/ws';

import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { Button, Col, Row } from 'antdv-next';

import {
  AlarmSearchStatus,
  AlarmSeverity,
  Authority,
  EntityType,
} from '#/enums';
import { $t } from '#/locales';
import DeviceForm from '#/views/tb/device/form.vue';

import CountValue from './count-value.vue';
import HomeCard from './home-card.vue';

const props = defineProps<{ kind: 'alarm' | 'device' }>();
const userStore = useUserStore();
const canManage = computed(() =>
  userStore.userRoles.includes(Authority.TENANT_ADMIN),
);
const [FormModal, formApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});
const path = computed(() =>
  props.kind === 'device' ? '/entities/devices' : '/alarms/alarms',
);
const items = computed<{ label: string; command: WsCommand }[]>(() => {
  if (props.kind === 'device') {
    return [false, true, undefined].map((active, index) => ({
      label: $t(`home.${['inactive', 'active', 'total'][index]}`),
      command: {
        type: 'ENTITY_COUNT',
        query: {
          entityFilter: { type: 'entityType', entityType: EntityType.DEVICE },
          keyFilters:
            active === undefined
              ? []
              : [
                  {
                    key: { type: 'ATTRIBUTE', key: 'active' },
                    valueType: 'BOOLEAN',
                    predicate: {
                      type: 'BOOLEAN',
                      operation: 'EQUAL',
                      value: { defaultValue: active },
                    },
                  },
                ],
        },
      },
    }));
  }
  const user = userStore.userInfo as TbUserInfo;
  return ['critical', 'assignedToMe', 'total'].map((key, index) => ({
    label: $t(`home.${key}`),
    command: {
      type: 'ALARM_COUNT',
      query: {
        statusList: [AlarmSearchStatus.ACTIVE],
        searchPropagatedAlarms: false,
        ...(index === 0 ? { severityList: [AlarmSeverity.CRITICAL] } : {}),
        ...(index === 1
          ? { assigneeId: { entityType: EntityType.USER, id: user.userId } }
          : {}),
      },
    },
  }));
});
</script>

<template>
  <HomeCard :title="$t(`home.${kind}`)" :to="path" dense>
    <template #title>
      <RouterLink
        :to="path"
        class="inline-flex items-center gap-2 text-sm font-semibold"
      >
        <span
          class="flex size-8 items-center justify-center rounded-lg"
          :class="
            kind === 'device'
              ? 'bg-sky-500/10 text-sky-600'
              : 'bg-amber-500/10 text-amber-600'
          "
        >
          <IconifyIcon
            :icon="kind === 'device' ? 'lucide:cpu' : 'lucide:bell-ring'"
            class="size-4"
          />
        </span>
        {{ $t(`home.${kind}`) }}
        <IconifyIcon
          icon="lucide:chevron-right"
          class="text-muted-foreground size-3.5"
        />
      </RouterLink>
    </template>
    <template v-if="kind === 'device' && canManage" #extra>
      <Button type="default" size="small" @click="formApi.setData({}).open()">
        <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
        {{ $t('home.addDevice') }}
      </Button>
    </template>
    <Row :gutter="8">
      <Col
        v-for="(item, index) in items"
        :key="item.label"
        :span="8"
        class="border-r last:border-r-0"
      >
        <div class="min-w-0 px-2 pb-1 pt-2">
          <RouterLink
            :to="path"
            class="text-muted-foreground hover:text-primary mb-1.5 flex items-start justify-start gap-1 text-xs"
          >
            <span
              class="mt-1 size-1.5 shrink-0 rounded-full"
              :class="['bg-rose-400', 'bg-emerald-400', 'bg-slate-400'][index]"
            ></span>
            {{ item.label }}
          </RouterLink>
          <CountValue :command="item.command" />
        </div>
      </Col>
    </Row>
    <FormModal v-if="canManage && kind === 'device'" />
  </HomeCard>
</template>
