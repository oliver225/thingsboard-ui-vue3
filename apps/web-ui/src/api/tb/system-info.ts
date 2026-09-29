import { requestClient } from '#/api/request';

/** 全局系统参数，在认证初始化时加载，供各功能从 store 读取。 */
export interface SystemParams {
  userTokenAccessEnabled: boolean;
  allowedDashboardIds: string[];
  edgesSupportEnabled: boolean;
  hasRepository: boolean;
  tbelEnabled: boolean;
  persistDeviceStateToTelemetry: boolean;
  mobileQrEnabled: boolean;
  userSettings: {
    openedMenuSections?: string[];
    notDisplayConnectivityAfterAddDevice?: boolean;
    notDisplayInstructionsAfterAddEdge?: boolean;
    notDisplayConfigurationAfterAddMobileBundle?: boolean;
    includeBundleWidgetsInExport?: boolean;
    includeResourcesInExportWidgetTypes?: boolean;
    includeResourcesInExportDashboard?: boolean;
  };
  maxResourceSize: number;
  maxDatapointsLimit: number;
  maxDebugModeDurationMinutes: number;
  ruleChainDebugPerTenantLimitsConfiguration?: string;
  calculatedFieldDebugPerTenantLimitsConfiguration?: string;
  maxArgumentsPerCF: number;
  maxDataPointsPerRollingArg: number;
  minAllowedScheduledUpdateIntervalInSecForCF: number;
  minAllowedDeduplicationIntervalInSecForCF: number;
  minAllowedAggregationIntervalInSecForCF: number;
  intermediateAggregationIntervalInSecForCF: number;
  maxRelationLevelPerCfArgument: number;
  maxRelatedEntitiesToReturnPerCfArgument: number;
  trendzSettings: {
    enabled: boolean;
    baseUrl: null | string;
    apiKey: null | string;
  };
  nullsOrderStrategy: 'default' | 'nulls_first' | 'nulls_last';
  edqsEnabled: boolean;
  iotHubBaseUrl: string;
}

/** GET /api/system/params，调试时长已经由后端解析租户配置及默认值。 */
export function getSystemParams() {
  return requestClient.get<SystemParams>('/system/params');
}
