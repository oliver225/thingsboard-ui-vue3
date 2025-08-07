<template>
  <Card title="仪表板" class="dashboard-card" :bodyStyle="{ padding: '12px 24px 12px 24px' }">
    <BasicTable
      :columns="columns"
      size="small"
      :striped="false"
      :bordered="false"
      :showIndexColumn="false"
      :pagination="false"
      :dataSource="data?.last"
    >
      <template #starred="{ record }">
        <Icon :icon="'ant-design:star-filled'" size="24" color="#fadb14" v-if="record.starred == true" />
        <Icon :icon="'ant-design:star-outlined'" size="24" color="#fadb14" v-else />
      </template>
      <template #lastVisited="{ record }">
        {{ dayjs(record.lastVisited).fromNow(false) }}
      </template>
    </BasicTable>
  </Card>
</template>
<script lang="ts" setup>
  import { Card } from 'ant-design-vue';
  import { onMounted, ref } from 'vue';
  import { BasicTable, BasicColumn } from '/@/components/Table';
  import { Icon } from '/@/components/Icon';
  import { UserDashboard, userDashboardList } from '/@/api/tb/dashboard';
  import dayjs from 'dayjs';
  import RelativeTime from 'dayjs/plugin/relativeTime';

  dayjs.locale('zh-cn');
  dayjs.extend(RelativeTime);
  const data = ref<UserDashboard>();

  const columns: BasicColumn[] = [
    {
      dataIndex: 'starred',
      key: 'starred',
      align: 'center',
      slot: 'starred',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title',
      align: 'left',
    },
    {
      title: '最后访问',
      dataIndex: 'lastVisited',
      width: 200,
      align: 'left',
      slot: 'lastVisited',
    },
  ];

  onMounted(async () => {
    await fetchDashboard();
  });

  async function fetchDashboard() {
    data.value = await userDashboardList();
  }
</script>
