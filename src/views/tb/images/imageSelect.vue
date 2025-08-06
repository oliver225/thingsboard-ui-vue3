<template>
  <BasicModal v-bind="$attrs" :footer="null" :can-fullscreen="false" width="800px" @register="registerModal">
    <BasicTable @register="registerTable">
      <template #headerTop>
        <div class="text-lg font-bold my-2">
          {{ t('图形库') }}
        </div>
      </template>
      <template #tableTitle>
        <div class="space-x-2">
          <Button type="primary" @click="handleUpload({})">
            <Icon icon="ant-design:upload-outlined" /> 上传图片
          </Button>
          <Input
            v-model:value="searchParam.textSearch"
            placeholder="输入搜索内容"
            allow-clear
            @change="reload()"
            style="width: 240px"
          >
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </Input>
          <template v-if="hasPermission(Authority.TENANT_ADMIN)">
            <Checkbox v-model:checked="searchParam.includeSystemImages" @change="reload()"> 包含系统图像 </Checkbox>
          </template>
        </div>
      </template>
      <template #firstColumn="{ record }">
        <Space>
          <div class="h-10 w-10 bg-white flex justify-center">
            <img :src="record.publicLink" :alt="record.name" class="cursor-pointer w-full" />
          </div>
          {{ record.title }}
        </Space>
      </template>
      <template #isSystem="{ record }">
        <Checkbox :checked="record.link.indexOf('system') > -1" />
      </template>
    </BasicTable>
    <ImageUpload @register="registerUploadModal" @success="handleSelected" />
  </BasicModal>
</template>
<script lang="ts" setup name="ImageSelect">
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useModal } from '/@/components/Modal';
  import { ref, reactive } from 'vue';
  import { Checkbox, Input, Button, Space } from 'ant-design-vue';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { imageList } from '/@/api/tb/images';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';
  import ImageUpload from './upload.vue';

  const emit = defineEmits(['register', 'selected']);

  const [registerModal, { closeModal, setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: true });

    setModalProps({ loading: false });
  });

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();

  const searchParam = reactive({
    textSearch: '',
    includeSystemImages: false,
  });

  const tableColumns: BasicColumn[] = [
    {
      title: t('名称'),
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      align: 'left',
      fixed: 'left',
      slot: 'firstColumn',
    },
    {
      title: '系统',
      dataIndex: 'link',
      key: 'link',
      ifShow: hasPermission(Authority.TENANT_ADMIN),
      width: 80,
      align: 'center',
      slot: 'isSystem',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 100,
    actions: (record: Recordable) => [
      {
        label: t('选择'),
        type: 'primary',
        onClick: handleSelected.bind(this, { ...record }),
      },
    ],
  };

  const [registerUploadModal, { openModal: openUploadModal }] = useModal();

  const [registerTable, { reload }] = useTable({
    rowKey: (record) => record.id.id,
    api: (param) => imageList(param, searchParam.includeSystemImages),
    beforeFetch: wrapFetchParams,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
  });

  function wrapFetchParams(param: any) {
    return {
      ...param,
      imageSubType: 'IMAGE',
      textSearch: searchParam.textSearch,
    };
  }

  function handleUpload(record: Recordable) {
    openUploadModal(true, record);
  }
  function handleSelected(record: Recordable) {
    emit('selected', record);
    closeModal();
  }
</script>
