<template>
  <Card title="快速开始" :bodyStyle="{ paddingTop: 0 }">
    <Timeline>
      <Timeline.Item>
        <template #dot>
          <Icon :icon="'ant-design:database-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">创建设备</Typography.Title>
        <Typography.Text>
          Let's provision your first device to the platform via UI.
          <br />
          Follow the documentation on how to do it.
        </Typography.Text>
      </Timeline.Item>
      <Timeline.Item color="green">
        <template #dot>
          <Icon :icon="'ant-design:api-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">连接设备</Typography.Title>
        <Typography.Text>
          To connect the device you need to get the device credentials. <br />
          We recommend using default auto-generated credentials which is access token for this guide. <br />
          <ul>
            <li> Go to device table</li>
            <li> Click on the device row to open device details</li>
            <li> Press the button "Copy access token"</li>
          </ul>
          Use simple commands to publish data over HTTP. <br />
          Don't forget to replace $ACCESS_TOKEN with your device access token.
        </Typography.Text>
      </Timeline.Item>
      <Timeline.Item color="purple">
        <template #dot>
          <Icon :icon="'ant-design:dashboard-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">创建仪表盘</Typography.Title>
        <Typography.Text>
          Create a dashboard to visualize data from entities such as assets, devices, etc. <br />
          Follow the documentation on how to do it:
        </Typography.Text>
      </Timeline.Item>
      <Timeline.Item>
        <template #dot>
          <Icon :icon="'ant-design:project-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">配置报警规则</Typography.Title>
        <Typography.Text>
          Let's raise an alarm when the temperature reaches 25°C. <br />
          Follow the documentation on how to do it:
        </Typography.Text>
      </Timeline.Item>
      <Timeline.Item color="red">
        <template #dot>
          <Icon :icon="'ant-design:alert-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">创建报警</Typography.Title>
        <Typography.Text>
          To trigger the alarm, send a new telemetry value of 26°C or higher. <br />
          Replace $ACCESS_TOKEN with your device's token:
        </Typography.Text>
      </Timeline.Item>
      <Timeline.Item>
        <template #dot>
          <Icon :icon="'ant-design:team-outlined'" :size="24" />
        </template>
        <Typography.Title :level="5">创建客户分配仪表盘</Typography.Title>
        <Typography.Text>
          To trigger the alarm, send a new telemetry value of 26°C or higher. <br />
          Replace $ACCESS_TOKEN with your device's token:
        </Typography.Text>
      </Timeline.Item>
    </Timeline>
  </Card>
</template>
<script lang="ts" setup>
  import { Card, Typography, Timeline } from 'ant-design-vue';

  import { Icon } from '/@/components/Icon';
</script>
