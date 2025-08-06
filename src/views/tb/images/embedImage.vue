<template>
  <BasicModal v-bind="$attrs" :footer="null" :can-fullscreen="false" @register="registerModal" width="50%">
    <template #title>
      <Icon icon="ant-design:code-outlined" class="pr-1 m-1" />
      <span> 嵌入图片 </span>
    </template>
    <div class="border border-solid border-neutral-400 rounded-md p-4 mb-4">
      <div class="text-lg font-bold">
        <Switch v-model:checked="publicStatus" size="small" @change="handleChangePublic" />
        嵌入HTML
      </div>
      <template v-if="record.public == true">
        <div class="text-sm text-gray-400 my-4">
          <p>使用以下代码片段，您可以将图片嵌入到基于纯HTML的组件中。</p>
          <p>这类组件包括HTML卡片部件、单元格内容功能等。</p>
        </div>
        <div>
          <CodeEditor
            v-model:value="embedHtmlCode"
            :mode="'htmlmixed'"
            :readonly="true"
            class="border border-solid border-gray-400"
          />
        </div>
      </template>
    </div>
    <div class="border border-solid border-neutral-400 rounded-md p-4 mb-4">
      <div class="text-lg font-bold">嵌入Vue Template</div>
      <div class="text-sm text-gray-400 my-4">
        <p>使用以下代码片段，您可以在VUE的HTML模板中嵌入图片，这些模板将用于组件中。</p>
        <p>这类组件包括Markdown部件、部件编辑器中的HTML部分、自定义操作等。</p>
      </div>
      <div>
        <CodeEditor
          v-model:value="embedVueCode"
          :mode="'htmlmixed'"
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
  import { CodeEditor } from '/@/components/CodeEditor';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { encodeHtml } from '/@/utils';
  import { Switch } from 'ant-design-vue';
  import { updateImagePublicStatus } from '/@/api/tb/images';

  const emit = defineEmits(['register']);

  const record = ref<ResourceInfo>({} as ResourceInfo);

  const publicStatus = ref(true);

  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { ...data } as ResourceInfo;
    publicStatus.value = record.value.public;
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
