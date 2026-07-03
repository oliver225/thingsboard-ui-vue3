<script lang="ts" setup>
import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Switch } from 'antdv-next';

import { getImageInfo, updateImagePublicStatus } from '#/api/tb/image';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import ImageThumbnail from './components/image-thumbnail.vue';

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
      { code: publicUrl.value, label: $t('tb.images.embed.publicLink') },
      { code: embedHtml.value, label: $t('tb.images.embed.embedHtml') },
    );
  }
  if (resourceLink.value) {
    fields.push({
      code: resourceLink.value,
      label: $t('tb.images.embed.link'),
    });
  }
  return fields;
});

async function copy(text: string) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success($t('tb.images.embed.copied'));
  } catch {
    message.error($t('tb.images.embed.copyFailed'));
  }
}

async function onTogglePublic(checked: boolean) {
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
        ? $t('tb.images.embed.publicEnabled')
        : $t('tb.images.embed.publicDisabled'),
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
      modalApi.getData<{ resourceKey?: string; scope?: ResourceScope }>() ?? {};
    scope.value = data.scope;
    resourceKey.value = data.resourceKey;
    record.value = null;
    isPublic.value = false;
    modalApi.setState({ title: $t('tb.images.embed.title') });
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
    class="w-2/5"
    :centered="true"
    :fullscreen-button="false"
    :show-confirm-button="false"
    :cancel-text="$t('tb.common.close')"
  >
    <div class="flex flex-col gap-5 p-1">
      <!-- 预览 -->
      <div
        class="bg-muted/40 flex h-52 w-full items-center justify-center overflow-hidden rounded-lg border p-2"
      >
        <ImageThumbnail
          class="h-full w-full"
          :resource-key="resourceKey"
          :preview="false"
          :scope="scope"
        />
      </div>

      <!-- 公开访问开关 -->
      <div class="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 font-medium">
            <IconifyIcon
              :icon="isPublic ? 'lucide:globe' : 'lucide:lock'"
              :class="isPublic ? 'text-primary' : 'text-muted-foreground'"
            />
            {{ $t('tb.images.embed.public') }}
          </div>
          <p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {{ $t('tb.images.embed.publicDesc') }}
          </p>
        </div>
        <Switch
          v-model:checked="isPublic"
          class="mt-1 shrink-0"
          :disabled="readonly || toggling"
          :loading="toggling"
          @change="(checked: any) => onTogglePublic(!!checked)"
        />
      </div>

      <!-- 未公开提示 -->
      <div
        v-if="!isPublic"
        class="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm"
      >
        <IconifyIcon icon="lucide:info" class="shrink-0" />
        {{ $t('tb.images.embed.makePublicFirst') }}
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
            @click="copy(field.code)"
          >
            <IconifyIcon icon="lucide:copy" />
            {{ $t('tb.images.embed.copy') }}
          </button>
        </div>
        <pre
          class="bg-muted text-foreground overflow-x-auto rounded-md border px-3 py-2.5 font-mono text-sm"
        ><code>{{ field.code }}</code></pre>
      </div>
    </div>
  </Modal>
</template>
