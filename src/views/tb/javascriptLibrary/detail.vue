<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold"> {{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.javascriptLibrary.detail.title') }}</span>
        </div>
      </div>
    </template>
    <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
      <TabPane key="DETAIL">
        <template #tab>
          <span> <Icon :icon="'ant-design:appstore-outlined'" /> {{ t('tb.javascriptLibrary.detail.tab') }} </span>
        </template>
        <div class="space-x-4">
          <a-button type="primary" @click="handleDownload">
            <Icon :icon="'ant-design:download-outlined'" />{{ t('tb.javascriptLibrary.action.download') }}
          </a-button>
          <a-button type="primary" danger @click="handleDelete">
            <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.javascriptLibrary.action.delete') }}
          </a-button>
        </div>
        <div class="space-x-4 my-4">
          <a-button @click="handleCopyResourceId">
            <Icon :icon="'ant-design:copy-filled'" />
            {{ t('tb.javascriptLibrary.action.copyId') }}
          </a-button>
        </div>
        <Description @register="register" size="default" />
      </TabPane>
    </Tabs>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbJavascriptLibraryDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Resource, getResourceInfoById } from '/@/api/tb/resourceLibrary';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { JAVASCRIPT_TYPE_OPTIONS } from '/@/enums/resourceTypeEnum';

  const emit = defineEmits(['delete', 'download', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<Resource>({} as Resource);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
  }));

  const tabActiveKey = ref('DETAIL');

  const descSchema: DescItem[] = [
    {
      label: t('tb.javascriptLibrary.table.resourceSubType'),
      field: 'resourceSubType',
      render: (val) => (val ? JAVASCRIPT_TYPE_OPTIONS.find((item) => item.value === val)?.label || val : ''),
      span: 4,
    },
    {
      label: t('tb.javascriptLibrary.detail.title'),
      field: 'title',
      span: 4,
    },

    {
      label: t('tb.javascriptLibrary.detail.fileName'),
      field: 'fileName',
      span: 4,
    },
  ];
  const [register, { setDescProps }] = useDescription({
    schema: descSchema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getResourceInfoById(data.id.id);
      setDescProps({ data: record.value });
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  async function clear() {
    record.value = {} as Resource;
    setDescProps({ data: {} });
  }

  function handleCopyResourceId() {
    copyToClipboard(record.value.id.id, t('tb.javascriptLibrary.action.copyIdSuccess'));
  }

  function handleDelete() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleDownload() {
    emit('download', record.value);
    closeDrawer();
  }
</script>
