<script setup lang="ts">
import { ref } from 'vue';

import { Col, Flex, Row } from 'antdv-next';

import DeviceMap from '../components/device-map.vue';
import EntitySummary from '../components/entity-summary.vue';
import QuickLinks from '../components/quick-links.vue';

const mapRevision = ref(0);
</script>

<template>
  <Row class="customer-home h-full min-h-0" :gutter="12" :wrap="false">
    <Col flex="1 1 0" class="min-h-0">
      <DeviceMap :key="mapRevision" @retry="mapRevision++" />
    </Col>
    <Col :xs="{ flex: '320px' }" :xxl="{ flex: '28%' }" class="min-h-0">
      <Flex class="h-full min-h-0" vertical :gap="12">
        <EntitySummary kind="device" />
        <EntitySummary kind="alarm" />
        <QuickLinks class="min-h-0 flex-1" />
      </Flex>
    </Col>
  </Row>
</template>
