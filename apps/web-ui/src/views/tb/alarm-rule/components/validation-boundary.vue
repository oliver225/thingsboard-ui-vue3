<script setup lang="ts">
import { useFormNode } from '../use-form-node';
// Unconfirmed modal drafts must not contribute errors to their parent form.
const node = useFormNode(() => [], true);
defineExpose({ validate: node.validate });
</script>
<template><slot></slot></template>
