<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    :showCancelBtn="false"
    :canFullscreen="false"
    @register="registerModal"
    width="40%"
    @ok="close"
  >
    <template #title>
      {{ t(isSuccess ? '发送成功' : '发送失败') }}
    </template>
    <div class="stats-card-container">
      <div class="error" v-if="!isEmpty(stats?.error)">
        {{ stats?.error }}
      </div>
      <div class="error-info" v-if="!isEmpty(stats?.errors)">
        <div class="error-method" v-for="(data, method, index) in stats?.errors" :key="index">
          <p class="title">
            <Icon :icon="'ant-design:message-outlined'" color="red" />
            <!-- <ChatBubbleErrorIcon style="color: red;" /> -->
            <span> {{ Object.keys(data).length }}&nbsp;{{ getErrorMethod(method) }} 失败</span>
          </p>
          <List class="error-item" size="small">
            <ListItem v-for="(content, user, index2) in data" :key="index2">
              <ListItemMeta>
                <template #title>
                  <Tag color="error">{{ user }}</Tag>
                </template>
              </ListItemMeta>
              {{ content }}
            </ListItem>
          </List>
        </div>
      </div>
      <div class="sent" v-if="!isEmpty(stats?.sent)">
        <p class="title">
          <Icon :icon="'ant-design:message-outlined'" color="green" />
          <!-- <UserTransmitIcon /> -->
          <span>
            {{
              Object.keys(stats?.sent)
                .map((key) => Number.parseInt(stats?.sent[key]))
                .reduce((a, b) => a + b, 0)
            }}&nbsp;已经发送</span
          >
        </p>
        <p class="sent-item" v-for="(number, method, index) in stats?.sent" :key="index">
          <Tag class="method" color="success">{{ getErrorMethod(method) }}</Tag>
          <span class="number">{{ number }}</span>
        </p>
      </div>
    </div>
  </BasicModal>
</template>
<script lang="ts" setup name="RequestStatsDetail">
  import { ref, computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { isEmpty } from 'lodash-es';
  import { List, ListItem, ListItemMeta, Tag } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');

  const stats = ref<{ error: string; errors: Recordable; sent: Recordable }>();

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    stats.value = { ...data } || {};
    setModalProps({ loading: false });
  });

  const isSuccess = computed(() => {
    if (!isEmpty(stats.value?.error) || !isEmpty(stats.value?.errors)) {
      return false;
    }
    return true;
  });

  function getErrorMethod(method: string) {
    if (method == 'WEB') {
      return 'Web';
    } else if (method == 'SMS') {
      return '短信';
    } else if (method == 'EMAIL') {
      return 'Email';
    } else if (method == 'SLACK') {
      return 'Slack';
    } else {
      return method;
    }
  }

  function close() {
    stats.value = {} as { error: string; errors: Recordable; sent: Recordable };
    closeModal();
  }
</script>

<style lang="less">
  .stats-card-container {
    .error {
      border: 1px solid @border-color-base;
      border-radius: @border-radius-base;
      padding: 8px 4px;
      margin-bottom: 12px;
      background-color: lighten(@error-color, 30%);
      color: @error-color;
      font-weight: 600;
      font-size: 16px;
    }

    .error-info {
      border: 1px solid @border-color-base;
      border-radius: @border-radius-base;
      padding: 8px 2px;
      margin-bottom: 24px;
      background-color: lighten(@error-color, 30%);

      .error-method {
        .title {
          color: @text-color-base;
          font-weight: 600;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 10px 4px;
          border-bottom: 1px solid darken(@border-color-base, 10%);

          svg {
            font-size: 18px;
          }

          span {
            margin-left: 8px;
          }
        }

        .error-item {
          background-color: var(--td-error-color-1);

          .t-list-item {
            background-color: var(--td-error-color-1);

            :deep(.t-list-item__meta-title) {
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .sent {
      border: 1px solid @border-color-base;
      border-radius: @border-radius-base;
      padding: 8px 2px;
      background-color: lighten(@success-color, 40%);

      .title {
        color: @text-color-base;
        font-weight: 600;
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px 4px;
        border-bottom: 1px solid darken(@border-color-base, 10%);

        svg {
          font-size: 18px;
        }

        span {
          margin-left: 8px;
        }
      }

      .sent-item {
        padding: 4px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 60%;

        .method {
        }

        .number {
        }
      }
    }
  }
</style>
