<template>
  <BasicModal v-bind="$attrs" @register="registerModal" @ok="handleSubmit" @cancel="handleCancel" width="40%" okText="添加"
    :okButtonProps="{ disabled: (currentTypes?.length || 0) < 1 }">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>

    <Select v-model:value="currentTypes" :mode="customRelations ? 'tags' : 'multiple'" style="width: 100%"
      placeholder="链接标签" size="large">
      <Select.Option v-for="(type, index) in relationTypes" :key="index" :value="type">{{ type }}</Select.Option>
    </Select>


  </BasicModal>
</template>
<script lang="ts" setup name="RuleChainConnectTypeForm">
import { ref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { Icon } from '/@/components/Icon';
import { Select } from 'ant-design-vue';
import { useMessage } from '/@/hooks/web/useMessage';

import { BasicModal, useModalInner } from '/@/components/Modal';
import { isEmpty } from 'lodash-es';

const emit = defineEmits(['success', 'cancel', 'register']);

const { t } = useI18n('tb');
const { showMessage } = useMessage();
const getTitle = computed(() => ({
  icon: 'ant-design:subnode-outlined',
  value: currentTypes.value?.length || 0 > 0 ? t('修改规则节点链接') : t('添加规则节点链接'),
}));

const relationTypes = ref<Array<string>>();
const customRelations = ref(false);
const currentTypes = ref<Array<string>>();
const edgeId = ref('');
const isNewConnect = ref(false);



const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  setModalProps({ loading: true });
  isNewConnect.value = isEmpty(data.currentTypes);
  edgeId.value = data.edgeId;
  currentTypes.value = data.currentTypes || [];
  relationTypes.value = data.relationTypes || [];
  customRelations.value = data.customRelations || false;
  setModalProps({ loading: false });
});

function handleCancel() {
  setTimeout(closeModal);
  if (isNewConnect.value) {
    emit('cancel', { edgeId: edgeId.value });
  } else {
    emit('success', { edgeId: edgeId.value, currentTypes: currentTypes.value });
  }
}

async function handleSubmit() {
  if (isEmpty(currentTypes.value)) {
    showMessage('请选择链接标签', 'error');
    return;
  }
  // console.log('submit', params, data, record);
  setTimeout(closeModal);
  emit('success', { edgeId: edgeId.value, currentTypes: currentTypes.value });
}



</script>
