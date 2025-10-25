<template>
  <div :class="prefixCls" :style="getWrapStyle">
    <Spin :spinning="loading" size="large" :style="getWrapStyle">
      <div class="overflow-hidden h-full" :style="getWrapStyle">
        <iframe :src="frameSrc" ref="frameRef" @load="hideLoading"></iframe>
      </div>
    </Spin>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbDashboardEditor',
  });
</script>
<script lang="ts" setup>
  import { computed, CSSProperties, defineComponent, ref, unref, watch } from 'vue';
  import { router } from '/@/router';
  import { Spin } from 'ant-design-vue';
  import { useTabs } from '/@/hooks/web/useTabs';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  import { Dashboard, getDashboardById } from '/@/api/tb/dashboard';
  import { useLayoutHeight } from '/@/layouts/default/content/useContentViewHeight';
  import { useGlobSetting } from '/@/hooks/setting';

  const props = defineProps({
    offsetX: { type: Number, default: -254 },
    offsetY: { type: Number, default: -70 },
    fullHeight: { type: Boolean, default: false },
  });

  const padding = 13;

  const loading = ref(true);
  const topRef = ref(50);
  const heightRef = ref(window.innerHeight);
  const frameRef = ref<HTMLFrameElement>();

  const dashboardId = ref<string>(router.currentRoute.value.params.dashboardId as string);
  const record = ref<Dashboard>({} as Dashboard);

  const { setTitle } = useTabs();
  const { t } = useI18n('tb');
  const { headerHeightRef } = useLayoutHeight();
  const { prefixCls } = useDesign('iframe-page');

  // 使用环境变量配置ThingsBoard基础地址
  const frameSrc = computed(() => {
    const { tbBaseUrl } = useGlobSetting();
    return `${tbBaseUrl}/dashboards/${dashboardId.value}`;
  });

  useWindowSizeFn(calcHeight, 150, { immediate: true });

  watch(
    () => router.currentRoute.value.params.dashboardId,
    async (newVal) => {
      if (!newVal) {
        return;
      }
      dashboardId.value = newVal as string;
      await getDashboard();
    },
    { immediate: true },
  );

  const getWrapStyle = computed((): CSSProperties => {
    return {
      height: `${unref(heightRef) - padding}px`,
    };
  });

  function calcHeight() {
    const iframe = unref(frameRef);
    if (!iframe) {
      return;
    }

    const offsetX = props.offsetX || 0;
    const offsetY = props.offsetY || 0;
    iframe.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    if (offsetX != 0) {
      iframe.style.width = `calc(100% + ${-offsetX}px)`;
    }
    if (props.fullHeight) {
      const clientHeight = document.documentElement.clientHeight - 6;
      iframe.style.height = `${clientHeight - offsetY}px`;
      return;
    }
    const top = headerHeightRef.value + padding;
    topRef.value = top;
    heightRef.value = window.innerHeight - top;
    const clientHeight = document.documentElement.clientHeight - top;
    iframe.style.height = `${clientHeight - padding - offsetY}px`;
  }

  async function getDashboard() {
    const res = await getDashboardById(dashboardId.value);
    record.value = (res || {}) as Dashboard;
    setTitle(record.value.title || t('tb.dashboard.title'));
  }

  function hideLoading() {
    loading.value = false;
    calcHeight();
  }
</script>
