<template>
  <div class="device-rpc-sender">
    <Segmented v-model:value="selectedType" :options="segmentedList" />

    <div v-if="selectedType === '双向RPC'">
      <div class="p-4">
        <Alert message="向设备发送双向远程过程调用（RPC）请求。" />
      </div>
      <BasicForm @register="registerTwoWayForm">
        <template #params="{ model, field }">
          <div class="border border-solid border-gray-400 h-40">
            <CodeEditor v-model:value="model[field]" :autoFormat="true" :mode="MODE.JSON" />
          </div>
        </template>
      </BasicForm>
      <Button type="primary" @click="sendTwoWayRpc" :loading="sendingTwoWay" class="mb-4">双向 RPC</Button>

      <div v-if="twoWayResult" class="mt-4">
        <h3 class="text-md font-bold mb-2">响应结果:</h3>
        <pre class="bg-gray-100 p-2 rounded">{{ twoWayResult }}</pre>
      </div>
    </div>
    <div v-if="selectedType === '单向RPC'">
      <div class="p-4">
        <Alert message="向设备发送单向远程过程调用（RPC）请求。" />
      </div>
      <BasicForm @register="registerOneWayForm">
        <template #params="{ model, field }">
          <div class="border border-solid border-gray-400 h-40">
            <CodeEditor v-model:value="model[field]" :autoFormat="true" :mode="MODE.JSON" />
          </div>
        </template>
      </BasicForm>
      <Button type="primary" @click="sendOneWayRpc" :loading="sendingOneWay" class="mb-4">单向 RPC</Button>

      <div v-if="oneWayResult" class="mt-4">
        <h3 class="text-md font-bold mb-2">响应结果:</h3>
        <pre class="bg-gray-100 p-2 rounded">{{ oneWayResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, defineProps, reactive } from 'vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Segmented, Alert, Button } from 'ant-design-vue';
  import { rpcSendTwoway, rpcSendOneway } from '/@/api/tb/rpc';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';

  const props = defineProps({
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
  });

  const { createMessage, showMessage } = useMessage();

  const segmentedList = reactive(['单向RPC', '双向RPC']);

  const selectedType = ref(segmentedList[0]);

  const sendingTwoWay = ref(false);
  const sendingOneWay = ref(false);
  const twoWayResult = ref('');
  const oneWayResult = ref('');

  const twoWayFormSchema: FormSchema[] = [
    {
      label: 'RPC 命令',
      helpMessage: '用于区分不同 RPC 调用的方法名称。',
      field: 'method',
      component: 'Input',
      componentProps: {
        placeholder: '输入命令',
        style: { width: 'calc(50%)' },
      },
      rules: [{ pattern: /^[a-zA-Z_]+$/, message: '请输入英文字符！' }, { required: true }],
    },
    {
      label: '超时时间',
      helpMessage: '处理超时时间（单位：毫秒）。默认值为 10000（10 秒），最小值为 5000（5 秒）',
      field: 'timeout',
      component: 'InputNumber',
      componentProps: {
        min: 5000,
        step: 100,
        addonAfter: '毫秒',
        style: { width: 'calc(50%)' },
      },
      defaultValue: 10000,
      required: true,
    },
    {
      label: '重试次数',
      helpMessage: '定义在网络或设备端发生失败时，持久化 RPC 将重试发送的次数。',
      field: 'retries',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 1,
        style: { width: 'calc(50%)' },
      },
      required: false,
    },
    {
      label: '持久化 RPC',
      helpMessage: '指示是否为持久化 RPC。默认值为 \"false\"',
      field: 'persistent',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      required: false,
    },
    {
      label: 'RPC 参数',
      helpMessage: '用于处理请求所需的参数。该值为一个 JSON 对象。若无需参数，请使用空 JSON \"{}\"',
      field: 'params',
      component: 'Input',
      slot: 'params',
      colProps: { span: 24 },
      required: true,
      defaultValue: '{}',
    },
  ];

  const oneWayFormSchema: FormSchema[] = [
    {
      label: 'RPC 命令',
      helpMessage: '用于区分不同 RPC 调用的方法名称。',
      field: 'method',
      component: 'Input',
      componentProps: {
        placeholder: '输入命令',
        style: { width: 'calc(50%)' },
      },
      rules: [{ pattern: /^[a-zA-Z_]+$/, message: '请输入英文字符！' }, { required: true }],
    },
    {
      label: '超时时间',
      helpMessage: '处理超时时间（单位：毫秒）。默认值为 10000（10 秒），最小值为 5000（5 秒）',
      field: 'timeout',
      component: 'InputNumber',
      componentProps: {
        min: 5000,
        step: 100,
        addonAfter: '毫秒',
        style: { width: 'calc(50%)' },
      },
      defaultValue: 10000,
      required: true,
    },
    {
      label: '重试次数',
      helpMessage: '定义在网络或设备端发生失败时，持久化 RPC 将重试发送的次数。',
      field: 'retries',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 1,
        style: { width: 'calc(50%)' },
      },
      required: false,
    },
    {
      label: '持久化 RPC',
      helpMessage: '指示是否为持久化 RPC。默认值为 \"false\"',
      field: 'persistent',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      required: false,
    },
    {
      label: 'RPC 参数',
      helpMessage: '用于处理请求所需的参数。该值为一个 JSON 对象。若无需参数，请使用空 JSON \"{}\"',
      field: 'params',
      component: 'Input',
      slot: 'params',
      colProps: { span: 24 },
      required: true,
      defaultValue: '{}',
    },
  ];

  const [registerTwoWayForm, { validate: validateTwoWay }] = useForm({
    labelWidth: 120,
    schemas: twoWayFormSchema,
    baseColProps: { span: 24 },
  });

  const [registerOneWayForm, { validate: validateOneWay }] = useForm({
    labelWidth: 120,
    schemas: oneWayFormSchema,
    baseColProps: { span: 24 },
  });

  async function sendTwoWayRpc() {
    try {
      const values = await validateTwoWay();
      sendingTwoWay.value = true;
      twoWayResult.value = '';

      const params: any = {
        method: values.method,
        timeout: values.timeout,
      };

      try {
        params.params = JSON.parse(values.params);
      } catch (e) {
        showMessage('参数格式错误，请输入有效的 JSON 格式', 'error');
        return;
      }

      const result = await rpcSendTwoway(props.entityId, params);
      twoWayResult.value = JSON.stringify(result, null, 2);
      showMessage('双向 RPC 发送成功', 'success');
    } catch (error) {
      if (error && error.errorFields) {
        showMessage('请填写必填字段', 'error');
      } else {
        showMessage('双向 RPC 发送失败: ' + error.message, 'error');
      }
    } finally {
      sendingTwoWay.value = false;
    }
  }

  async function sendOneWayRpc() {
    try {
      const values = await validateOneWay();
      sendingOneWay.value = true;
      oneWayResult.value = '';

      const params: any = {
        method: values.method,
        timeout: values.timeout,
      };

      try {
        params.params = JSON.parse(values.params);
      } catch (e) {
        showMessage('参数格式错误，请输入有效的 JSON 格式', 'error');
        return;
      }

      const result = await rpcSendOneway(props.entityId, params);
      oneWayResult.value = '命令已发送';
      if (result) {
        oneWayResult.value = JSON.stringify(result, null, 2);
      }
      createMessage.success('单向 RPC 发送成功');
    } catch (error) {
      if (error && error.errorFields) {
        showMessage('请填写必填字段', 'error');
      } else {
        showMessage('单向 RPC 发送失败: ' + error.message, 'error');
      }
    } finally {
      sendingOneWay.value = false;
    }
  }
</script>

<style lang="less">
  .device-rpc-sender {
    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }
  }
</style>
