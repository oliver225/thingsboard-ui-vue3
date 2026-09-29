/**
 * 持久化 RPC 状态(对应后端 org.thingsboard.server.common.data.rpc.RpcStatus)
 */
import { $t } from '@vben/locales';

export enum RpcStatus {
  DELETED = 'DELETED',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  SUCCESSFUL = 'SUCCESSFUL',
  TIMEOUT = 'TIMEOUT',
}

/** 状态 → 显示文案 */
export function rpcStatusLabel(value?: RpcStatus | string): string {
  if (!value) return '';
  return $t(`rpc.options.status.${value}`);
}

/** 状态 → Tag 颜色(对齐 ui-ngx rpcStatusColors) */
export function rpcStatusColor(value?: RpcStatus | string): string {
  switch (value) {
    case RpcStatus.DELIVERED:
    case RpcStatus.SENT:
    case RpcStatus.SUCCESSFUL: {
      return 'success';
    }
    case RpcStatus.EXPIRED:
    case RpcStatus.FAILED: {
      return 'error';
    }
    case RpcStatus.TIMEOUT: {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
}

/** 状态筛选下拉(不含 DELETED,后端查询会拒绝) */
export function rpcStatusOptions(): Array<{ label: string; value: RpcStatus }> {
  return [
    RpcStatus.QUEUED,
    RpcStatus.SENT,
    RpcStatus.DELIVERED,
    RpcStatus.SUCCESSFUL,
    RpcStatus.TIMEOUT,
    RpcStatus.EXPIRED,
    RpcStatus.FAILED,
  ].map((value) => ({ label: rpcStatusLabel(value), value }));
}
