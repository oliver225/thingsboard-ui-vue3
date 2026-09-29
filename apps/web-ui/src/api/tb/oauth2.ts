import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export type OAuth2Platform = 'ANDROID' | 'IOS' | 'WEB';
export interface OAuth2BasicMapper {
  alwaysFullScreen?: boolean;
  customerNamePattern?: string;
  defaultDashboardName?: string;
  emailAttributeKey?: string;
  firstNameAttributeKey?: string;
  lastNameAttributeKey?: string;
  tenantNamePattern?: string;
  tenantNameStrategy?: 'CUSTOM' | 'DOMAIN' | 'EMAIL';
}
export interface OAuth2CustomMapper {
  password?: string;
  sendToken: boolean;
  url?: string;
  username?: string;
}
export interface OAuth2MapperConfig {
  activateUser: boolean;
  allowUserCreation: boolean;
  basic?: OAuth2BasicMapper;
  custom?: OAuth2CustomMapper;
  type: 'APPLE' | 'BASIC' | 'CUSTOM' | 'GITHUB';
}
export interface OAuth2Client extends BaseData<EntityType.OAUTH2_CLIENT> {
  accessTokenUri: string;
  additionalInfo: { [key: string]: unknown; providerName: string };
  authorizationUri: string;
  clientAuthenticationMethod: 'BASIC' | 'NONE' | 'POST';
  clientId: string;
  clientSecret: string;
  jwkSetUri?: string;
  loginButtonIcon?: string;
  loginButtonLabel: string;
  mapperConfig: OAuth2MapperConfig;
  platforms?: OAuth2Platform[];
  scope: string[];
  tenantId?: EntityId<EntityType.TENANT>;
  title: string;
  userInfoUri?: string;
  userNameAttributeName: string;
}
export interface OAuth2ClientInfo extends BaseData<EntityType.OAUTH2_CLIENT> {
  platforms?: OAuth2Platform[];
  providerName: string;
  title: string;
}
export interface OAuth2Template extends Omit<
  OAuth2Client,
  'additionalInfo' | 'id' | 'title'
> {
  additionalInfo?: unknown;
  comment?: string;
  helpLink?: string;
  id: { id: string };
  name: string;
  providerId: string;
}
export interface OAuth2Domain extends BaseData<EntityType.DOMAIN> {
  name: string;
  oauth2Enabled: boolean;
  propagateToEdge: boolean;
  tenantId?: EntityId<EntityType.TENANT>;
}
export interface OAuth2DomainInfo extends OAuth2Domain {
  oauth2ClientInfos?: (OAuth2ClientInfo | string)[];
}

export function getOAuth2Templates() {
  return requestClient.get<OAuth2Template[]>('/oauth2/config/template');
}
export function getOAuth2Clients(params: PageLink) {
  return requestClient.get<PageData<OAuth2ClientInfo>>('/oauth2/client/infos', {
    params,
  });
}
export function getOAuth2Client(id: string) {
  return requestClient.get<OAuth2Client>(`/oauth2/client/${id}`);
}
export function saveOAuth2Client(client: OAuth2Client) {
  return requestClient.post<OAuth2Client>('/oauth2/client', client);
}
export function deleteOAuth2Client(id: string): Promise<void> {
  return requestClient.delete(`/oauth2/client/${id}`);
}
export function getOAuth2LoginProcessingUrl() {
  return requestClient.get<string>('/oauth2/loginProcessingUrl');
}
export function getOAuth2Domains(params: PageLink) {
  return requestClient.get<PageData<OAuth2DomainInfo>>('/domain/infos', {
    params,
  });
}
export function getOAuth2Domain(id: string) {
  return requestClient.get<OAuth2DomainInfo>(`/domain/info/${id}`);
}
export function saveOAuth2Domain(domain: OAuth2Domain, clientIds?: string[]) {
  return requestClient.post<OAuth2Domain>('/domain', domain, {
    params: {
      oauth2ClientIds: clientIds?.length ? clientIds.join(',') : undefined,
    },
  });
}
export function updateDomainOAuth2Clients(
  id: string,
  clientIds: string[],
): Promise<void> {
  return requestClient.put(`/domain/${id}/oauth2Clients`, clientIds);
}
export function deleteOAuth2Domain(id: string): Promise<void> {
  return requestClient.delete(`/domain/${id}`);
}
