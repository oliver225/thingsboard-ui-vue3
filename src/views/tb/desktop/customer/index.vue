<template>
  <div>
    <Row :gutter="16">
      <Col span="18">
        <GeoMap :height="mapHeight + 'px'" :center="mapCity" />
      </Col>
      <Col span="6">
        <Row :gutter="[16, 16]">
          <Col span="24">
            <AlertCountCard />
          </Col>
          <Col span="24">
            <DeviceCountCard />
          </Col>
          <Col span="24">
            <EntityCountCard />
          </Col>
          <Col span="24">
            <GetStarted />
          </Col>
        </Row>
      </Col>
    </Row>
  </div>
</template>
<script lang="ts" setup>
  import { Row, Col } from 'ant-design-vue';
  import AlertCountCard from '../components/AlertCountCard.vue';
  import DeviceCountCard from '../components/DeviceCountCard.vue';
  import EntityCountCard from '../components/EntityCountCard.vue';
  import GeoMap from '../components/chart/GeoMap.vue';
  import { getViewportOffset } from '/@/utils/domUtils';
  import { onMounted, ref } from 'vue';
  import { useUserStore } from '/@/store/modules/user';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  import { getCustomerById } from '/@/api/tb/customer';
  import { areaList } from '@vant/area-data';

  const mapHeight = ref(500);

  const userStore = useUserStore();

  const mapCity = ref('诸城市');

  onMounted(async () => {
    const customer = await getCustomerById(userStore.getUserInfo.customerId.id);
    mapCity.value = areaList.county_list[customer.country || '370782'];
  });
  getMapHeight();

  useWindowSizeFn(getMapHeight, 500);

  function getMapHeight() {
    const height = getViewportOffset(document.body).bottomIncludeBody;
    mapHeight.value = height - 70;
  }
</script>
