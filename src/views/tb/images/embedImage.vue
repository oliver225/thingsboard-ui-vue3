<template>
  <BasicModal
    v-bind="$attrs"
    :show-ok-btn="false"
    :cancel-text="t('common.closeText')"
    :can-fullscreen="false"
    @register="registerModal"
    width="50%"
  >
    <template #title>
      <Icon icon="ant-design:code-outlined" class="pr-1 m-1" />
      <span>{{ t('tb.images.embed.title') }}</span>
    </template>
    <div class="border border-solid border-neutral-400 rounded-md p-4 mb-4">
      <div class="text-lg font-bold">
        <Switch v-model:checked="publicStatus" size="small" @change="(checked: any) => handleChangePublic(!!checked)" />
        {{ t('tb.images.embed.embedHtml') }}
      </div>
      <template v-if="record.public == true">
        <div class="text-sm text-gray-400 my-4">
          <p>{{ t('tb.images.embed.embedHtmlDesc1') }}</p>
          <p>{{ t('tb.images.embed.embedHtmlDesc2') }}</p>
        </div>
        <div>
          <CodeEditor
            v-model:value="embedHtmlCode"
            :mode="MODE.HTMLMIXED"
            :readonly="true"
            class="border border-solid border-gray-400"
          />
        </div>
      </template>
    </div>
    <div class="border border-solid border-neutral-400 rounded-md p-4 mb-4">
      <div class="text-lg font-bold">{{ t('tb.images.embed.embedVue') }}</div>
      <div class="text-sm text-gray-400 my-4">
        <p>{{ t('tb.images.embed.embedVueDesc1') }}</p>
        <p>{{ t('tb.images.embed.embedVueDesc2') }}</p>
      </div>
      <div>
        <CodeEditor
          v-model:value="embedVueCode"
          :mode="MODE.HTMLMIXED"
          :readonly="true"
          class="border border-solid border-gray-400"
        />
      </div>
    </div>
  </BasicModal>
</template>
<script lang="ts" setup name="EmbedImage">
  import { Icon } from '/@/components/Icon';
  import { ref, computed } from 'vue';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { encodeHtml } from '/@/utils';
  import { Switch } from 'ant-design-vue';
  import { updateImagePublicStatus } from '/@/api/tb/images';
  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits(['register']);

  const record = ref<ResourceInfo>({} as ResourceInfo);
  const { t } = useI18n('tb');

  const publicStatus = ref(true);

  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { ...data } as ResourceInfo;
    publicStatus.value = !!record.value.public;
    setModalProps({ loading: false });
  });

  function clear() {
    record.value = {} as ResourceInfo;
  }

  const embedHtmlCode = computed(() => {
    return '<img src="' + record.value.publicLink + '"  alt="' + encodeHtml(record.value.title) + '" />';
  });

  const embedVueCode = computed(() => {
    return '<img [src]="\'' + record.value.link + '\' | image | async" />';
  });

  async function handleChangePublic(value: boolean) {
    try {
      const result = await updateImagePublicStatus(record.value.link, value);
      record.value = result;
    } catch (error) {
      console.log(error);
      publicStatus.value = !publicStatus.value;
    }
  }
</script>
