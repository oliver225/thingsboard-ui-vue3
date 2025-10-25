import { defHttp } from '/@/utils/http/axios';

export interface SystemVersionInfo extends Recordable {
  version?: string;
  artifact?: string;
  name?: string;
  type?: string;
}

export interface SystemParams extends Recordable {
  userTokenAccessEnabled: boolean;
  edgesSupportEnabled: boolean;
  tbelEnabled: boolean;
  hasRepository: boolean;
  persistDeviceStateToTelemetry: boolean;
  mobileQrEnabled: boolean;

  maxDatapointsLimit: number;
  maxResourceSize: number;
  maxDebugModeDurationMinutes: number;
  maxArgumentsPerCF: boolean;
  maxDataPointsPerRollingArg: boolean;

  allowedDashboardIds?: Array<string>;
  userSettings?: Recordable;

  ruleChainDebugPerTenantLimitsConfiguration?: string;
  calculatedFieldDebugPerTenantLimitsConfiguration?: string;

  trendzSettings?: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
  };
}

export function getSystemVersionInfo() {
  return defHttp.get<SystemVersionInfo>({
    url: '/api/system/info',
  });
}

export function getSystemParams() {
  return defHttp.get<SystemParams>({
    url: '/api/system/params',
  });
}
