<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';

import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import { configurationGroups } from './form-data';
import { createConfigurationFormSchema } from './form-schema';

const props = defineProps<{ validationError?: { fieldName: string } }>();
const open = defineModel<boolean>('open', { default: true });
const expandedGroups = reactive<Record<string, boolean>>({});
const schema = computed(() => createConfigurationFormSchema());
const unlimitedGroups = new Set([
  'entities',
  'files',
  'ruleEngine',
  'storage',
  'websocket',
]);

function getGroupFields(fieldNames: readonly string[]) {
  return fieldNames.flatMap((fieldName) =>
    schema.value.filter(
      (field) => field.fieldName === `configuration.${fieldName}`,
    ),
  );
}

watch(
  () => props.validationError,
  (error) => {
    if (!error) return;
    const group = configurationGroups.find(({ fields }) =>
      fields.some(
        (fieldName) => error.fieldName === `configuration.${fieldName}`,
      ),
    );
    if (group) expandedGroups[group.key] = true;
  },
);
</script>

<template>
  <FormSection
    v-model:open="open"
    collapsible
    :title="$t('tenant-profile.sections.groups.configuration')"
  >
    <div class="tenant-profile-section-stack">
      <FormSection
        v-for="group in configurationGroups"
        :key="group.key"
        v-model:open="expandedGroups[group.key]"
        collapsible
        :title="$t(`tenant-profile.sections.groups.${group.key}`)"
      >
        <p
          v-if="unlimitedGroups.has(group.key)"
          class="text-muted-foreground mb-3 text-xs leading-5"
        >
          {{ $t('tenant-profile.features.form.zeroMeansUnlimited') }}
        </p>
        <div class="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <FormField
            v-for="field in getGroupFields(group.fields)"
            :key="field.fieldName"
            :schema="field"
          />
        </div>
      </FormSection>
    </div>
  </FormSection>
</template>
