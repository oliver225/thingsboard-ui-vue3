import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { UserInfo } from '/#/store';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface NotificationTargetConfig {
  description?: string;
  type: 'PLATFORM_USERS' | 'SLACK';
  // PLATFORM_USERS
  usersFilter?: {
    type:
      | 'USER_LIST'
      | 'CUSTOMER_USERS'
      | 'TENANT_ADMINISTRATORS'
      | 'AFFECTED_TENANT_ADMINISTRATORS'
      | 'SYSTEM_ADMINISTRATORS'
      | 'ALL_USERS'
      | 'ORIGINATOR_ENTITY_OWNER_USERS'
      | 'AFFECTED_USER';
    tenantsIds?: [string]; //TENANT_ADMINISTRATORS
    tenantProfilesIds?: [string]; // TENANT_ADMINISTRATORS
    usersIds?: [string]; // USER_LIST
    customerId?: string; // CUSTOMER_USERS
  };
  conversationType?: 'DIRECT' | 'PUBLIC_CHANNEL' | 'PRIVATE_CHANNEL'; // SLACK
  conversation?: Recordable; // SLACK
}

export interface NotificationTarget extends BasicModel<EntityType.NOTIFICATION_TARGET> {
  tenantId?: EntityId<EntityType.TENANT>;
  name?: string; //cannot be longer than 255 chars
  configuration?: NotificationTargetConfig;
}

export function notificationTargetListByIds(ids: string[]) {
  return defHttp.get<Page<NotificationTarget>>({
    url: '/api/notification/targets',
    params: { ids: ids },
  });
}

export function notificationTargetList(params: BasicQuery, notificationType?: string) {
  return defHttp.get<Page<NotificationTarget>>({
    url: '/api/notification/targets',
    params: notificationType ? { notificationType: notificationType, ...params } : params,
  });
}

export function saveNotificationTarget(data?: NotificationTarget | any) {
  return defHttp.postJson<NotificationTarget>({
    url: '/api/notification/target',
    data,
  });
}

export function getNotificationTargetById(notificationTargetId: string) {
  return defHttp.get<NotificationTarget>({
    url: `/api/notification/target/${notificationTargetId}`,
  });
}

export function deleteNotificationTarget(notificationTargetId: string) {
  return defHttp.delete<void>({
    url: `/api/notification/target/${notificationTargetId}`,
  });
}

export function getRecipientsByTargetConfig(data: NotificationTarget | any, params: BasicQuery) {
  return defHttp.postJson<Page<UserInfo>>({
    url: '/api/notification/target/recipients',
    data,
    params,
  });
}
