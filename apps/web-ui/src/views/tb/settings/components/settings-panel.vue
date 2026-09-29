<script setup lang="ts">
withDefaults(
  defineProps<{ title: string; description?: string; showHeader?: boolean }>(),
  {
    description: '',
    showHeader: true,
  },
);
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <header
      v-if="showHeader"
      class="flex min-h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border p-4 md:px-6 md:py-[18px]"
    >
      <div class="min-w-0">
        <h2
          class="m-0 text-[length:var(--font-size-base)] font-semibold leading-6"
        >
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="m-0 mt-1.5 text-sm leading-5 text-muted-foreground"
        >
          {{ description }}
        </p>
      </div>
      <slot name="extra"></slot>
    </header>
    <div class="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-6">
      <div
        class="m-0 w-full min-w-0 max-w-[1040px] text-sm [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:font-medium [&_.ant-input-number]:w-full [&_.ant-select]:w-full"
      >
        <slot></slot>
      </div>
    </div>
    <footer
      v-if="$slots.footer"
      class="flex min-h-[68px] shrink-0 flex-wrap items-center justify-start gap-3 border-t border-border bg-card p-4 md:px-6 [&>.ant-btn]:min-w-20"
    >
      <slot name="footer"></slot>
    </footer>
  </section>
</template>
