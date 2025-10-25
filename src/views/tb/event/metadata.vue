<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :showOkBtn="false"
    :canFullscreen="false"
    @ok="closeModal()"
    @register="registerModal"
    width="50%"
  >
    <template #title>
      <Icon :icon="'ant-design:insert-row-below-outlined'" class="pr-1 m-1" />
      <span> {{ title }} </span>
    </template>

    <div class="border border-solid border-neutral-300 h-46">
      <CodeEditor :value="textValue" :readonly="true" />
    </div>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsEventMetaData">
  import { ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { CodeEditor } from '/@/components/CodeEditor';

  const emit = defineEmits(['success', 'register']);

  const title = ref<string>();
  const textValue = ref<string>();

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    textValue.value = data.data;
    title.value = data.title as string;

    setModalProps({ loading: false });
  });
</script>
