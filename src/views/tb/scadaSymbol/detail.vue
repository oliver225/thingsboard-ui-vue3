<template>
  <PageWrapper>
    <Spin :spinning="dataLoading">
      <div class="scada-symbol-detail">
        <Row>
          <Col :span="12">
            <div class="scada-svg-container">
              <div class="scada-svg-shape" :style="{ height: svgHeight + 'px' }"> </div>
            </div>
          </Col>
          <Col :span="12">
            <div class="scada-svg-info"> </div>
          </Col>
        </Row>
      </div>
    </Spin>
  </PageWrapper>
</template>
<script lang="ts" setup name="ViewsTbScadaSymbolDetail">
  import { ref, onMounted } from 'vue';
  import { PageWrapper } from '/@/components/Page';
  import { SVG, Svg } from '@svgdotjs/svg.js';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { Row, Col, Spin } from 'ant-design-vue';
  import { getImageInfo, getSvg } from '/@/api/tb/images';
  import { router } from '/@/router';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  const dataLoading = ref(false);
  const imageInfo = ref<ResourceInfo>({} as ResourceInfo);
  const svgText = ref('');
  const svgRef = ref<Svg | null>(null);

  const svgHeight = ref(500);

  async function fetch() {
    try {
      dataLoading.value = true;
      const type = router.currentRoute.value.params.type as string;
      const key = router.currentRoute.value.params.key as string;
      if (type == undefined || key == undefined) {
        return;
      }
      imageInfo.value = await getImageInfo(type, key);
      svgText.value = await getSvg(type, key);
    } catch (e) {
    } finally {
      dataLoading.value = false;
    }
  }

  onMounted(async () => {
    clear();
    await fetch();
    renderSvg();
  });

  function renderSvg() {
    svgRef.value = SVG().addTo('.scada-svg-shape').size('100%', '100%');
    svgRef.value.svg(svgText.value);
  }

  function clear() {
    imageInfo.value = {} as ResourceInfo;
    svgText.value = '';
    const dom = document.querySelector('.scada-svg-shape');
    if (dom) {
      dom.innerHTML = '';
    }
    svgRef.value = null;
  }

  useWindowSizeFn(computerHeight, 280, { immediate: true });

  function computerHeight() {
    svgHeight.value = document.body.clientHeight - 150;
  }
</script>
<style lang="less">
  .scada-symbol-detail {
    .scada-svg-container {
      border-right: 1px solid red;
    }
    .scada-svg-info {
    }
  }
</style>
