<script setup lang="ts">
import type { FieldArgument } from './data';

import { computed, ref, watch } from 'vue';

import { entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

import { getSourceEntityName } from './data';

const props = defineProps<{ value?: Record<string, FieldArgument> }>();
const sourceNames = ref<Record<string, string>>({});
const rows = computed(() => Object.entries(props.value ?? {}));

watch(
  () => props.value,
  async (value) => {
    sourceNames.value = {};
    const names = await Promise.all(
      Object.entries(value ?? {}).map(async ([name, argument]) => [
        name,
        argument.refEntityId
          ? await getSourceEntityName(argument.refEntityId).catch(() => '—')
          : '',
      ]),
    );
    if (props.value === value) sourceNames.value = Object.fromEntries(names);
  },
  { immediate: true },
);
</script>

<template>
  <div class="overflow-x-auto rounded-lg border">
    <table class="w-full text-left text-sm">
      <thead class="bg-muted/50 text-muted-foreground">
        <tr>
          <th
            v-for="key in [
              'argumentName',
              'sourceEntity',
              'keyType',
              'key',
              'defaultValue',
            ]"
            :key="key"
            class="whitespace-nowrap px-3 py-3 font-medium"
          >
            {{ $t(`tb.components.fieldArguments.fields.${key}`) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="[name, argument] in rows"
          :key="name"
          class="border-t align-top"
        >
          <td class="px-3 py-3 font-medium">{{ name }}</td>
          <td class="px-3 py-3">
            <template v-if="argument.refEntityId">
              <span class="block text-muted-foreground">{{
                entityTypeLabel(argument.refEntityId.entityType)
              }}</span>
              {{ sourceNames[name] || '—' }}
            </template>
            <template v-else>
              {{
                $t(
                  `tb.components.fieldArguments.options.${argument.refDynamicSourceConfiguration?.type ?? 'CURRENT'}`,
                )
              }}
            </template>
          </td>
          <td class="px-3 py-3">
            {{
              $t(
                `tb.components.fieldArguments.options.${argument.refEntityKey.type}`,
              )
            }}
            <span
              v-if="argument.refEntityKey.scope"
              class="block text-muted-foreground"
              >{{
                $t(
                  `tb.components.fieldArguments.options.${argument.refEntityKey.scope}`,
                )
              }}</span>
          </td>
          <td class="px-3 py-3">{{ argument.refEntityKey.key }}</td>
          <td class="whitespace-pre-wrap break-all px-3 py-3">
            {{ argument.defaultValue || '—' }}
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="5" class="p-4 text-center text-muted-foreground">—</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
