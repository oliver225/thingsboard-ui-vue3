import type {
  DeliveryMethodNotificationTemplate,
  NotificationButtonConfig,
} from '#/api/tb/notification-template';

import { NotificationDeliveryMethod, NotificationType } from '#/enums';
import { $t } from '#/locales';

export interface DeliveryMethodFormValues {
  subject: string;
  body: string;
  iconEnabled: boolean;
  icon: string;
  color: string;
  themeColor: string;
  actionEnabled: boolean;
  text: string;
  linkType: 'DASHBOARD' | 'LINK';
  link: string;
  dashboardId: string;
  dashboardState: string;
  setEntityIdInState: boolean;
}

export function deliveryMethodOptions() {
  return [
    {
      value: NotificationDeliveryMethod.WEB,
      label: $t('notification.features.template.deliveryMethod.web'),
      icon: 'lucide:bell',
    },
    {
      value: NotificationDeliveryMethod.MOBILE_APP,
      label: $t('notification.features.template.deliveryMethod.mobileApp'),
      icon: 'lucide:smartphone',
    },
    {
      value: NotificationDeliveryMethod.SMS,
      label: $t('notification.features.template.deliveryMethod.sms'),
      icon: 'lucide:message-square',
    },
    {
      value: NotificationDeliveryMethod.EMAIL,
      label: $t('notification.features.template.deliveryMethod.email'),
      icon: 'lucide:mail',
    },
    {
      value: NotificationDeliveryMethod.SLACK,
      label: $t('notification.features.template.deliveryMethod.slack'),
      icon: 'lucide:slack',
    },
    {
      value: NotificationDeliveryMethod.MICROSOFT_TEAMS,
      label: $t('notification.features.template.deliveryMethod.microsoftTeams'),
      icon: 'lucide:video',
    },
  ];
}

export function isAllowedNotificationType(
  type: NotificationType,
  isSysAdmin: boolean,
) {
  const systemTypes: NotificationType[] = [
    NotificationType.ENTITIES_LIMIT,
    NotificationType.ENTITIES_LIMIT_INCREASE_REQUEST,
    NotificationType.API_USAGE_LIMIT,
    NotificationType.NEW_PLATFORM_VERSION,
    NotificationType.RATE_LIMITS,
    NotificationType.TASK_PROCESSING_FAILURE,
    NotificationType.RESOURCES_SHORTAGE,
  ];
  return (
    type === NotificationType.GENERAL ||
    systemTypes.includes(type) === isSysAdmin
  );
}

export function getDeliveryMethodFormValues(
  method: NotificationDeliveryMethod,
  template?: DeliveryMethodNotificationTemplate,
): DeliveryMethodFormValues {
  const icon = template?.additionalConfig?.icon;
  let button = template?.additionalConfig?.actionButtonConfig;
  if (method === NotificationDeliveryMethod.MICROSOFT_TEAMS) {
    button = template?.button;
  } else if (method === NotificationDeliveryMethod.MOBILE_APP) {
    button = template?.additionalConfig?.onClick;
  }
  return {
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    iconEnabled: icon?.enabled ?? false,
    icon: icon?.icon ?? 'lucide:bell',
    color: icon?.color ?? '#757575',
    themeColor: template?.themeColor ?? '',
    actionEnabled: button?.enabled ?? false,
    text: button?.text ?? '',
    linkType: button?.linkType ?? 'LINK',
    link: button?.link ?? '',
    dashboardId: button?.dashboardId ?? '',
    dashboardState: button?.dashboardState ?? '',
    setEntityIdInState: button?.setEntityIdInState ?? true,
  };
}

export function getDeliveryMethodTemplate(
  method: NotificationDeliveryMethod,
  values: DeliveryMethodFormValues,
): DeliveryMethodNotificationTemplate {
  const { WEB, MOBILE_APP, EMAIL, MICROSOFT_TEAMS } =
    NotificationDeliveryMethod;
  const template: DeliveryMethodNotificationTemplate = {
    method,
    enabled: true,
    body: values.body.trim(),
  };
  if ([EMAIL, MICROSOFT_TEAMS, MOBILE_APP, WEB].includes(method))
    template.subject = (values.subject ?? '').trim();
  const button: NotificationButtonConfig = { enabled: values.actionEnabled };
  if (values.actionEnabled) {
    button.linkType = values.linkType;
    if (method !== MOBILE_APP) button.text = values.text.trim();
    if (values.linkType === 'LINK') {
      button.link = values.link.trim();
    } else {
      button.dashboardId = values.dashboardId;
      button.dashboardState = (values.dashboardState ?? '').trim();
      button.setEntityIdInState = values.setEntityIdInState;
    }
  }
  if (method === WEB || method === MOBILE_APP) {
    template.additionalConfig = {
      icon: values.iconEnabled
        ? { enabled: true, icon: values.icon.trim(), color: values.color }
        : { enabled: false },
      ...(method === WEB
        ? { actionButtonConfig: button }
        : { onClick: button }),
    };
  } else if (method === MICROSOFT_TEAMS) {
    template.themeColor = values.themeColor ?? '';
    template.button = button;
  }
  return template;
}
