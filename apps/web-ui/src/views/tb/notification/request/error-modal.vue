<script lang="ts" setup>
import type { NotificationRequestStats } from '#/api/tb/notification';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { deliveryMethodOptions } from '../templates/template';

const stats = ref<NotificationRequestStats | null>(null);

/** 各投递方式的失败明细:{ 方式: { 收件人: 错误信息 } } */
const errors = computed(() => stats.value?.errors ?? {});

/** 失败总数 */
const totalErrors = computed(() => stats.value?.totalErrors ?? 0);

const methodOptions = computed(deliveryMethodOptions);

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      stats.value = null;
      return;
    }
    const data =
      (modalApi.getData() as { stats?: NotificationRequestStats }) ?? {};
    stats.value = data.stats ?? null;
    modalApi.setState({
      title: $t('notification.features.request.errorTitle'),
    });
  },
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :show-confirm-button="false"
  >
    <div class="flex flex-col gap-4">
      <!-- 顶部汇总 -->
      <div
        v-if="totalErrors > 0"
        class="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium"
      >
        <IconifyIcon icon="lucide:circle-alert" class="shrink-0 text-base" />
        {{
          $t('notification.features.request.result.failed', {
            count: totalErrors,
          })
        }}
      </div>

      <!-- 请求级错误(整条发送失败) -->
      <div
        v-if="stats?.error"
        class="bg-muted/40 text-foreground rounded-lg border px-4 py-3 text-sm leading-relaxed"
      >
        {{ stats.error }}
      </div>

      <!-- 各投递方式分组 -->
      <div
        v-for="(methodErrors, method) in errors"
        :key="method"
        class="overflow-hidden rounded-lg border"
      >
        <!-- 分组头:图标 + 方式 + 数量 -->
        <div class="bg-muted/50 flex items-center gap-2 border-b px-4 py-2.5">
          <IconifyIcon
            :icon="
              methodOptions.find((item) => item.value === method)?.icon ??
              'lucide:send'
            "
            class="text-muted-foreground shrink-0"
          />
          <span class="font-medium">{{
            methodOptions.find((item) => item.value === method)?.label ?? method
          }}</span>
          <span
            class="bg-destructive/10 text-destructive ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
          >
            {{ Object.keys(methodErrors).length }}
          </span>
        </div>
        <!-- 收件人 / 错误信息列表 -->
        <div class="divide-border divide-y">
          <div
            v-for="(msg, recipient) in methodErrors"
            :key="recipient"
            class="flex flex-col gap-1 px-4 py-3"
          >
            <div class="flex items-center gap-1.5">
              <IconifyIcon
                icon="lucide:user"
                class="text-muted-foreground shrink-0 text-sm"
              />
              <span class="text-sm font-medium">{{ recipient }}</span>
            </div>
            <div
              class="text-destructive break-words pl-[22px] text-sm leading-relaxed"
            >
              {{ msg }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
