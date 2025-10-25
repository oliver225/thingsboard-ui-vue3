<template>
  <div class="device-profile-alarm-detail">
    <div class="preview" @click="handleEditDetail">
      <div v-if="isEmpty(record) && edit">
        <Tooltip :title="t('tb.deviceProfile.alarmDetail.add')" class="mx-2">
          <Icon class="cursor-pointer" :icon="'ant-design:plus-outlined'" :size="20" @click="handleEditDetail()" />
        </Tooltip>
      </div>
      {{ record }}
    </div>
    <BasicModal
      :open="modalVisible"
      :title="t('tb.deviceProfile.alarmDetail.title')"
      width="50%"
      :showOkBtn="edit == true"
      @ok="handleSubmit"
      :onCancel="handleModalClose"
    >
      <div class="border border-solid border-neutral-500">
        <CodeEditor v-model:value="record" :mode="MODE.TEXTILE" />
      </div>
      <span> {{ t('tb.deviceProfile.alarmDetail.tip') }} </span>
    </BasicModal>
  </div>
</template>
<script lang="ts" setup name="AlarmDetail">
  import { onMounted, ref } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Tooltip } from 'ant-design-vue';
  import { BasicModal } from '/@/components/Modal';
  import { propTypes } from '/@/utils/propTypes';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits(['update:value']);

  const props = defineProps({
    value: propTypes.string.def(''),
    edit: propTypes.bool.def(true),
  });
  const record = ref('');
  const { t } = useI18n('tb');

  const modalVisible = ref(false);

  function handleEditDetail() {
    modalVisible.value = true;
  }

  function handleModalClose() {
    modalVisible.value = false;
  }

  onMounted(() => {
    init();
  });
  function init() {
    record.value = props.value;
  }

  function handleSubmit() {
    emit('update:value', record.value);
    handleModalClose();
  }
</script>
<style lang="less">
  .device-profile-alarm-detail {
    .preview {
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
    }
  }
</style>
