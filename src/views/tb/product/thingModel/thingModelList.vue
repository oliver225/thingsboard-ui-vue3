<template>
  <div class="device-thing-model">
    <BasicTable @register="registerTable">
      <!-- <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template> -->
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-if="readOnly == false">
            <Icon icon="i-fluent:add-12-filled" /> 新增功能
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload"
            style="width: 240px"
          >
            <template #suffix>
              <icon icon="ant-design:search-outlined" />
            </template>
          </a-input>
        </div>
      </template>
      <template #dataTypeSlot="{ record }">
        <span v-if="record.dataType?.type">
          {{
            DATA_TYPE_OPTIONS.find((item) => item.value === record.dataType.type)?.label ||
            record.dataType.type
          }}
        </span>
      </template>
      <template #dateSpecsSlot="{ record }">
        <div
          v-if="
            record.dataType?.type == DataType.int ||
            record.dataType?.type == DataType.float ||
            record.dataType?.type == DataType.double
          "
        >
          取值范围: {{ record.dataType?.specs?.min }} ~ {{ record.dataType?.specs?.max }}
        </div>
        <div v-if="record.dataType?.type == DataType.bool">
          <div> true: {{ record.dataType?.specs?.trueValue }} </div>
          <div> false:{{ record.dataType?.specs?.falseValue }} </div>
        </div>
        <div v-if="record.dataType?.type == DataType.enum">
          <span> {{ record.dataType?.specs }} </span>
        </div>
        <div v-if="record.dataType?.type == DataType.text">
          数据长度: {{ record.dataType?.specs?.length }}
        </div>
        <div v-if="record.callType">
          调用方式: {{ record.callType == 'asnyc' ? '异步调用' : '同步调用' }}
        </div>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="DeviceThingsModelList">
  import { reactive, ref, watch } from 'vue';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import InputForm from './form.vue';
  import { FUNCTION_TYPE_OPTIONS, DATA_TYPE_OPTIONS, DataType } from '/@/enums/thingsModelEnum';
  import { deleteFunction, functionList } from '/@/api/tb/thingsModel';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: '物模型',
  };

  const props = defineProps({
    readOnly: {
      type: Boolean,
      default: false,
    },
    deviceProfileId: {
      type: String,
      required: true,
    },
  });

  const record = ref();

  const searchParam = reactive({
    textSearch: '',
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('功能类型'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      filterMultiple: false,
      filters: FUNCTION_TYPE_OPTIONS.map((item) => ({ text: item.label, value: item.value })),
      format: (text: any) =>
        text ? FUNCTION_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : '',
    },
    {
      title: t('功能名称'),
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      sorter: true,
    },
    {
      title: t('标识符'),
      dataIndex: 'identifier',
      key: 'identifier',
      align: 'center',
      sorter: true,
    },
    {
      title: t('数据类型'),
      dataIndex: 'dataType.type',
      key: 'dataType.type',
      width: 160,
      align: 'left',
      slot: 'dataTypeSlot',
    },
    {
      title: t('数据规格'),
      dataIndex: 'dataType.specs',
      key: 'dataType.specs',
      align: 'center',
      slot: 'dateSpecsSlot',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    ifShow: props.readOnly == false,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('删除功能'),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerModal, { openModal }] = useModal();
  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.identifier,
    api: (params) => functionList(props.deviceProfileId, params),
    beforeFetch: wrapFetchParams,
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
    pagination: true,
    immediate: true,
  });

  function wrapFetchParams(param: any) {
    return {
      ...param,
      textSearch: searchParam.textSearch,
      type: param.type?.[0],
    };
  }

  function handleForm(record: Recordable) {
    openModal(true, { ...record, deviceProfileId: { id: props.deviceProfileId } });
  }

  watch(
    () => props.deviceProfileId,
    () => {
      if (props.deviceProfileId) {
        reload();
      }
    },
  );

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定删除功能[${record.name}]吗？`,
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteFunction(props.deviceProfileId, record.identifier);
          showMessage('删除功能成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          handleSuccess();
        }
      },
    });
  }

  function handleSuccess() {
    reload();
  }
</script>
<style lang="less">
  .device-thing-model {
  }
</style>
