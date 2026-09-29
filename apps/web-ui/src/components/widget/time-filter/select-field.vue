<script setup lang="ts" generic="T extends number | string">
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vben-core/shadcn-ui';

import { timeFilterLayers } from './model';

defineProps<{
  id: string;
  label: string;
  options: { label: string; value: T }[];
}>();
const value = defineModel<T>({ required: true });
</script>

<template>
  <div class="space-y-1.5">
    <Label :for="id">{{ label }}</Label>
    <Select v-model="value">
      <SelectTrigger :id="id" class="h-[34px] w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent :style="{ zIndex: timeFilterLayers.select }">
        <SelectItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
