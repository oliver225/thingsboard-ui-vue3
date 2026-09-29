<script lang="ts" setup>
import type { VbenFormSchema } from './form';

import { computed } from 'vue';

import { DEFAULT_FORM_COMMON_CONFIG } from '../../../../packages/@core/ui-kit/form-ui/src/config';
// Vben 当前公开入口未导出单字段渲染器，在应用 adapter 内集中桥接。
// 所有子字段沿用父 Form 的上下文、校验和取值，不创建第二个表单。
import { injectRenderFormProps } from '../../../../packages/@core/ui-kit/form-ui/src/form-render/context';
import FormField from '../../../../packages/@core/ui-kit/form-ui/src/form-render/form-field.vue';
import { createFormFieldSchema } from '../../../../packages/@core/ui-kit/form-ui/src/form-render/schema';

const props = defineProps<{ schema: VbenFormSchema }>();
const context = injectRenderFormProps();
const field = computed(() =>
  createFormFieldSchema(props.schema, {
    commonConfig: context.commonConfig,
    globalCommonConfig: DEFAULT_FORM_COMMON_CONFIG,
  }),
);
</script>

<template>
  <FormField v-bind="field" :class="field.formItemClass" />
</template>
