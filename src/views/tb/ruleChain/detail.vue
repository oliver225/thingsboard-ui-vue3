<template>
  <PageWrapper>
    <ScrollContainer>
      {{ record.name }}
    </ScrollContainer>
  </PageWrapper>
</template>

<script lang="ts" setup name="ViewsTbRuleChainDetail">
  import { PageWrapper } from '/@/components/Page';
  import { ScrollContainer } from '/@/components/Container/index';
  import { RuleChain, getRuleChainById } from '/@/api/tb/ruleChain';
  import { router } from '/@/router';
  import { isEmpty } from 'lodash-es';
  import { ref, watch } from 'vue';

  const record = ref<RuleChain>({} as RuleChain);

  async function fetchData() {
    const ruleChainId = router.currentRoute.value.params.ruleChainId as string;
    if (isEmpty(ruleChainId)) {
      return Promise.reject(new Error('规则链为空！'));
    }
    record.value = await getRuleChainById(ruleChainId);
  }

  watch(
    () => router.currentRoute.value.params.ruleChainId,
    async () => {
      fetchData();
    },
    { immediate: true },
  );
</script>
