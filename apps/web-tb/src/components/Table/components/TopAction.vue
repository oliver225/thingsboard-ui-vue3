<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { Button, Input } from 'ant-design-vue';

const props = defineProps({
  btnTitle: {
    type: String,
    required: true,
  },
  btnIcon: {
    type: String,
    default: 'ant-design:plus-outlined',
  },
  searchText: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:searchText', 'btnClick']);
</script>
<template>
  <div class="flex items-center space-x-2">
    <Button type="primary" class="flex items-center" @click="emit('btnClick')">
      <IconifyIcon class="size-4" :icon="props.btnIcon" />
      <span class="font-semibold">
        {{ props.btnTitle }}
      </span>
    </Button>
    <Input
      class="w-80"
      :value="props.searchText"
      @input="emit('update:searchText', $event.target.value)"
      :placeholder="$t('page.search.placeholder')"
    >
      <template #suffix>
        <IconifyIcon class="size-4" icon="ant-design:search-outlined" />
      </template>
    </Input>
  </div>
</template>
