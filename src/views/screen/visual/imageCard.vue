<template>
  <div class="visual-image-card">
    <Card hoverable style="width: 100%">
      <div class="visual-image-card-cover" @click="handlePreview">
        <img :alt="record.name" :src="record.image || defaultImage" />
        <div v-if="record.public" class="public">
          <span>公开</span>
        </div>
      </div>
      <div class="visual-image-card-info">
        <div class="title">
          {{ record.name }}
        </div>
        <div class="more-info">
          <span>
            <Tag color="success" v-if="record.published">已发布</Tag>
            <Tag color="warning" v-else>未发布</Tag>
          </span>
          <Tooltip :title="'编辑大屏'" v-if="hasPermission(Authority.TENANT_ADMIN)">
            <a-button size="small">
              <Icon
                icon="i-ant-design:edit-outlined"
                :size="16"
                color="green"
                @click="handleEdit"
              />
            </a-button>
          </Tooltip>
          <Dropdown placement="bottom" :trigger="['hover']">
            <a-button size="small">
              <Icon icon="i-ant-design:ellipsis-outlined" :size="16" />
            </a-button>
            <template #overlay>
              <Menu @click="handleMoreClick" selectable>
                <Menu.Item key="preview">
                  <Icon icon="i-ant-design:fund-outlined" :size="16" />
                  <span class="ml-2">预览大屏</span>
                </Menu.Item>
                <Menu.Item
                  key="publish"
                  v-if="hasPermission(Authority.TENANT_ADMIN) && !record.published"
                >
                  <Icon icon="i-ant-design:send-outlined" :size="16" />
                  <span class="ml-2">发布大屏</span>
                </Menu.Item>
                <Menu.Item
                  key="unpublish"
                  v-if="hasPermission(Authority.TENANT_ADMIN) && record.published"
                >
                  <Icon icon="i-ant-design:send-outlined" :size="16" />
                  <span class="ml-2">取消发布</span>
                </Menu.Item>
                <Menu.Item key="editinfo" v-if="hasPermission(Authority.TENANT_ADMIN)">
                  <Icon icon="i-ant-design:safety-outlined" :size="16" />
                  <span class="ml-2">修改信息</span>
                </Menu.Item>
                <Menu.Item key="delete" v-if="hasPermission(Authority.TENANT_ADMIN)">
                  <Icon icon="i-ant-design:delete-outlined" :size="16" color="red" />
                  <span class="ml-2">删除大屏</span>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </div>
    </Card>
  </div>
</template>
<script lang="ts" setup name="ViewsSereenVisualImageCard">
  import { ref, watch } from 'vue';
  import { TbVisualInfo } from '/@/api/screen/visual';
  import { Card, Tag, Tooltip, Dropdown, Menu } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { Authority } from '/@/enums/authorityEnum';

  const { hasPermission } = usePermission();

  const defaultImage = '/resource/img/no-data.svg';

  const props = defineProps({
    value: {
      required: true,
      type: Object as PropType<TbVisualInfo>,
    },
  });
  const record = ref<TbVisualInfo>({} as TbVisualInfo);

  const emit = defineEmits(['editinfo', 'edit', 'delete', 'preview', 'publish', 'unpublish']);

  watch(
    () => props.value,
    (v) => {
      record.value = props.value;
    },
    { immediate: true },
  );

  function handleDetailInfo() {
    emit('editinfo', record.value);
  }
  function handleEdit() {
    emit('edit', record.value);
  }

  function handleDelete() {
    emit('delete', record.value);
  }

  function handlePreview() {
    emit('preview', record.value);
  }

  function handlePublish() {
    emit('publish', record.value);
  }

  function handleUnPublish() {
    emit('unpublish', record.value);
  }

  function handleMoreClick({ key }: { key: string } | any) {
    if (key == 'editinfo') {
      handleDetailInfo();
    } else if (key == 'preview') {
      handlePreview();
    } else if (key == 'publish') {
      handlePublish();
    } else if (key == 'unpublish') {
      handleUnPublish();
    } else if (key == 'delete') {
      handleDelete();
    }
  }
</script>
<style lang="less">
  .visual-image-card {
    width: 100%;
    border: 1px solid fade(@primary-color, 55);
    border-radius: 8px;
    background-color: fade(@primary-color, 5) !important;
    .ant-card-body {
      padding: 2px !important;
      cursor: default;
    }
    .ant-card-actions {
      background-color: fade(@primary-color, 5) !important;
    }
    .visual-image-card-cover {
      padding: 0 8px 0 8px;
      border-radius: 8px;
      width: 100%;
      display: flex;
      justify-content: center;
      background-image: radial-gradient(circle, rgba(203, 213, 225) 1px, #fff 1px);
      background-size: 10px 10px;
      background-position: center center;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      img {
        height: 230px;
      }
      .public {
        width: 100px;
        height: 100px;
        position: absolute;
        background: red;
        top: -50px;
        right: -50px;
        transform: rotate(45deg);
        color: #fff;
        span {
          position: absolute;
          bottom: 0;
          display: block;
          width: 100px;
          text-align: center;
        }
      }
    }
    .visual-image-card-info {
      background-color: fade(@primary-color, 5);
      padding: 16px 8px;
      display: flex;
      justify-content: space-between;
      .title {
        font-weight: 600;
        width: 50%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .more-info {
        > * {
          margin-left: 8px;
        }
      }
    }
  }
</style>
