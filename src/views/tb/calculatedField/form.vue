<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="50%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
        <p class="text-base font-bold mb-2">{{ t('tb.calculatedField.form.basic') }}</p>
        <Row :gutter="16">
          <Col :span="18">
            <Form.Item
              :label="t('tb.calculatedField.form.title')"
              name="name"
              :rules="[{ required: true, message: t('tb.calculatedField.form.titleRequired') }]"
            >
              <a-input v-model:value="formState.name" :placeholder="t('tb.calculatedField.form.titlePlaceholder')" />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label=" " name="debugSettings">
              <DebugSetting v-model:value="formState.debugSettings" :inForm="true" />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item
              :label="t('tb.calculatedField.form.type')"
              name="type"
              :rules="[{ required: true, message: t('tb.calculatedField.form.typeRequired') }]"
            >
              <Select v-model:value="formState.type" :placeholder="t('tb.calculatedField.form.typePlaceholder')">
                <Select.Option value="SIMPLE">{{ t('tb.calculatedField.form.type_simple') }}</Select.Option>
                <Select.Option value="SCRIPT">{{ t('tb.calculatedField.form.type_script') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-base font-bold">{{ t('tb.calculatedField.form.arguments') }}</p>
          <Button type="primary" size="small" @click="handleAddArgument">
            <Icon icon="ant-design:plus-outlined" class="mr-1" />
            {{ t('tb.calculatedField.action.addArgument') }}
          </Button>
        </div>
        <Form.Item name="arguments" :rules="[{ validator: validateArguments }]">
          <div v-if="argumentsList.length === 0" class="text-center py-8 text-gray-400">
            <Icon icon="ant-design:inbox-outlined" class="text-4xl mb-2" />
            <div class="text-sm">{{ t('tb.calculatedField.argument.noArguments') }}</div>
          </div>
          <ArgumentsTable
            v-else
            :dataSource="argumentsList"
            @edit="handleEditArgument"
            @delete="handleDeleteArgument"
          />
        </Form.Item>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4" v-if="formState.type === 'SIMPLE'">
        <p class="text-base font-bold mb-2">{{ t('tb.calculatedField.form.expression') }}</p>
        <Form.Item :name="['configuration', 'expression']" :required="true">
          <Textarea v-model:value="formState.configuration!.expression" :rows="1" placeholder="(template -32) /1.8" />
        </Form.Item>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4" v-if="formState.type === 'SCRIPT'">
        <p class="text-base font-bold mb-2">{{ t('tb.calculatedField.form.script') }}</p>
        <Form.Item :name="['configuration', 'expression']" :required="true">
          <div class="flex justify-between">
            <div class="flex items-center">
              <p class="text-gray-500">function calculate(</p>
              <p class="text-gray-500">
                ctx<span v-if="scriptArgumentParams">, {{ scriptArgumentParams }}</span>
              </p>
              <p class="text-gray-500">) {</p>
            </div>
            <Space>
              <Tooltip :title="t('tb.ruleChain.nodeAction.format')">
                <Icon class="cursor-pointer" :icon="'ant-design:format-painter-filled'" />
              </Tooltip>
              <Tooltip :title="t('tb.ruleChain.nodeAction.fullScreen')">
                <Icon class="cursor-pointer" :icon="'ant-design:fullscreen-outlined'" />
              </Tooltip>
            </Space>
          </div>
          <div class="border border-solid border-gray-400 h-56">
            <CodeEditor v-model:value="formState.configuration!.expression" :mode="MODE.JAVASCRIPT" />
          </div>
          <div class="text-gray-500">}</div>
          <Button class="mt-2" type="primary" @click="handleTestScript">
            {{ t('tb.ruleChain.nodeAction.testScript') }}
          </Button>
        </Form.Item>
      </div>
      <div class="border border-solid border-neutral-300 rounded-md py-3 px-4 mb-4">
        <p class="text-base font-bold mb-2">{{ t('tb.calculatedField.form.output') }}</p>
        <Row :gutter="16">
          <Col :span="formState.configuration!.output.type === 'ATTRIBUTES' ? 12 : 24">
            <Form.Item
              :label="t('tb.calculatedField.form.outputType')"
              :name="['configuration', 'output', 'type']"
              :required="true"
            >
              <Select
                v-model:value="formState.configuration!.output.type"
                :placeholder="t('tb.calculatedField.form.outputTypePlaceholder')"
              >
                <Select.Option value="TIME_SERIES">
                  {{ t('tb.calculatedField.form.outputTypeTimeSeries') }}
                </Select.Option>
                <Select.Option value="ATTRIBUTES">
                  {{ t('tb.calculatedField.form.outputTypeAttributes') }}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12" v-if="formState.configuration!.output.type === 'ATTRIBUTES'">
            <Form.Item
              :label="t('tb.calculatedField.form.attributeScope')"
              :name="['configuration', 'output', 'scope']"
            >
              <Select
                v-model:value="formState.configuration!.output.scope"
                :placeholder="t('tb.calculatedField.form.attributeScopePlaceholder')"
                :options="SCOPE_OPTIONS_SERVER"
              />
            </Form.Item>
          </Col>
          <Col :span="12" v-if="formState.type === 'SIMPLE'">
            <Form.Item
              :label="t('tb.calculatedField.form.key')"
              :name="['configuration', 'output', 'name']"
              :required="true"
            >
              <a-input
                v-model:value="formState.configuration!.output.name"
                :placeholder="t('tb.calculatedField.form.keyPlaceholder')"
              />
            </Form.Item>
          </Col>
          <Col :span="12" v-if="formState.type === 'SIMPLE'">
            <Form.Item
              :label="t('tb.calculatedField.form.defaultDecimals')"
              :name="['configuration', 'output', 'decimalsByDefault']"
              :required="true"
            >
              <InputNumber
                :min="0"
                style="width: calc(99%)"
                v-model:value="formState.configuration!.output.decimalsByDefault"
                :placeholder="t('tb.calculatedField.form.defaultDecimalsPlaceholder')"
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </Form>

    <ArgumentModal @register="registerArgumentModal" @success="handleArgumentSaved" />
    <TestScriptModal @register="registerTestScriptModal" @success="handleTestScriptSaved" />
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbCalculatedFieldForm">
  import { ref, unref, computed, reactive, watch } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { usePermission } from '/@/hooks/web/usePermission';
  import DebugSetting from './debugSetting.vue';
  import ArgumentModal from './ArgumentModal.vue';
  import TestScriptModal from './TestScriptModal.vue';

  import { Select, Row, Col, Space, Tooltip, Textarea, Form, InputNumber, Button } from 'ant-design-vue';
  import { BasicModal, useModalInner, useModal } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { Authority } from '/@/enums/authorityEnum';
  import { Argument, CalculatedField, getCalculatedFieldById, saveCalculatedField } from '/@/api/tb/calculatedField';
  import { cloneDeep } from 'lodash-es';
  import { SCOPE_OPTIONS_SERVER } from '/@/enums/telemetryEnum';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { ArgumentEntityType, ARGUMENT_ENTITY_TYPE_MAP, ARGUMENT_TYPE_MAP } from '/@/enums/calculatedFieldEnum';
  import ArgumentsTable from './components/ArgumentsTable.vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const formRef = ref<FormInstance>();
  const record = ref<CalculatedField>({} as CalculatedField);
  const [registerArgumentModal, { openModal: openArgumentModal }] = useModal();
  const [registerTestScriptModal, { openModal: openTestScriptModal }] = useModal();

  const DEFAULT_FORM: Omit<CalculatedField, 'name'> = {
    tenantId: userStore.getUserInfo.tenantId,
    type: 'SIMPLE',
    debugSettings: {
      failuresEnabled: true,
      allEnabled: true,
      allEnabledUntil: 0,
    },
    configuration: {
      type: 'SIMPLE',
      arguments: new Map<string, Argument>(),
      expression: '',
      output: {
        name: '',
        type: 'TIME_SERIES',
      },
      useLatestTs: false,
    },
  };

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.calculatedField.action.edit') : t('tb.calculatedField.action.add'),
  }));

  const formState = reactive<Partial<CalculatedField>>(cloneDeep(DEFAULT_FORM));
  const argumentsList = ref<any[]>([]);

  // 仅在脚本模式下展示，用于预览 function 参数签名
  const scriptArgumentParams = computed(() => {
    if (formState.type !== 'SCRIPT') return '';
    const names = argumentsList.value
      .map((arg) => arg?.name)
      .filter((n: any) => typeof n === 'string' && n.trim().length > 0);
    return names.join(', ');
  });

  const SAMPLE_SCRIPT = `// Sample script to convert temperature readings from Fahrenheit to Celsius\nreturn {\n    \"temperatureC\": (temperatureF - 32) / 1.8\n};`;

  watch(
    () => formState.type,
    (newType, oldType) => {
      if (newType === 'SCRIPT') {
        // 切换到脚本：无论是否有旧值，都以示例脚本作为起始
        if (!formState.configuration) {
          (formState as any).configuration = {};
        }
        (formState.configuration as any).expression = SAMPLE_SCRIPT;
      } else if (newType === 'SIMPLE' && oldType === 'SCRIPT') {
        // 从脚本切回简单：清空表达式
        if (!formState.configuration) {
          (formState as any).configuration = {};
        }
        (formState.configuration as any).expression = '';
      }
    },
    { immediate: true },
  );

  const argumentColumns = [
    {
      title: t('tb.calculatedField.argument.name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('tb.calculatedField.argument.entityType'),
      dataIndex: 'entityType',
      key: 'entityType',
      width: 120,
    },
    {
      title: t('tb.calculatedField.argument.targetEntity'),
      dataIndex: 'targetEntity',
      key: 'targetEntity',
      width: 120,
    },
    {
      title: t('tb.calculatedField.argument.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
    },
    {
      title: t('tb.calculatedField.form.key'),
      dataIndex: 'key',
      key: 'key',
      width: 150,
    },
    {
      title: t('tb.common.action'),
      key: 'action',
      width: 100,
      fixed: 'right' as const,
    },
  ];

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as CalculatedField;
    if (data?.id?.id) {
      const res = await getCalculatedFieldById(data.id.id);
      record.value = (res || {}) as CalculatedField;
      Object.assign(formState, record.value);
      console.log('record.value :>> ', record.value);
      // 转换 arguments Map 为数组
      if (formState.configuration?.arguments) {
        argumentsList.value = Object.entries(formState.configuration.arguments).map(([key, value]: [string, any]) => {
          const argument: any = {
            name: key,
            defaultValue: value.defaultValue,
            refEntityId: value.refEntityId, // 保留完整的对象
            refEntityKey: value.refEntityKey,
            type: value.refEntityKey?.type,
            key: value.refEntityKey?.key || '',
            scope: value.refEntityKey?.scope, // 保存 scope 用于编辑
          };

          // 根据 refEntityId 判断实体类型
          if (!value.refEntityId) {
            argument.entityType = ArgumentEntityType.CURRENT_ENTITY;
          } else if (value.refEntityId.entityType === EntityType.TENANT) {
            argument.entityType = ArgumentEntityType.CURRENT_TENANT;
          } else {
            argument.entityType = value.refEntityId.entityType;
          }

          // targetEntityName 用于表格显示
          argument.targetEntityName = '';

          return argument;
        });
        console.log('argumentsList.value :>> ', argumentsList.value);
      } else {
        argumentsList.value = [];
      }
    } else {
      Object.assign(formState, cloneDeep({ ...DEFAULT_FORM, ...data }));
      argumentsList.value = [];
    }

    setModalProps({ loading: false });
  });

  function handleAddArgument() {
    console.log('record.value.entityId :>> ', record.value.entityId);
    openArgumentModal(true, { entityId: record.value.entityId });
  }

  function handleEditArgument(_record: any, index: number) {
    openArgumentModal(true, { argument: _record, index, entityId: record.value.entityId });
  }

  function handleDeleteArgument(index: number) {
    argumentsList.value.splice(index, 1);
  }

  function handleArgumentSaved(data: { argument: any; index: number; isEdit: boolean }) {
    if (data.isEdit && data.index >= 0) {
      // 编辑模式
      argumentsList.value[data.index] = data.argument;
    } else {
      // 新增模式
      argumentsList.value.push(data.argument);
    }
  }

  // 接收测试弹窗保存的脚本与参数
  function handleTestScriptSaved(payload: { scriptContent: string; args?: any[] }) {
    if (payload?.scriptContent != null) {
      if (!formState.configuration) {
        (formState as any).configuration = {} as any;
      }
      (formState.configuration as any).expression = payload.scriptContent;
    }
    if (Array.isArray(payload?.args)) {
      argumentsList.value = payload.args as any[];
    }
  }

  function handleTestScript() {
    const script = formState.configuration?.expression || '';
    openTestScriptModal(true, {
      scriptContent: script,
      args: cloneDeep(argumentsList.value),
      columns: argumentColumns,
      entityId: record.value.entityId,
    });
  }

  function validateArguments(_rule: any, _value: any) {
    if (argumentsList.value.length === 0) {
      return Promise.reject(t('tb.calculatedField.form.argumentsEmpty'));
    }
    return Promise.resolve();
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      if (data == undefined) {
        throw new Error(t('tb.entityView.form.dataEmpty'));
      }

      // 将 arguments 数组转换为 Map（后端格式）
      const argumentsMap: Record<string, any> = {};
      argumentsList.value.forEach((arg) => {
        const { name, entityType, type, key, defaultValue, refEntityId, refEntityKey, targetEntityName, ...rest } = arg;

        const argumentData: any = {
          defaultValue: defaultValue || '',
        };

        // 如果有 refEntityId，使用它
        if (refEntityId) {
          argumentData.refEntityId = refEntityId;
        }

        // 如果有 refEntityKey，使用它
        if (refEntityKey) {
          argumentData.refEntityKey = refEntityKey;
        }

        argumentsMap[name] = argumentData;
      });
      // 确保 configuration 存在
      data.configuration = data.configuration || {};
      data.configuration.arguments = argumentsMap;
      // 确保 configuration.type 与表单类型同步
      data.configuration.type = data.type;
      // 新增时需要带上 entityId（来自列表页传入或已编辑记录）
      if (!data.entityId && record.value?.entityId) {
        (data as any).entityId = record.value.entityId;
      }

      setModalProps({ confirmLoading: true });

      const res = await saveCalculatedField({ ...data, id: record.value.id });
      showMessage(
        record.value.id?.id ? t('tb.calculatedField.action.editSuccess') : t('tb.calculatedField.action.addSuccess'),
      );
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
