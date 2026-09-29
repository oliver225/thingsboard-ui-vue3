<script lang="ts" setup name="EditTableHeaderIcon">
import { FormOutlined } from '@antdv-next/icons';

defineProps({ title: { type: String, default: '' } });
</script>
<template>
  <span>
    <slot></slot>
    {{ title }}
    <FormOutlined />
  </span>
</template>
