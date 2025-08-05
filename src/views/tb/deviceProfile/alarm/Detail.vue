<template>
  <div class="device-profile-alarm-detail">
    <div class="preview" @click="handleEditDetail">
      <div v-if="isEmpty(record) && edit">
        <Tooltip :title="'新增详情'" class="mx-2">
          <Icon class="cursor-pointer" :icon="'ant-design:plus-outlined'" :size="20" @click="handleEditDetail()" />
        </Tooltip>
      </div>
      {{ record }}
    </div>
    <BasicModal :open="modalVisible" title="详情" width="50%" :showOkBtn="edit == true" @ok="handleSubmit"
      :onCancel="handleModalClose">
      <div class="border border-solid border-neutral-500">
        <CodeEditor v-model:value="record" />
      </div>
      提示：使用${keyName}警报条件中属性值或报文关键字。
    </BasicModal>
  </div>
</template>
<script lang="ts" setup name="AlarmDetail">
import { onMounted, ref } from 'vue';
import { Icon } from '/@/components/Icon'
import { Tooltip } from 'ant-design-vue';
import { BasicModal } from '/@/components/Modal';
import { propTypes } from '/@/utils/propTypes';
import { CodeEditor } from '/@/components/CodeEditor';
import { isEmpty } from 'lodash-es';

const emit = defineEmits(['update:value']);

const props = defineProps({
  value: propTypes.string.def(''),
  edit: propTypes.bool.def(true),
});
const record = ref('');

const modalVisible = ref(false);


function handleEditDetail() {
  modalVisible.value = true;

}

function handleModalClose() {
  modalVisible.value = false;
}

onMounted(() => {
  init();
})
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