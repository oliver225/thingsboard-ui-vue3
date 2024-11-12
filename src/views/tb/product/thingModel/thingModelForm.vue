<template>
  <div class="device-thing-model">
    <BasicTable @register="registerTable" :dataSource="dataSource">
      <!-- <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t(getTitle.value) }}
        </div>
      </template> -->
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})">
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
      <template #dateSpecsSlot="{ record }"> ccc </template>
      <template #dataTypeSlot="{ record }">
        <span v-if="record.dataType?.type">
          {{
            DATA_TYPE_OPTIONS.find((item) => item.value === record.dataType.type)?.label ||
            record.dataType.type
          }}
        </span>
      </template>
    </BasicTable>
    <InputForm @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="DeviceThingsModelForm">
  import { reactive, ref } from 'vue';
  import { useModal } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import InputForm from './form.vue';
  import { Function } from '/@/api/tb/deviceProfile';
  import { FUNCTION_TYPE_OPTIONS, DATA_TYPE_OPTIONS } from '/@/enums/thingsModelEnum';

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();

  const getTitle = {
    value: '物模型',
  };

  const searchParam = reactive({
    textSearch: '',
  });

  const dataSource = ref<Array<Function>>();

  const tableColumns: BasicColumn[] = [
    {
      title: t('功能类型'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      format: (text: any) =>
        text ? FUNCTION_TYPE_OPTIONS.find((item) => item.value === text)?.label || text : '',
    },
    {
      title: t('功能名称'),
      dataIndex: 'name',
      key: 'name',
      align: 'center',
    },
    {
      title: t('标识符'),
      dataIndex: 'identifier',
      key: 'identifier',
      align: 'center',
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
      width: 80,
      align: 'center',
      slot: 'dateSpecsSlot',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
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
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
    pagination: false,
    resizeHeightOffset: 200,
  });

  function handleForm(record: Recordable) {
    openModal(true, record);
  }

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
        const index = dataSource.value?.findIndex((item) => item.identifier == record.identifier);
        if (index !== undefined && index !== -1) {
          dataSource.value?.splice(index, 1);
        }
      },
    });
  }

  function handleSuccess(data: Function) {
    if (data) {
      dataSource.value = [...(dataSource.value || []), data];
    }
  }

  defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue });

  async function setFieldsValue(values: any) {
    dataSource.value = [];
    if (values.properties) {
      values.properties.forEach((item: any) => {
        item.type = 'property';
      });
      dataSource.value.push(...values.properties);
    }
    if (values.services) {
      values.services.forEach((item: any) => {
        item.type = 'service';
      });
      dataSource.value.push(...values.services);
    }
    if (values.events) {
      values.events.forEach((item: any) => {
        item.type = 'event';
      });
      dataSource.value.push(...values.events);
    }
  }
  async function resetFields() {
    dataSource.value = [];
  }
  async function validate() {
    const data = {
      properties: dataSource.value?.filter((item) => item.type == 'property'),
      services: dataSource.value?.filter((item) => item.type == 'service'),
      events: dataSource.value?.filter((item) => item.type == 'event'),
    };
    return data;
  }
  async function getFieldsValue() {
    return {
      properties: dataSource.value?.filter((item) => item.type == 'property'),
      services: dataSource.value?.filter((item) => item.type == 'service'),
      events: dataSource.value?.filter((item) => item.type == 'event'),
    };
  }
</script>
<style lang="less">
  .device-thing-model {
  }
</style>
