<template>
  <div>
    <List :class="prefixCls" size="small" bordered :pagination="getPagination">
      <template v-for="item in getData" :key="item.id.id">
        <List.Item class="list-item">
          <List.Item.Meta>
            <template #title>
              <div class="w-full title" @click="handleTitleClick(item)">
                <span v-html="item.subject"></span>
                <span class="datetime">
                  {{ dayjs(item.createdTime).fromNow() }}
                </span>
              </div>
            </template>
            <template #avatar>
              <Icon
                v-if="item.additionalConfig?.icon?.enabled == true"
                :icon="item.additionalConfig?.icon?.icon"
                :color="item.additionalConfig?.icon?.color"
                :size="26"
              />
              <Icon v-else :icon="'ant-design:info-circle-filled'" :color="'blue'" :size="26" />
            </template>
            <template #description>
              <div>
                <div class="description" v-if="item.text">
                  <Typography.Paragraph
                    style="width: 100%; margin-bottom: 0 !important"
                    :ellipsis="
                      $props.descRows && $props.descRows > 0 ? { rows: $props.descRows, tooltip: !!item.text } : false
                    "
                    :content="item.text"
                  />
                </div>
                <div class="btns">
                  <a-button
                    type="primary"
                    size="small"
                    v-if="item.additionalConfig?.actionButtonConfig?.enabled == true"
                    @click="handleBtnClick(item)"
                  >
                    {{ item.additionalConfig?.actionButtonConfig?.text }}
                  </a-button>
                  <a-button type="primary" size="small" v-else @click="handleBtnClick(item)"> 知道了 </a-button>
                </div>
              </div>
            </template>
          </List.Item.Meta>
        </List.Item>
      </template>
    </List>
    <div style="display: flex; flex-direction: row-reverse">
      <a-button type="link" @click="handleToNotificationList">查看全部</a-button>
      <a-button type="link" @click="handleMarkAllAsRead" v-if="list.length > 0">全部已读</a-button>
    </div>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'HeaderNotificationList',
  });
</script>
<script lang="ts" setup>
  import { computed, defineComponent, ref, unref, watch } from 'vue';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { Notification } from '/@/api/tb/notification';
  import { Icon } from '/@/components/Icon';
  import { List, Typography } from 'ant-design-vue';
  import { isNumber } from '/@/utils/is';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import { router } from '/@/router';

  const props = defineProps({
    list: {
      type: Array as PropType<Notification[]>,
      default: () => [],
    },
    pageSize: {
      type: [Boolean, Number] as PropType<Boolean | Number>,
      default: 5,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    titleRows: {
      type: Number,
      default: 1,
    },
    descRows: {
      type: Number,
      default: 2,
    },
    onTitleClick: {
      type: Function as PropType<(Recordable) => void>,
    },
    markAllAsRead: {
      type: Function as PropType<() => void>,
    },
  });
  dayjs.locale('zh-cn');
  dayjs.extend(relativeTime);

  const emit = defineEmits(['update:currentPage']);

  const { prefixCls } = useDesign('header-notify-list');

  const current = ref(props.currentPage || 1);

  const getData = computed(() => {
    const { pageSize, list } = props;
    if (pageSize === false) return [];
    let size = isNumber(pageSize) ? pageSize : 5;
    return list.slice(size * (unref(current) - 1), size * unref(current));
  });

  watch(
    () => props.currentPage,
    (v) => {
      current.value = v;
    },
  );

  const getPagination = computed(() => {
    const { list, pageSize } = props;
    if (pageSize > 0 && list && list.length > pageSize) {
      return {
        total: list.length,
        pageSize,
        size: 'small',
        current: unref(current),
        onChange(page) {
          current.value = page;
          emit('update:currentPage', page);
        },
      };
    } else {
      return false;
    }
  });

  function handleTitleClick(item: Notification) {
    props.onTitleClick && props.onTitleClick(item);
  }

  function handleBtnClick(item: Notification) {
    if (
      item.additionalConfig?.actionButtonConfig?.linkType == 'LINK' &&
      item.additionalConfig.actionButtonConfig.link
    ) {
      if (item.additionalConfig.actionButtonConfig.link.startsWith('http')) {
        window.open(item.additionalConfig.actionButtonConfig.link, '_blank');
      } else {
        router.push(item.additionalConfig.actionButtonConfig.link);
      }
    }
  }

  function handleToNotificationList() {
    router.push('/notification/index');
  }

  function handleMarkAllAsRead() {
    props.markAllAsRead && props.markAllAsRead();
  }
</script>
<style lang="less">
  @prefix-cls: ~'jeesite-header-notify-list';

  .@{prefix-cls} {
    &::-webkit-scrollbar {
      display: none;
    }

    ::v-deep(.ant-pagination-disabled) {
      display: inline-block !important;
    }

    .list-item {
      padding: 1px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;

      .title {
        margin-bottom: 4px;
      }

      .ant-list-item-meta-avatar {
        margin-top: 8px;
      }

      .description {
        font-size: 12px;
        line-height: 18px;
      }

      .btns {
        margin-top: 8px;
        display: flex;
        flex-direction: row-reverse;
      }

      .datetime {
        float: right;
        font-size: 12px;
        font-weight: normal;
        color: rgba(0, 0, 0, 0.45);
      }
    }
  }

  .ant-list .ant-list-item .ant-list-item-meta .ant-list-item-meta-title {
    margin-top: 0;
  }
</style>
