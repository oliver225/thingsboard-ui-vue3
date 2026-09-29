import type { NotificationRequest } from '#/api/tb/notification';
import type { NotificationTemplateConfig } from '#/api/tb/notification-template';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  EntityType,
  NotificationDeliveryMethod,
  NotificationType,
} from '#/enums';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface RequestFormValues {
  mode: 'scratch' | 'template';
  templateId?: string;
  targets: string[];
  deliveryMethods: NotificationDeliveryMethod[];
  scheduleEnabled: boolean;
  timezone: string;
  scheduledTime?: string;
}

export const SCHEDULE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function createDefaultScheduledTime(zone: string) {
  return dayjs().tz(zone).add(1, 'hour').format(SCHEDULE_FORMAT);
}

/** 将选定时区的墙上时间转换为时间戳；拒绝无效日期及夏令时跳过的时间。 */
export function getScheduledTimestamp(time: string | undefined, zone: string) {
  if (!time || !zone) return Number.NaN;
  try {
    const parsed = dayjs.tz(time, zone);
    return parsed.format(SCHEDULE_FORMAT) === time
      ? parsed.valueOf()
      : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

export function isScheduledTimeValid(
  time: string | undefined,
  zone: string,
  now = Date.now(),
) {
  const timestamp = getScheduledTimestamp(time, zone);
  return timestamp > now && timestamp <= now + 7 * 24 * 60 * 60 * 1000;
}

/** 仅序列化创建请求字段；重发时也不能携带原请求 ID。发送前重新计算延时。 */
export function toNotificationRequestPayload(
  formValues: RequestFormValues,
  configuration: NotificationTemplateConfig,
  templateName: string,
): NotificationRequest {
  return {
    targets: [...formValues.targets],
    additionalConfig: {
      sendingDelayInSec: formValues.scheduleEnabled
        ? Math.ceil(
            (getScheduledTimestamp(
              formValues.scheduledTime,
              formValues.timezone,
            ) -
              Date.now()) /
              1000,
          )
        : 0,
    },
    ...(formValues.mode === 'template'
      ? {
          templateId: {
            entityType: EntityType.NOTIFICATION_TEMPLATE,
            id: formValues.templateId ?? '',
          },
        }
      : {
          template: {
            name: templateName,
            notificationType: NotificationType.GENERAL,
            configuration,
          },
        }),
  };
}

/** 邮件只用于预览，隔离脚本、表单、外部请求和页面导航。 */
export function getEmailPreviewDocument(body: string) {
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>body{font:14px/1.6 system-ui,sans-serif;margin:16px;overflow-wrap:anywhere}img{max-width:100%}a{pointer-events:none}</style></head><body>${body}</body></html>`;
}
