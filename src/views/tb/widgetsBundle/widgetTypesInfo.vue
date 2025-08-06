<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="50%" style="z-index: 99">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}({{ widgetTypeList.length }})</span>
          <span class="text-sm">部件列表</span>
        </div>
      </div>
    </template>
    <List item-layout="horizontal" :data-source="widgetTypeList">
      <template #renderItem="{ item }">
        <List.Item>
          <List.Item.Meta>
            <template #title>
              {{ item.name }}
            </template>
            <template #description>
              <div class="w-2/3 h-10 truncate">
                {{ item.description }}
              </div>
            </template>
            <template #avatar>
              <img :src="item.base64" width="100" />
            </template>
          </List.Item.Meta>
        </List.Item>
      </template>
    </List>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbWidgetTypeInfoList">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { WidgetsBundle, getWidgetsBundleById } from '/@/api/tb/widgetsBundle';
  import { WidgetType, getBundleWidgetTypesInfos } from '/@/api/tb/widgetType';
  import { List, Avatar } from 'ant-design-vue';
  import { imagePreview } from '/@/api/tb/images';

  const emit = defineEmits(['register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<WidgetsBundle>({} as WidgetsBundle);
  const widgetTypeList = ref<WidgetType[]>([]);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
  }));

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      widgetTypeList.value = [];
      record.value = await getWidgetsBundleById(data.id.id);
      const widgetTypeInfos = await getBundleWidgetTypesInfos({
        page: 0,
        pageSize: 1024,
        widgetsBundleId: data.id.id,
        fullSearch: false,
        deprecatedFilter: 'ALL',
      });
      widgetTypeList.value = widgetTypeInfos.data;
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
      for (let i = 0; i < widgetTypeList.value.length; i++) {
        widgetTypeList.value[i].base64 = await fetchPreviewImage(widgetTypeList.value[i]);
      }
    }
  });

  async function fetchPreviewImage(record: Recordable) {
    return new Promise((resolve) => {
      imagePreview(record.image.replace('tb-image;', '')).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }
</script>
