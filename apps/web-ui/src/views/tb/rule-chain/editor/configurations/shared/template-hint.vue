<script setup lang="ts">
defineProps<{ scope?: string }>();
</script>

<template>
  <span
    class="border-warning/50 bg-warning/15 dark:text-warning block rounded-md border px-3 py-2 text-xs font-normal leading-6 text-amber-900"
  >
    <span v-if="scope" class="block">{{ scope }}</span>
    <i18n-t keypath="rule-chain.templateSyntax.help" tag="span">
      <template #metadata>
        <code class="bg-warning/20 rounded px-1 py-0.5 font-mono font-medium">
          ${metadataKey}
        </code>
      </template>
      <template #message>
        <code class="bg-warning/20 rounded px-1 py-0.5 font-mono font-medium">
          $[messageKey]
        </code>
      </template>
    </i18n-t>
  </span>
</template>
