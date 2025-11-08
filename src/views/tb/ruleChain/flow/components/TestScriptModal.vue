<template>
  <BasicModal
    @register="registerModal"
    width="100%"
    :defaultFullscreen="true"
    :canFullscreen="false"
    :wrapClassName="'full-screen-modal'"
    :bodyStyle="{ backgroundColor: '#f5f5f5' }"
    @ok="handleSave"
    :okText="t('common.saveText')"
    :cancelText="t('tb.ruleChain.nodeAction.testScriptModal.close')"
  >
    <template #insertFooter>
      <Button type="primary" @click="handleTestScript">
        <Icon icon="ant-design:experiment-outlined" class="mr-1" />
        {{ t('tb.ruleChain.nodeAction.testScriptModal.test') }}
      </Button>
    </template>
    <template #title>
      <div class="flex items-center gap-4">
        <span>{{ modalTitle }}</span>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ t('tb.ruleChain.nodeAction.testScriptModal.messageType') }}:</span>
          <Select v-model:value="messageType" style="width: 180px" size="small" :options="TB_MSG_TYPE_OPTIONS" />
        </div>
      </div>
    </template>

    <div class="h-full flex gap-4 pb-12px">
      <!-- 主内容区域 -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- 左侧区域 -->
        <div class="flex-1 flex flex-col gap-4 min-h-0">
          <!-- 消息内容区域 -->
          <div class="flex-1 flex flex-col bg-white rounded-lg border-2 border-blue-200 shadow-sm p-4 min-h-0">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-1 h-5 bg-blue-500 rounded"></div>
                <Icon icon="ant-design:message-outlined" class="text-lg text-blue-500" />
                <span class="text-sm font-semibold text-gray-800">{{
                  t('tb.ruleChain.nodeAction.testScriptModal.messageContent')
                }}</span>
              </div>
              <Space>
                <Tooltip :title="t('tb.ruleChain.nodeAction.format')">
                  <Button size="small" @click="handleFormatMessage">
                    <Icon icon="ant-design:format-painter-filled" />
                  </Button>
                </Tooltip>
                <Tooltip :title="t('tb.ruleChain.nodeAction.testScriptModal.reset')">
                  <Button size="small" @click="handleResetMessage">
                    <Icon icon="ant-design:reload-outlined" />
                  </Button>
                </Tooltip>
              </Space>
            </div>
            <div class="flex-1 border border-solid border-gray-300 rounded overflow-hidden min-h-0">
              <CodeEditor v-model:value="messageContent" :mode="MODE.JSON" />
            </div>
          </div>
          <!-- Transformer 区域 -->
          <div class="flex-1 flex flex-col bg-white rounded-lg border-2 border-green-200 shadow-sm p-4 min-h-0">
            <div class="flex items-center mb-3">
              <div class="w-1 h-5 bg-green-500 rounded mr-2"></div>
              <Icon icon="ant-design:code-outlined" class="text-lg text-green-500 mr-2" />
              <div class="text-gray-500 text-sm">function {{ transformerTitle }}(msg, metadata, msgType) {</div>
            </div>
            <div class="flex-1 border border-solid border-gray-300 rounded overflow-hidden min-h-0">
              <CodeEditor v-model:value="scriptContent" :mode="MODE.JAVASCRIPT" />
            </div>
            <div class="text-gray-500 text-sm mt-2">}</div>
          </div>
        </div>

        <!-- 右侧区域 -->
        <div class="flex-1 flex flex-col gap-4 min-h-0">
          <!-- 元资料区域 -->
          <div class="flex-1 flex flex-col bg-white rounded-lg border-2 border-orange-200 shadow-sm p-4 min-h-0">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-1 h-5 bg-orange-500 rounded"></div>
                <Icon icon="ant-design:database-outlined" class="text-lg text-orange-500" />
                <span class="text-sm font-semibold text-gray-800">{{
                  t('tb.ruleChain.nodeAction.testScriptModal.metadata')
                }}</span>
              </div>
              <Button type="primary" size="small" @click="handleAddMetadata">
                <Icon icon="ant-design:plus-outlined" class="mr-1" />
                {{ t('tb.ruleChain.nodeAction.testScriptModal.addMetadata') }}
              </Button>
            </div>
            <div class="flex-1 overflow-auto min-h-0">
              <div v-if="metadataList.length === 0" class="flex items-center justify-center h-full text-gray-400">
                <div class="text-center">
                  <Icon icon="ant-design:inbox-outlined" class="text-4xl mb-2" />
                  <div class="text-sm">暂无元资料</div>
                </div>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(item, index) in metadataList"
                  :key="index"
                  class="flex items-center gap-2 p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                >
                  <Input
                    v-model:value="item.key"
                    :placeholder="t('tb.ruleChain.nodeAction.testScriptModal.key')"
                    class="flex-1"
                    size="small"
                  />
                  <Input
                    v-model:value="item.value"
                    :placeholder="t('tb.ruleChain.nodeAction.testScriptModal.value')"
                    class="flex-1"
                    size="small"
                  />
                  <Button type="text" danger size="small" @click="handleRemoveMetadata(index)">
                    <Icon icon="ant-design:close-outlined" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- 输出区域 -->
          <div class="flex-1 flex flex-col bg-white rounded-lg border-2 border-purple-200 shadow-sm p-4 min-h-0">
            <div class="flex items-center mb-3">
              <div class="w-1 h-5 bg-purple-500 rounded mr-2"></div>
              <Icon icon="ant-design:file-text-outlined" class="text-lg text-purple-500 mr-2" />
              <span class="text-sm font-semibold text-gray-800">{{
                t('tb.ruleChain.nodeAction.testScriptModal.output')
              }}</span>
            </div>
            <div class="flex-1 border border-solid border-gray-300 rounded overflow-hidden bg-gray-50 min-h-0">
              <CodeEditor v-model:value="result" :mode="MODE.JSON" :readonly="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup name="TestScriptModal">
  import { ref, computed } from 'vue';
  import { Button, Input, Space, Tooltip, Select } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { testScript } from '/@/api/tb/ruleChain';
  import { TbMsgType, TB_MSG_TYPE_OPTIONS } from '/@/enums/tbMsgTypeEnum';
  import { isEmpty } from '/@/utils/is';

  interface MetadataItem {
    key: string;
    value: string;
  }

  interface ModalData {
    scriptLang: 'JS' | 'TBEL';
    scriptContent: string;
    modalTitle: string;
    transformerTitle: string;
    scriptType: string;
  }

  const emit = defineEmits(['register', 'success']);
  const { t } = useI18n();

  const scriptLang = ref<'JS' | 'TBEL'>('JS');
  const scriptContent = ref<string>('return msg.temperature > 20;');
  const modalTitle = ref<string>('');
  const transformerTitle = ref<string>('');
  const messageContent = ref<string>('{\n  "temperature": 22.4,\n  "humidity": 78\n}');
  const scriptType = ref<string>('filter');
  const messageType = ref<string>(TbMsgType.POST_TELEMETRY_REQUEST);
  const metadataList = ref<MetadataItem[]>([]);

  const result = ref('');

  const [registerModal, { closeModal, setModalProps }] = useModalInner((data: ModalData) => {
    if (data) {
      scriptLang.value = data.scriptLang;
      scriptContent.value = data.scriptContent;
      modalTitle.value = data.modalTitle;
      transformerTitle.value = data.transformerTitle;
      scriptType.value = data.scriptType;

      // 初始化元资料，ts 为当前时间戳
      metadataList.value = [
        { key: 'deviceName', value: 'Test Device' },
        { key: 'deviceType', value: 'default' },
        { key: 'ts', value: Date.now().toString() },
      ];

      // 清空输出结果
      result.value = '';
    }
  });

  function handleAddMetadata() {
    metadataList.value.push({ key: '', value: '' });
  }

  function handleRemoveMetadata(index: number) {
    metadataList.value.splice(index, 1);
  }

  function handleFormatMessage() {
    try {
      const parsed = JSON.parse(messageContent.value);
      messageContent.value = JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('Invalid JSON format', error);
    }
  }

  function handleResetMessage() {
    messageContent.value = '{\n  "temperature": 22.4,\n  "humidity": 78\n}';
    metadataList.value = [
      { key: 'deviceName', value: 'Test Device' },
      { key: 'deviceType', value: 'default' },
      { key: 'ts', value: Date.now().toString() },
    ];
    result.value = '';
  }

  // 测试脚本
  async function handleTestScript() {
    try {
      setModalProps({ loading: true });
      // 构建 metadata 对象
      const metadata: Record<string, string> = {};
      metadataList.value.forEach((item) => {
        if (item.key) {
          metadata[item.key] = item.value;
        }
      });

      // 拼接测试 JSON
      const testData = {
        argNames: ['msg', 'metadata', 'msgType'],
        scriptType: scriptType.value,
        msgType: messageType.value,
        msg: messageContent.value,
        metadata: metadata,
        script: scriptContent.value,
      };

      // 输出结果
      const res = await testScript(scriptLang.value, testData);

      if (!isEmpty(res.error)) {
        result.value = res.error;
      } else {
        result.value = res.output;
      }

      console.log('Test data:', res);
    } catch (error: any) {
      result.value = JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
        },
        null,
        2,
      );
    } finally {
      setModalProps({ loading: false });
    }
  }

  // 保存脚本到父组件
  function handleSave() {
    emit('success', { scriptContent: scriptContent.value });
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
