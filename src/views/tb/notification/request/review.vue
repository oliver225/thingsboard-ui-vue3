<template>
  <div class="notification-request-review">
    <div v-if="record?.processedTemplates?.WEB?.enabled == true" class="preview-notification">
      <div class="title">
        <Icon :icon="'ant-design:bell-outlined'" />
        <span> web通知预览</span>
      </div>
      <div class="w-full">
        <div class="web-container">
          <div class="web-container-body-wrapper">
            <div class="web-container-body">
              <Icon
                v-if="record.processedTemplates?.WEB?.additionalConfig?.icon?.enabled == true"
                :icon="record?.processedTemplates?.WEB?.additionalConfig?.icon?.icon"
                :color="record?.processedTemplates?.WEB?.additionalConfig?.icon?.color"
              />
              <Icon v-else :icon="'ant-design:info-circle-filled'" :color="'blue'" />
              <div class="web-container-body-title">
                <div class="w-full">
                  <span v-html="record.processedTemplates?.WEB?.subject"></span>
                  <span class="time">一分钟前</span>
                </div>
              </div>
              <div class="web-container-body-content">
                <div v-html="record.processedTemplates?.WEB?.body"> </div>
              </div>
            </div>
            <div class="web-container-btns">
              <a-button
                type="primary"
                v-if="record.processedTemplates?.WEB?.additionalConfig?.actionButtonConfig?.enabled == true"
              >
                {{ record.processedTemplates?.WEB?.additionalConfig?.actionButtonConfig?.text }}
              </a-button>
              <a-button type="primary" v-else> 知道了 </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="record?.processedTemplates?.SMS?.enabled == true" class="preview-notification">
      <div class="title">
        <Icon :icon="'ant-design:message-outlined'" />
        <span> 短信通知预览</span>
      </div>
      <div class="sms-container">
        <div v-html="record?.processedTemplates?.SMS?.body"></div>
      </div>
    </div>
    <div v-if="record?.processedTemplates?.EMAIL?.enabled == true" class="preview-notification">
      <div class="title">
        <Icon :icon="'ant-design:mail-outlined'" />
        <span> Email通知预览</span>
      </div>
      <div class="email-container">
        <div class="email-subject">
          <div v-html="record?.processedTemplates?.EMAIL?.subject"></div>
        </div>
        <div class="email-body">
          <div v-html="record?.processedTemplates?.EMAIL?.body"></div>
        </div>
      </div>
    </div>
    <div v-if="record?.processedTemplates?.SLACK?.enabled == true" class="preview-notification">
      <div class="title">
        <Icon :icon="'ant-design:slack-outlined'" />
        <span> Slack通知预览</span>
      </div>
      <div class="sms-container">
        <div v-html="record?.processedTemplates?.SLACK?.body"></div>
      </div>
    </div>
    <div class="recipient-container">
      <div class="title">
        <Icon :icon="'ant-design:usergroup-add-outlined'" />
        <span>{{ record?.totalRecipientsCount }} 位接收用户</span>
      </div>
      <ul class="count">
        <li v-for="(key, value, index) in record?.recipientsCountByTarget" :key="index">
          {{ key }} &nbsp;{{ value }}
        </li>
      </ul>
      <div class="user">
        <Space wrap>
          <Tag v-for="(item, , index) in record?.recipientsPreview" :key="index">
            {{ item }}
          </Tag>
        </Space>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup name="ViewsTbNotificationRequestReview">
  import { Space, Tag } from 'ant-design-vue';
  import { ref } from 'vue';
  import { NotificationRequestPreview } from '/@/api/tb/notification';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  const { t } = useI18n('tb');

  const record = ref<NotificationRequestPreview>({} as NotificationRequestPreview);

  function setValue(data: Recordable) {
    record.value = data as NotificationRequestPreview;
    console.log(record.value);
  }

  defineExpose({ setValue });
</script>
<style lang="less">
  .notification-request-review {
    .preview-notification {
      border: 1px solid @border-color-base;
      border-radius: @border-radius-base;
      padding: 8px 10px;
      margin-bottom: 8px;
      background-color: lighten(@primary-color, 40%);

      .title {
        color: @text-color-base;
        font-weight: 600;
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        svg {
          font-size: 18px;
        }

        span {
          margin-left: 8px;
        }
      }

      .web-container {
        border: 1px solid @border-color-base;
        border-radius: 8px;
        background-color: @background-color-light;
        padding: 20px 24px;
        position: relative;
        margin: 0 auto;
        width: 60%;

        .web-container-body-wrapper {
          .web-container-body {
            display: flex;
            flex-wrap: wrap;
            align-items: center;

            .anticon {
              flex: none;
              margin-inline-end: 12px;
              font-size: 22px;
            }

            .web-container-body-title {
              flex: 1;
              display: block;
              overflow: hidden;
              color: rgba(0, 0, 0, 0.88);
              font-weight: 600;
              font-size: 16px;
              line-height: 1.5;

              .time {
                float: right;
                font-size: 12px;
                font-weight: normal;
                color: rgba(0, 0, 0, 0.45);
              }
            }

            .web-container-body-content {
              margin-inline-start: 34px;
              margin-block-start: 8px;
              flex-basis: 100%;
              max-width: calc(100% - 34px);
              color: rgba(0, 0, 0, 0.88);
              font-size: 14px;
            }
          }

          .web-container-btns {
            text-align: end;
            margin-top: 12px;
          }
        }

        .web-subject {
          display: flex;
          align-items: center;
          font-size: 16px;

          span {
            margin-left: 6px;
          }
        }

        .web-body {
          padding: 10px 12px;
        }

        .web-time {
          position: absolute;
          top: 12px;
          right: 12px;
          color: rgba(0, 0, 0, 0.45);
        }
      }

      .sms-container {
        border: 1px solid @border-color-base;
        border-radius: @border-radius-base;
        background-color: @background-color-light;
        padding: 12px;
      }

      .email-container {
        border: 1px solid @border-color-base;
        border-radius: @border-radius-base;
        background-color: @background-color-light;
        padding: 12px;

        .email-subject {
          padding: 8px;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid @border-color-base;
        }

        .email-body {
          padding: 12px;
        }
      }
    }

    .recipient-container {
      border: 1px solid @border-color-base;
      border-radius: @border-radius-base;
      padding: 12px;

      .title {
        color: @text-color-base;
        font-weight: 600;
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        svg {
          font-size: 18px;
        }

        span {
          margin-left: 8px;
        }
      }

      .count {
        color: @text-color-secondary;
        padding: 8px;
        border-bottom: 1px solid @border-color-base;
      }

      .user {
        padding: 4px;

        span {
          margin: 2px;
          font-weight: 600;
        }
      }
    }
  }
</style>
