/**
 * ThingsBoard 基础类型定义
 */
import type { Authority, EntityType } from '#/enums';

/** 实体 ID(org.thingsboard.server.common.data.id.EntityId) */
export interface EntityId<T extends EntityType = EntityType> {
  entityType: T;
  id: string;
}

/** 分页查询参数(org.thingsboard.server.common.data.page.PageLink) */
export interface PageLink {
  /** 0 基页码 */
  page: number;
  pageSize: number;
  sortOrder?: 'ASC' | 'DESC';
  sortProperty?: string;
  textSearch?: string;
}

/** 分页结果(org.thingsboard.server.common.data.page.PageData) */
export interface PageData<T> {
  data: T[];
  hasNext: boolean;
  totalElements: number;
  totalPages: number;
}

/** JWT 令牌对(org.thingsboard.server.service.security.model.JwtPair) */
export interface JwtPair {
  refreshToken: string;
  scope?: string;
  token: string;
}

/** 实体基类(BaseData + createdTime) */
export interface BaseData<T extends EntityType = EntityType> {
  createdTime?: number;
  id?: EntityId<T>;
  version?: number;
}

/** 实体摘要(EntityInfo,下拉选择用) */
export interface EntityInfo {
  id: EntityId;
  name: string;
}

/** TB 用户实体(org.thingsboard.server.common.data.User) */
export interface TbUser extends BaseData<EntityType.USER> {
  additionalInfo?: {
    [key: string]: any;
    defaultDashboardFullscreen?: boolean;
    defaultDashboardId?: string;
    description?: string;
    homePath?: string;
    lang?: string;
  };
  authority: Authority;
  customerId?: EntityId<EntityType.CUSTOMER>;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  version?: number;
}

/** TB 错误响应体(ThingsboardErrorResponse) */
export interface TbErrorResponse {
  errorCode: number;
  message: string;
  status: number;
  timestamp: number;
}

/** TB 错误码(ThingsboardErrorCode),仅列常用 */
export const TB_ERROR_CODE = {
  AUTHENTICATION: 10,
  BAD_REQUEST_PARAMS: 31,
  GENERAL: 2,
  ITEM_NOT_FOUND: 32,
  JWT_TOKEN_EXPIRED: 11,
  PERMISSION_DENIED: 20,
  TOO_MANY_REQUESTS: 33,
} as const;
