import { requestClient } from '#/api/request';

export type ConnectivityCommand = string | string[];
export interface PublishTelemetryCommand {
  http?: { http?: string; https?: string };
  mqtt?: {
    mqtt?: string;
    mqtts?: ConnectivityCommand;
    docker?: { mqtt?: string; mqtts?: ConnectivityCommand };
    sparkplug?: string;
  };
  coap?: {
    coap?: string;
    coaps?: ConnectivityCommand;
    docker?: { coap?: string; coaps?: ConnectivityCommand };
  };
  lwm2m?: string;
  snmp?: string;
}

/** 原版 DeviceService.getDevicePublishTelemetryCommands：命令由后端根据凭证和连接设置生成。 */
export function getDevicePublishTelemetryCommands(
  deviceId: string,
  signal?: AbortSignal,
) {
  // 弹窗提供重试反馈；取消加载时不显示全局错误提示。
  const config = { signal, skipErrorHandler: true };
  return requestClient.get<PublishTelemetryCommand>(
    `/device-connectivity/${deviceId}`,
    config,
  );
}
