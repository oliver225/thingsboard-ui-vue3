<template>
  <div>
    <Row :gutter="16">
      <Col span="24">
        <Row :gutter="[16, 16]">
          <Col span="6">
            <DeviceCountCard />
          </Col>
          <Col span="6">
            <AlertCountCard />
          </Col>
          <Col span="6">
            <EntityCountCard />
          </Col>
          <Col span="6">
            <CustomerCountCard />
          </Col>
          <Col span="24">
            <GeoMap :height="mapHeight + 'px'" :center="mapCity" />
          </Col>
          <Col span="24">
            <Card :tab-list="tabListTitle" :active-tab-key="activeKey" @tabChange="onTabChange">
              <p v-if="activeKey === 'tab1'">
                <ActiveDeviceCountLine />
              </p>
              <p v-if="activeKey === 'tab2'">
                <MessageTransportBar />
              </p>
              <p v-if="activeKey === 'tab3'">
                <StorageDataPointsBar />
              </p>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  </div>
</template>
<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { Card, Row, Col } from 'ant-design-vue';
  import AlertCountCard from '../components/AlertCountCard.vue';
  import DeviceCountCard from '../components/DeviceCountCard.vue';
  import EntityCountCard from '../components/EntityCountCard.vue';
  import CustomerCountCard from '../components/CustomerCountCard.vue';
  import ActiveDeviceCountLine from '../components/chart/ActiveDeviceCountLine.vue';
  import MessageTransportBar from '../components/chart/MessageTransportBar.vue';
  import StorageDataPointsBar from '../components/chart/StorageDataPointsBar.vue';
  import GeoMap from '../components/chart/GeoMap.vue';
  import { getViewportOffset } from '/@/utils/domUtils';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  import { useUserStore } from '/@/store/modules/user';
  import { tenantInfoById } from '/@/api/tb/tenant';
  import { areaList } from '@vant/area-data';

  const userStore = useUserStore();

  const activeKey = ref('tab1');

  const mapHeight = ref(500);

  const mapCity = ref('潍坊市');

  const tabListTitle = [
    {
      key: 'tab1',
      tab: '在线设备数量',
    },
    {
      key: 'tab2',
      tab: '信息传输',
    },
    {
      key: 'tab3',
      tab: '实时数据存储点数',
    },
  ];

  function onTabChange(key) {
    activeKey.value = key;
  }
  onMounted(async () => {
    const tenantInfo = await tenantInfoById(userStore.getUserInfo.tenantId.id);
    mapCity.value = areaList.city_list[tenantInfo.city || '370700'];
  });
  getMapHeight();

  useWindowSizeFn(getMapHeight, 500);

  function getMapHeight() {
    const height = getViewportOffset(document.body).bottomIncludeBody;
    mapHeight.value = height - 340;
  }
</script>
