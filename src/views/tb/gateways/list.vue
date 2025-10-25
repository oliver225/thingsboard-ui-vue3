<template>
  <div class="asset-list">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ getTitle.value }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <a-button type="primary" @click="handleForm({})" v-show="hasPermission(Authority.TENANT_ADMIN)">
            <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.gateway.action.add') }}
          </a-button>
          <a-input
            v-model:value="searchParam.textSearch"
            :placeholder="t('tb.gateway.search.searchText')"
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
      <template #firstColumn="{ record }">
        <a @click="handelDetail(record)" :title="record.title">{{ record?.latest?.ENTITY_FIELD?.name?.value }}</a>
      </template>
    </BasicTable>

    <InputForm @register="registerFormModal" @success="handleSuccess" />

    <DetailDrawer @register="registerDrawer" @success="handleSuccess" />

    <LaunchCommand @register="registerLaunchModal" />
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbAssetList',
  });
</script>
<script lang="ts" setup>
  import { defineComponent, h, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { Tag } from 'ant-design-vue';
  import dayjs from 'dayjs';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { usePermission } from '/@/hooks/web/usePermission';

  import { Authority } from '/@/enums/authorityEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';

  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import { useDrawer } from '/@/components/Drawer';

  import { deleteDevice } from '/@/api/tb/device';

  import InputForm from './form.vue';
  import DetailDrawer from './generalConfiguration/index.vue';
  import LaunchCommand from './launchCommand.vue';
  import { findEntityDataByQuery } from '/@/api/tb/entityQuery';
  import {
    BooleanOperation,
    EntityFilterType,
    EntityKeyType,
    EntityKeyValueType,
    FilterPredicateType,
    StringOperation,
  } from '/@/enums/queryEnum';
  import { KeyFilter } from '/@/api/model/entityQuery/keyFilter';

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { createConfirm, showMessage } = useMessage();
  const router = useRouter();

  const getTitle = {
    value: t('tb.gateway.title'),
  };

  const searchParam = reactive({
    textSearch: null,
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('tb.gateway.table.name'),
      dataIndex: 'latest.ENTITY_FIELD.name.value',
      key: 'name',
      sorter: true,
      align: 'left',
      fixed: 'left',
      ellipsis: false,
      slot: 'firstColumn',
    },
    {
      title: t('tb.gateway.table.status'),
      dataIndex: 'latest.ATTRIBUTE.active.value',
      key: 'active',
      align: 'center',
      width: 100,
      filterMultiple: false,
      filters: [
        { text: t('tb.gateway.table.online'), value: 'true' },
        { text: t('tb.gateway.table.offline'), value: 'false' },
      ],
      customRender: ({ text }) => {
        if (text === 'true') {
          return h(Tag, { color: 'success' }, () => t('tb.gateway.table.online'));
        }

        return h(Tag, { color: 'error' }, () => t('tb.gateway.table.offline'));
      },
    },
    {
      title: t('tb.gateway.table.activeConnectors'),
      dataIndex: 'latest.ATTRIBUTE.active_connectors.value',
      width: 160,
      align: 'center',
      format: (text) => {
        if (text) {
          return JSON.parse(text).length;
        }
        return '';
      },
    },
    {
      title: t('tb.gateway.table.version'),
      dataIndex: 'latest.ATTRIBUTE.Version.value',
      key: 'version',
      width: 160,
      align: 'center',
    },
    {
      title: t('tb.gateway.table.createdTime'),
      sorter: true,
      dataIndex: 'latest.ENTITY_FIELD.createdTime.value',
      key: 'createdTime',
      format: (text) => {
        if (text) {
          return dayjs.unix(Math.floor(Number(text) / 1000)).format('YYYY-MM-DD HH:mm:ss');
        }
        return '';
      },
      width: 160,
      align: 'center',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'ant-design:play-circle-outlined',
        title: t('tb.gateway.action.startCommand'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleLaunchCommand.bind(this, { ...record }),
      },
      {
        icon: 'ant-design:setting-outlined',
        title: t('tb.gateway.action.generalSetting'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleGeneralConfiguration.bind(this, { ...record }),
      },
      // {
      //   icon: 'ant-design:link-outlined ',
      //   title: t('tb.gateway.action.connectors'),
      //   ifShow: hasPermission(Authority.TENANT_ADMIN),
      // },
      {
        icon: 'ant-design:delete-outlined',
        color: 'error',
        title: t('tb.gateway.action.deleteGateway'),
        ifShow: hasPermission(Authority.TENANT_ADMIN),
        onClick: handleDelete.bind(this, { ...record }),
      },
    ],
  };

  const [registerTable, { reload, setPagination }] = useTable({
    api: fetch,
    beforeFetch: (param) => {
      if (param.sortOrder) {
        param.sortOrder = {
          direction: param.sortOrder.toUpperCase(),
          key: {
            key: param.sortProperty,
            type: EntityKeyType.ENTITY_FIELD,
          },
        };
        delete param.sortProperty;
      }

      const keyFilters: KeyFilter[] = [
        {
          key: {
            type: EntityKeyType.ENTITY_FIELD,
            key: 'additionalInfo',
          },
          valueType: EntityKeyValueType.STRING,
          predicate: {
            type: FilterPredicateType.STRING,
            operation: StringOperation.CONTAINS,
            value: {
              defaultValue: '"gateway":true',
              dynamicValue: null,
            },
            ignoreCase: false,
          },
        },
      ];

      if (param.active && param.active.length > 0) {
        keyFilters.push({
          key: {
            type: EntityKeyType.ATTRIBUTE,
            key: 'active',
          },
          valueType: EntityKeyValueType.BOOLEAN,
          predicate: {
            type: FilterPredicateType.BOOLEAN,
            operation: BooleanOperation.EQUAL,
            value: {
              defaultValue: param.active[0] === 'true',
              dynamicValue: null,
            },
          },
        });
      }

      return {
        entityFilter: {
          type: EntityFilterType.ENTITY_TYPE,
          resolveMultiple: true,
          entityType: EntityType.DEVICE,
        },
        pageLink: {
          page: 0,
          pageSize: 20,
          dynamic: true,
          sortOrder: null,
          textSearch: searchParam.textSearch,
          ...param,
        },
        keyFilters: keyFilters,
        entityFields: [
          {
            type: EntityKeyType.ENTITY_FIELD,
            key: 'createdTime',
          },
          {
            type: EntityKeyType.ENTITY_FIELD,
            key: 'name',
          },
          {
            type: EntityKeyType.ENTITY_FIELD,
            key: 'label',
          },
          {
            type: EntityKeyType.ENTITY_FIELD,
            key: 'additionalInfo',
          },
        ],
        latestValues: [
          { type: EntityKeyType.ATTRIBUTE, key: 'active' },
          {
            type: EntityKeyType.ATTRIBUTE,
            key: 'active_connectors',
          },
          {
            type: EntityKeyType.ATTRIBUTE,
            key: 'Version',
          },
        ],
      };
    },
    rowKey: (record) => record.entityId.id,
    defSort: { sortProperty: 'createdTime', sortOrder: 'ASC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  const [registerFormModal, { openModal: openFormModal }] = useModal();
  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerLaunchModal, { openModal: openLaunchModal }] = useModal();

  function handleForm(_record: Recordable) {
    openFormModal(true, _record);
  }

  function handleGeneralConfiguration(record: Recordable) {
    openDrawer(true, record);
  }

  function handleLaunchCommand(record: Recordable) {
    openLaunchModal(true, record);
  }

  function handelDetail(record: Recordable) {
    router.push({ name: 'GatewayDetail', params: { gatewayId: record.entityId.id } });
  }

  async function handleDelete(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.gateway.action.deleteConfirm', { name: record.latest.ENTITY_FIELD.name.value }),
      content: t('tb.gateway.action.deleteConfirmContent'),
      centered: false,
      okText: t('tb.gateway.action.deleteText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteDevice(record.entityId.id);
          showMessage(t('tb.gateway.action.deleteSuccess'));
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

  /**
   * @param pageLink 查询参数
   */
  async function fetch(pageLink?: any) {
    const res = await findEntityDataByQuery(pageLink);
    if (res) {
      setPagination({
        total: res?.totalElements ?? 0,
      });
    }
    return res;
  }
</script>
<style lang="less"></style>
