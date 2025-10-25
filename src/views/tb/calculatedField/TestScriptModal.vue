<template>
  <BasicModal
    @register="registerModal"
    width="100%"
    :defaultFullscreen="true"
    :canFullscreen="false"
    :wrapClassName="'full-screen-modal'"
    :title="t('tb.ruleChain.nodeAction.testScript')"
    @ok="handleSave"
    :okText="t('common.saveText')"
    :cancelText="t('common.cancelText')"
  >
    <template #insertFooter>
      <Button type="primary" @click="handleTest">
        <Icon icon="ant-design:experiment-outlined" class="mr-1" />
        {{ t('tb.ruleChain.nodeAction.testScript') }}
      </Button>
    </template>

    <div class="h-full flex gap-4 pb-12px">
      <!-- 左侧脚本编辑器 -->
      <div class="flex-1 border border-solid border-gray-300 rounded overflow-hidden bg-white min-h-0">
        <div class="flex items-center justify-between mb-2 p-2">
          <div class="flex items-center">
            <p class="text-gray-500">function calculate(</p>
            <p class="text-gray-500">
              ctx<span v-if="scriptArgumentParams">, {{ scriptArgumentParams }}</span>
            </p>
            <p class="text-gray-500">) {</p>
          </div>
        </div>
        <CodeEditor v-model:value="localScript" :mode="MODE.JAVASCRIPT" />
        <div class="text-gray-500 p-2">}</div>
      </div>

      <!-- 右侧 参数表 + 输出 -->
      <div class="flex-1 flex flex-col gap-4 min-h-0">
        <div class="flex-1 bg-white rounded border border-solid border-gray-300 overflow-hidden min-h-0">
          <ArgumentsTable :dataSource="args" @edit="handleEditArgument" @delete="handleDeleteArgument" />
        </div>
        <div class="flex-1 bg-white rounded border border-solid border-gray-300 overflow-hidden min-h-0">
          <CodeEditor v-model:value="output" :mode="MODE.JSON" :readonly="true" />
        </div>
      </div>
    </div>
    <ArgumentModal @register="registerArgumentModal" @success="handleArgumentSaved" />
  </BasicModal>
</template>

<script lang="ts" setup name="CalculatedFieldTestScriptModal">
  import { ref, computed } from 'vue';
  import { Button } from 'ant-design-vue';
  import { BasicModal, useModalInner, useModal } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { useI18n } from '/@/hooks/web/useI18n';
  import ArgumentsTable from './components/ArgumentsTable.vue';
  import ArgumentModal from './ArgumentModal.vue';
  import { testScript } from '/@/api/tb/calculatedField';

  interface ModalData {
    scriptContent: string;
    args: any[];
    columns: any[];
    entityId?: any;
  }

  const emit = defineEmits(['register', 'success']);
  const { t } = useI18n('tb');

  const localScript = ref<string>('');
  const args = ref<any[]>([]);
  const columns = ref<any[]>([]);
  const output = ref<string>('');
  const scriptArgumentParams = computed(() => {
    const names = args.value.map((arg) => arg?.name).filter((n: any) => typeof n === 'string' && n.trim().length > 0);
    return names.join(', ');
  });
  const entityId = ref<any>();

  const [registerModal, { closeModal, setModalProps }] = useModalInner((data: ModalData) => {
    if (data) {
      localScript.value = data.scriptContent || '';
      args.value = Array.isArray(data.args) ? [...data.args] : [];
      columns.value = Array.isArray(data.columns) ? [...data.columns] : [];
      output.value = '';
      entityId.value = data.entityId;
    }
  });
  const [registerArgumentModal, { openModal: openArgumentModal }] = useModal();
  async function handleTest() {
    try {
      setModalProps?.({ loading: true });
      const now = Date.now();
      const argMap: Record<string, any> = {};
      (args.value || []).forEach((arg: any) => {
        if (!arg || !arg.name) return;
        argMap[arg.name] = {
          value: arg.defaultValue ?? '',
          ts: now,
          type: 'SINGLE_VALUE',
        };
      });

      const payload = {
        expression: localScript.value || '',
        arguments: argMap,
      };

      const res = await testScript(payload);
      let text: any = res?.error ? res.error : (res?.output ?? '');
      if (text && typeof text !== 'string') {
        try {
          text = JSON.stringify(text, null, 2);
        } catch (_) {
          text = String(text);
        }
      } else if (typeof text === 'string') {
        const s = text.trim();
        if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
          try {
            text = JSON.stringify(JSON.parse(s), null, 2);
          } catch (_) {
            // keep original string
          }
        }
      }
      output.value = text || '';
    } catch (e: any) {
      const err = e?.message || String(e);
      output.value = JSON.stringify({ output: '', error: err }, null, 2);
    } finally {
      setModalProps?.({ loading: false });
    }
  }

  function handleEditArgument(record: any, index: number) {
    openArgumentModal(true, { argument: record, index, entityId: entityId.value });
  }

  function handleDeleteArgument(index: number) {
    args.value.splice(index, 1);
  }

  function handleArgumentSaved(data: { argument: any; index: number; isEdit: boolean }) {
    if (data.isEdit && data.index >= 0) {
      args.value[data.index] = data.argument;
    } else {
      args.value.push(data.argument);
    }
  }
  function handleSave() {
    emit('success', { scriptContent: localScript.value, args: args.value });
    closeModal();
  }
</script>

<style lang="less" scoped>
  :deep(.full-screen-modal) {
    .ant-modal {
      max-width: 100%;
      top: 0;
      padding-bottom: 0;
      margin: 0;
    }

    .ant-modal-content {
      display: flex;
      flex-direction: column;
      height: calc(100vh);
    }

    .ant-modal-body {
      flex: 1;
      overflow: hidden;
      background-color: #f5f5f5;
      padding: 16px;
    }
  }
</style>
