<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">部件包详情</span>
        </div>
      </div>
    </template>
    <div v-show="tabActiveKey == 'DETAIL'">
      <div class="space-x-4">
        <a-button type="primary" @click="handleOpen">
          <Icon :icon="'ant-design:folder-open-outlined'" />打开部件包
        </a-button>
        <a-button type="primary" @click="handleDownload">
          <Icon :icon="'ant-design:download-outlined'" />导出部件包
        </a-button>
        <a-button type="primary success" @click="handleEdit">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑部件包
        </a-button>
        <a-button type="primary" danger @click="handleDelete">
          <Icon :icon="'ant-design:delete-outlined'" />租删部件包
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyWidgetsBundleId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制部件包ID
        </a-button>
      </div>
      <Description @register="register" size="default" />
    </div>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbWidgetsBundleDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { WidgetsBundle, getWidgetsBundleById } from '/@/api/tb/widgetsBundle';
  import { DescItem, Description, useDescription } from '/@/components/Description';

  const emit = defineEmits(['edit', 'delete', 'download', 'open', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<WidgetsBundle>({} as WidgetsBundle);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
  }));

  const tabActiveKey = ref('DETAIL');

  const descSchema: DescItem[] = [
    {
      label: t('标题'),
      field: 'title',
      span: 4,
    },
    {
      label: t('描述信息'),
      field: 'description',
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
      record.value = await getWidgetsBundleById(data.id.id);
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
    record.value = {} as WidgetsBundle;
    setDescProps({ data: {} });
  }

  function handleCopyWidgetsBundleId() {
    copyToClipboard(record.value.id.id, '复制部件包ID成功！');
  }

  function handleDelete() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEdit() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleDownload() {
    emit('download', record.value);
    closeDrawer();
  }
  function handleOpen() {
    emit('open', record.value);
  }
</script>
