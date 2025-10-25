import { defHttp } from '/@/utils/http/axios';
import { BasicModel } from '/@/api/model/baseModel';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface RPC extends BasicModel<EntityType.RPC> {
  tenantId?: EntityId<EntityType.TENANT>;
  deviceId?: EntityId<EntityType.DEVICE>;
  expirationTime?: number;
  request?: Recordable;
  response?: Recordable;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'SUCCESSFUL' | 'TIMEOUT' | 'EXPIRED' | 'FAILED' | 'DELETED';
  additionalInfo?: any;
}

export interface RpcSendParams {
  method: string;
  params?: { command: string; cwd: string };
  timeout: number;

  persistent?: boolean;
  retries?: string | number | null;
}

export interface RpcSendResult {
  // sendCommand
  ok?: boolean;

  // getTermInfo
  cwd?: string;
  platform?: string;
  release?: string;

  //getCommandStatus
  data?: Array<any>;
  done?: boolean;
}

export function rpcSendTwoway(deviceId: string, data: RpcSendParams) {
  return defHttp.postJson<RpcSendResult>(
    {
      url: `/api/rpc/twoway/${deviceId}`,
      data,
    },
    {
      errorMessageMode: 'message',
    },
  );
}

export function rpcSendOneway(deviceId: string, data: RpcSendParams) {
  return defHttp.postJson<RpcSendResult>({
    url: `/api/rpc/oneway/${deviceId}`,
    data,
  });
}

export function getPersistedRpc(rpcId: string) {
  return defHttp.get<RPC>({
    url: `/api/rpc/persistent/${rpcId}`,
  });
}

export function deletePersistedRpc(rpcId: string) {
  return defHttp.delete({
    url: `/api/rpc/persistent/${rpcId}`,
  });
}
export function getPersistedRpcByDevice(deviceId: string) {
  return defHttp.get<any>({
    url: `/api/rpc/persistent/device/${deviceId}`,
  });
}
