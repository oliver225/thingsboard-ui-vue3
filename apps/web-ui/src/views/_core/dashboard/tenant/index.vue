<script setup lang="ts">
import { Col, Flex, Row } from 'antdv-next';

import ActivityCard from '../components/activity-card.vue';
import DashboardCard from '../components/dashboard-card.vue';
import EntitySummary from '../components/entity-summary.vue';
import GetStarted from '../components/get-started.vue';
import QuickLinks from '../components/quick-links.vue';
import UsageCard from '../components/usage-card.vue';
</script>

<template>
  <Flex class="tenant-home h-full min-h-0 w-full" align="stretch" :gap="12">
    <Flex class="tenant-main min-h-0 min-w-0" flex="1 1 0" vertical :gap="12">
      <Row :gutter="12" :wrap="false" class="shrink-0">
        <Col :span="12"><EntitySummary kind="device" /></Col>
        <Col :span="12"><EntitySummary kind="alarm" /></Col>
      </Row>
      <Row
        class="tenant-overview max-h-[360px] min-h-0 flex-1"
        :gutter="12"
        :wrap="false"
      >
        <Col :span="9" class="min-h-0">
          <DashboardCard class="h-full min-h-0" />
        </Col>
        <Col :span="9" class="min-h-0"><UsageCard /></Col>
        <Col :span="6" class="min-h-0">
          <QuickLinks class="h-full" />
        </Col>
      </Row>
      <ActivityCard class="tenant-activity min-h-0 flex-[0.75_1_0]" />
    </Flex>
    <GetStarted
      class="min-w-[250px] flex-[0_0_27%] max-[1200px]:min-w-[240px] max-[1200px]:basis-[240px]"
    />
  </Flex>
</template>
