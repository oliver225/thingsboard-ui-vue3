<script lang="ts" setup>
import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import ImagePreview from '#/adapter/component/image-preview.vue';
import TbSwitch from '#/adapter/component/tb-switch.vue';
import { getImageInfo, updateImagePublicStatus } from '#/api/tb/image';
import { Authority } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const { hasAccessByRoles } = useAccess();

const scope = ref<ResourceScope | undefined>();
const resourceKey = ref<string | undefined>();
const record = ref<null | TbResourceInfo>(null);
const isPublic = ref(false);
const toggling = ref(false);

/** 系统级图片对租户管理员只读 */
const readonly = computed(
  () => scope.value === 'system' && !hasAccessByRoles([Authority.SYS_ADMIN]),
);

/** 公共访问的绝对 URL(仅 public 时有效) */
const publicUrl = computed(() =>
  record.value?.public && record.value.publicLink
    ? `${window.location.origin}${record.value.publicLink}`
    : '',
);

/** 内部资源链接(相对路径) */
const resourceLink = computed(() => record.value?.link ?? '');

/** 嵌入 HTML 代码 */
const embedHtml = computed(() =>
  publicUrl.value
    ? `<img src="${publicUrl.value}" alt="${record.value?.title ?? ''}" />`
    : '',
);

/** 待展示的代码 / 链接块 */
const codeFields = computed(() => {
  const fields: { code: string; label: string }[] = [];
  if (isPublic.value && publicUrl.value) {
    fields.push(
      { code: publicUrl.value, label: $t('images.features.embed.publicLink') },
      { code: embedHtml.value, label: $t('images.features.embed.embedHtml') },
    );
  }
  if (resourceLink.value) {
    fields.push({
      code: resourceLink.value,
      label: $t('images.features.embed.link'),
    });
  }
  return fields;
});

async function handleCopy(text: string) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success($t('images.features.embed.copied'));
  } catch {
    message.error($t('images.features.embed.copyFailed'));
  }
}

async function handleTogglePublic(checked: boolean) {
  if (!scope.value || !resourceKey.value) {
    return;
  }
  toggling.value = true;
  try {
    const info = await updateImagePublicStatus(
      scope.value,
      resourceKey.value,
      checked,
    );
    record.value = info;
    isPublic.value = !!info.public;
    message.success(
      checked
        ? $t('images.features.embed.publicEnabled')
        : $t('images.features.embed.publicDisabled'),
    );
    emit('success');
  } catch {
    // 失败回退开关状态
    isPublic.value = !checked;
  } finally {
    toggling.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data =
      (modalApi.getData() as { resourceKey?: string; scope?: ResourceScope }) ??
      {};
    scope.value = data.scope;
    resourceKey.value = data.resourceKey;
    record.value = null;
    isPublic.value = false;
    modalApi.setState({ title: $t('images.features.embed.title') });
    if (data.scope && data.resourceKey) {
      const info = await getImageInfo(data.scope, data.resourceKey);
      record.value = info;
      isPublic.value = !!info.public;
    }
  },
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :show-confirm-button="false"
    :cancel-text="$t('tb.common.close')"
  >
    <div class="flex flex-col gap-5 p-1">
      <!-- 预览 -->
      <div
        class="bg-muted/40 flex h-52 w-full items-center justify-center overflow-hidden rounded-lg border p-2"
      >
        <ImagePreview
          class="h-full w-full"
          :resource-key="resourceKey"
          :preview="false"
          :scope="scope"
        />
      </div>

      <!-- 公开访问开关 -->
      <TbSwitch
        v-model:checked="isPublic"
        :title="$t('images.features.embed.public')"
        :description="$t('images.features.embed.publicDesc')"
        :disabled="readonly || toggling"
        :loading="toggling"
        @change="(checked: any) => handleTogglePublic(!!checked)"
      >
        <template #title>
          <span class="flex items-center gap-2">
            <IconifyIcon
              :icon="isPublic ? 'lucide:globe' : 'lucide:lock'"
              :class="isPublic ? 'text-primary' : 'text-muted-foreground'"
            />
            {{ $t('images.features.embed.public') }}
          </span>
        </template>
      </TbSwitch>

      <!-- 未公开提示 -->
      <div
        v-if="!isPublic"
        class="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm"
      >
        <IconifyIcon icon="lucide:info" class="shrink-0" />
        {{ $t('images.features.embed.makePublicFirst') }}
      </div>

      <!-- 链接 / 代码块 -->
      <div
        v-for="field in codeFields"
        :key="field.label"
        class="flex flex-col gap-1.5"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-muted-foreground text-xs font-semibold uppercase tracking-wide"
          >
            {{ field.label }}
          </span>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            @click="handleCopy(field.code)"
          >
            <IconifyIcon icon="lucide:copy" />
            {{ $t('images.features.embed.copy') }}
          </button>
        </div>
        <pre
          class="bg-muted text-foreground overflow-x-auto rounded-md border px-3 py-2.5 font-mono text-sm"
        ><code>{{ field.code }}</code></pre>
      </div>
    </div>
  </Modal>
</template>
