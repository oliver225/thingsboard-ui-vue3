<template>
  <div class="table-card-list">
    <ScrollContainer
      ref="contentRef"
      :style="{ height: contentHeight + 'px' }"
      v-loading="props.loading"
    >
    <Row :gutter="[ showGrid.gutter, showGrid.gutter ]">
       <Col v-for="item in props.dataSource" :key="item.id.id" :xl="showGrid.xl" :lg="showGrid.lg" :md="showGrid.md" :sm="showGrid.sm" :xs="showGrid.sm" :span="8" >
          <slot name="itemContainer" :record="item"></slot>
        </Col>
    </Row>
    </ScrollContainer >
   <div class="flex flex-row-reverse mt-2">
     <Pagination v-bind="getPaginationInfo" :pageSizeOptions="getPageSizeOptions" />
   </div>
  </div>
  <!-- </ScrollContainer> -->
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref, unref } from 'vue';
  import {  Pagination, Row, Col  } from 'ant-design-vue';
  import { useTableContext } from '../hooks/useTableContext';
  import { basicProps } from '../props';
  import { ScrollContainer } from '/@/components/Container/index';
  import { useLayoutHeight } from '/@/layouts/default/content/useContentViewHeight';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  import { usePagination } from '../hooks/usePagination';
  import { BasicTableProps } from '../types/table';

  const table = useTableContext();
  //数据
  // 组件接收参数
  const props = defineProps(basicProps);

  const innerPropsRef = ref<Partial<BasicTableProps>>();

 const getProps = computed(() => {
    return { ...props, ...unref(innerPropsRef) } as BasicTableProps;
  });

  const contentRef = ref<ComponentRef>();
  const contentHeight = ref<number>(200);
  const { headerHeightRef } = useLayoutHeight();

  function calcContentHeight() {
    contentHeight.value =
        document.body.clientHeight - headerHeightRef.value  - 156;
  }

  useWindowSizeFn(
    () => {
      calcContentHeight();
    },
    50,
    { immediate: true },
  );


  const showGrid = computed(()=>{
    if(props.cardGrid){
      return props.cardGrid
    }
    return { gutter: 4, xs: 24, sm: 12, md: 8, lg: 6, xl: 4 }
  })

  const getPageSizeOptions = computed(()=>{
    return ['12','24','36','48']
  })


  const { getPaginationInfo, getPagination, setPagination, setShowPagination, getShowPagination } =
    usePagination(getProps);

</script>
<style lang="less">

  .table-card-list {
    background-color: @component-background;
    border-end-end-radius: 4px;
    border-end-start-radius: 4px;
    padding: 4px;
  }
</style>