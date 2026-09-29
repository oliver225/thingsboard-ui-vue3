<script setup lang="ts">
import type { RuleNode, RuleNodeDescriptor } from '#/api/tb/rule-chain';
import type { EntityDebugSettings } from '#/types/tb';

import { computed, ref, useId } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep } from '@vben/utils';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Input as VbenInput,
} from '@vben-core/shadcn-ui';

import { FormSection } from '#/components/form-section';
import { DebugSettingsButton } from '#/components/widget';
import { $t } from '#/locales';
import EventList from '#/views/tb/event/list.vue';

import { getNodeIcon, nodeCategories } from './node.vue';

interface NodeDetailData {
  nodeId: string;
  descriptor: RuleNodeDescriptor;
  data: RuleNode;
}

const emit = defineEmits<{
  success: [value: { nodeId: string; data: RuleNode }];
}>();
const data = ref<NodeDetailData>();
const tab = ref('DETAIL');
const id = useId();
const definition = computed(
  () => data.value?.descriptor.configurationDescriptor.nodeDefinition,
);
const category = computed(
  () =>
    nodeCategories.find((item) => item.value === data.value?.descriptor.type)
      ?.label,
);
const tabs = computed(() => [
  { key: 'DETAIL', label: $t('rule-chain.flow.details'), icon: 'lucide:info' },
  {
    key: 'DEBUG',
    label: $t('rule-chain.node.debug'),
    icon: 'lucide:bug',
    disabled: !data.value?.data.id?.id,
  },
]);

const [Drawer, drawerApi] = useVbenDrawer<NodeDetailData>({
  onOpenChange(open) {
    if (!open) return;
    data.value = cloneDeep(drawerApi.getData());
    tab.value = 'DETAIL';
  },
});

function updateDebugSettings(debugSettings: EntityDebugSettings) {
  if (!data.value) return;
  data.value.data = { ...data.value.data, debugSettings };
  emit('success', {
    nodeId: data.value.nodeId,
    data: cloneDeep(data.value.data),
  });
}
</script>

<template>
  <Drawer
    :footer="false"
    class="w-full sm:w-[60%] sm:min-w-[36rem]"
    content-class="flex min-h-0 flex-col overflow-hidden p-0"
  >
    <template #title>
      <div v-if="data" class="flex min-w-0 items-center gap-3">
        <IconifyIcon
          :icon="getNodeIcon(data.descriptor)"
          class="size-5 shrink-0"
        />
        <div class="min-w-0">
          <div class="truncate">{{ data.data.name }}</div>
          <div class="text-muted-foreground truncate text-xs font-normal">
            {{ category }} - {{ data.descriptor.name }}
          </div>
        </div>
      </div>
    </template>
    <Tabs v-if="data" v-model="tab" class="flex min-h-0 flex-1 flex-col gap-0">
      <div class="shrink-0 border-b px-6">
        <TabsList
          class="h-12 w-max justify-start gap-1 rounded-none bg-transparent p-0 text-muted-foreground"
          :aria-label="$t('rule-chain.node.nodeDetailTitle')"
        >
          <TabsTrigger
            v-for="item in tabs"
            :key="item.key"
            :value="item.key"
            :disabled="item.disabled"
            class="h-full flex-none gap-2 rounded-none border-0 border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
          >
            <IconifyIcon :icon="item.icon" class="size-4" aria-hidden="true" />
            {{ item.label }}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="DETAIL"
        class="m-0 min-h-0 flex-1 space-y-6 overflow-y-auto p-6"
      >
        <div class="flex items-end gap-4">
          <div class="flex min-w-0 flex-1 flex-col gap-3">
            <label :for="`${id}-name`" class="text-sm font-medium">
              {{ $t('rule-chain.node.name') }}
            </label>
            <VbenInput
              :id="`${id}-name`"
              :model-value="data.data.name"
              readonly
            />
          </div>
          <div class="shrink-0 space-y-2">
            <DebugSettingsButton
              :model-value="data.data.debugSettings ?? {}"
              debug-type="ruleChain"
              @update:model-value="updateDebugSettings"
            />
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <label :for="`${id}-description`" class="text-sm font-medium">
            {{ $t('rule-chain.node.description') }}
          </label>
          <Textarea
            :id="`${id}-description`"
            :model-value="data.data.additionalInfo?.description ?? ''"
            :rows="3"
            readonly
            class="resize-none"
          />
        </div>
        <FormSection size="small">
          <div class="node-help space-y-3 text-sm leading-6">
            <div
              v-if="definition?.description"
              v-html="definition.description"
            ></div>
            <div v-if="definition?.details" v-html="definition.details"></div>
          </div>
        </FormSection>
      </TabsContent>
      <TabsContent
        value="DEBUG"
        class="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-4"
      >
        <EventList
          v-if="tab === 'DEBUG' && data.data.id"
          :entity-id="data.data.id"
          :event-types="['ERROR', 'LC_EVENT', 'STATS', 'DEBUG_RULE_NODE']"
        />
      </TabsContent>
    </Tabs>
  </Drawer>
</template>

<style scoped>
.node-help {
  overflow-wrap: anywhere;
}

.node-help :deep(pre) {
  white-space: pre-wrap;
}

.node-help :deep(img) {
  max-width: 100%;
}

.node-help :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}
</style>
