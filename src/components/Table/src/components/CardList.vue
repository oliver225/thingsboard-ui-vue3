<template>
  <div class="bg-white p-2">
    <List
      :grid="{ gutter: 1, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 6 }"
      :data-source="props.dataSource"
      :loading="props.loading"
      :bordered="false"
      :pagination="paginationProp"
    >
      <template #renderItem="{ item }">
        <ListItem>
          <Card>
            <template #title></template>
            <template #cover>
              <div :class="height">
                <Image :src="item[imageFiled]" />
              </div>
            </template>
            <template #actions>
              <EditOutlined />
              <Dropdown
                :trigger="['hover']"
                :dropMenuList="[
                  {
                    text: '删除',
                    event: '1',
                    popConfirm: {
                      title: '是否确认删除',
                      confirm: handleDelete.bind(null, item.id),
                    },
                  },
                ]"
                popconfirm
              >
                <EllipsisOutlined />
              </Dropdown>
            </template>
          </Card>
        </ListItem>
      </template>
    </List>
  </div>
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { EditOutlined, EllipsisOutlined } from '@ant-design/icons-vue';
  import { List, Card, Image, Typography } from 'ant-design-vue';
  import { Dropdown } from '/@/components/Dropdown';
  import { useTableContext } from '../hooks/useTableContext';
  import { watch } from 'vue';
  import { basicProps } from '../props';

  const table = useTableContext();

  const ListItem = List.Item;
  // 组件接收参数
  const props = defineProps(basicProps);

  //暴露内部方法
  const emit = defineEmits(['getMethod', 'delete']);

  //数据
  const data = ref<Array<Recordable>>([]);

  // 切换每行个数
  // cover图片自适应高度
  //修改pageSize并重新请求数据

  const height = computed(() => {
    return `h-${120 - 12 * 6}`;
  });

  watch(
    () => props.dataSource,
    (newVal) => {
      data.value = newVal;
    },
  );

  watch(
    () => props.pagination,
    (newVal) => {
      paginationProp.value = {
        ...props.pagination,
        onChange: pageChange,
        onShowSizeChange: pageSizeChange,
      };
    },
  );

  // async function fetch(p = {}) {
  //   const { api, params, dataSource } = props;
  //   if (dataSource) {

  //     return;
  //   }
  //   if (api && isFunction(api)) {
  //     const res = await api({ ...params, page: page.value, pageSize: pageSize.value, ...p });
  //     data.value = res.items;
  //     total.value = res.total;
  //   }
  // }
  //分页相关
  const page = ref(1);
  const pageSize = ref(36);
  const total = ref(0);
  const paginationProp = ref({
    ...props.pagination,
    onChange: pageChange,
    onShowSizeChange: pageSizeChange,
  });

  function pageChange(p: number, pz: number) {
    table.setPagination({ current: p, pageSize: pz });
    table.reload();
  }
  function pageSizeChange(_current, size: number) {
    table.setPagination({ pageSize: size });
    table.reload();
  }

  async function handleDelete(id: number) {
    emit('delete', id);
  }
</script>
