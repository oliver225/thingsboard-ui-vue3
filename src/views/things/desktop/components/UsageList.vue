<template>
  <Card title="Api统计" class="usage-card" :bodyStyle="{ padding: '0 24px 12px 24px' }">
    <template #extra>
      <Pagination v-model:current="current" v-model:pageSize="pageSize" :total="data.length" size="small" />
    </template>
    <List size="small" item-layout="horizontal">
      <template v-for="item in getData" :key="item.title">
        <List.Item>
          <List.Item.Meta>
            <template #title>
              {{ item.title }}
            </template>
          </List.Item.Meta>
          <div class="md:w-1/2 w-ful flex">
            <span class="md:w-1/3 w-ful mr-4"> {{ item.label }} </span>
            <Progress class="md:w-2/3 w-ful" :percent="item.percent" :size="[100, 15]" :show-info="false">
            </Progress>
          </div>

        </List.Item>
      </template>
    </List>
  </Card>
</template>
<script lang="ts" setup>
import { List, Card, Progress, Pagination } from 'ant-design-vue';
import { computed, onMounted, ref, unref } from 'vue';
import { getUsage } from '/@/api/things/usage';
import { isNumber } from '/@/utils/is';

const data = ref<Array<any>>([]);

const current = ref(1);
const pageSize = 5;

const getData = computed(() => {
  let size = isNumber(pageSize) ? pageSize : 5;
  return data.value.slice(size * (unref(current) - 1), size * unref(current));
});




onMounted(async () => {
  await fetchUsage();
})

async function fetchUsage() {
  const result = await getUsage();
  data.value = [
    {
      title: '设备',
      percent: result.devices / result.maxDevices == 0 ? Number.MAX_VALUE : result.maxDevices,
      label: `${result.devices} / ${result.maxDevices == 0 ? ' ∞' : result.maxDevices}`
    },
    {
      title: '资产',
      percent: result.assets / result.maxAssets == 0 ? Number.MAX_VALUE : result.maxAssets,
      label: `${result.assets} / ${result.maxAssets == 0 ? ' ∞' : result.maxAssets}`
    },
    {
      title: '仪表盘',
      percent: result.dashboards / result.maxDashboards == 0 ? Number.MAX_VALUE : result.maxDashboards,
      label: `${result.dashboards} / ${result.maxDashboards == 0 ? ' ∞' : result.maxDashboards}`
    },
    {
      title: '客户',
      percent: result.customers / result.maxCustomers == 0 ? Number.MAX_VALUE : result.maxCustomers,
      label: `${result.customers} / ${result.maxCustomers == 0 ? ' ∞' : result.maxCustomers}`
    },
    {
      title: '用户',
      percent: result.users / result.maxUsers == 0 ? Number.MAX_VALUE : result.maxUsers,
      label: `${result.users} / ${result.maxUsers == 0 ? ' ∞' : result.maxUsers}`
    },
    {
      title: '传输消息',
      percent: result.transportMessages / result.maxTransportMessages == 0 ? Number.MAX_VALUE : result.maxTransportMessages,
      label: `${Number(result.transportMessages / 1000000).toFixed(1) + 'M'} / ${result.maxTransportMessages == 0 ? ' ∞' : result.maxTransportMessages}`
    },
    {
      title: 'JavaScript',
      percent: result.jsExecutions / result.maxJsExecutions == 0 ? Number.MAX_VALUE : result.maxJsExecutions,
      label: `${result.jsExecutions} / ${result.maxJsExecutions == 0 ? ' ∞' : result.maxJsExecutions}`
    },
    {
      title: '创建报警',
      percent: result.alarms / result.maxAlarms == 0 ? Number.MAX_VALUE : result.maxAlarms,
      label: `${result.alarms} / ${result.maxAlarms == 0 ? ' ∞' : result.maxAlarms}`
    },
    {
      title: '邮件',
      percent: result.emails / result.maxEmails == 0 ? Number.MAX_VALUE : result.maxEmails,
      label: `${result.emails} / ${result.maxEmails == 0 ? ' ∞' : result.maxEmails}`
    },
    {
      title: '短信',
      percent: result.sms / result.maxSms == 0 ? Number.MAX_VALUE : result.maxSms,
      label: `${result.sms} / ${result.maxSms == 0 ? ' ∞' : result.maxSms}`
    },
  ]


}
</script>
<style lang="less">
.usage-card {
 
}
</style>