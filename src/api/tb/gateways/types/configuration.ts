// --- 日志配置 ---
export interface LogsConfigurationValue {
  version: number;
  disable_existing_loggers: boolean;
  formatters: Record<
    string,
    {
      class: string;
      format: string;
      datefmt: string;
    }
  >;
  handlers: Record<
    string,
    {
      class: string;
      formatter: string;
      level?: number;
      stream?: string;
      filename?: string;
      backupCount?: number;
      interval?: number;
      when?: string;
      encoding?: string;
    }
  >;
  loggers: Record<
    string,
    {
      handlers: string[];
      level: string;
      propagate: boolean;
    }
  >;
  root: {
    level: string;
    handlers: string[];
  };
  ts?: number;
}

// --- gRPC 配置 ---
export interface GrpcConfigurationValue {
  enabled: boolean;
  serverPort: number;
  keepAliveTimeMs: number;
  keepAliveTimeoutMs: number;
  keepalivePermitWithoutCalls: boolean;
  maxPingsWithoutData: number;
  minTimeBetweenPingsMs: number;
  minPingIntervalWithoutDataMs: number;
  ts?: number;
}

// --- 存储配置 ---
export interface StorageConfigurationValue {
  type: string;
  read_records_count: number;
  max_records_count: number;
  data_folder_path: string;
  max_file_count: number;
  max_read_records_count: number;
  max_records_per_file: number;
  data_file_path: string;
  messages_ttl_check_in_hours: number;
  messages_ttl_in_days: number;
  ts?: number;
}

// --- 通用网关配置 (general_configuration) ---
export interface GeneralConfigurationValue {
  host: string;
  port: number;
  remoteShell: boolean;
  remoteConfiguration: boolean;
  latencyDebugMode: boolean;
  statistics: {
    enable: boolean;
    enableCustom?: boolean;
    statsSendPeriodInSeconds: number;
    customStatsSendPeriodInSeconds: number;
    commands: {
      attributeOnGateway: string;
      command: string;
      installCmd: string;
      timeout: number;
    }[];
  };
  deviceFiltering: {
    enable: boolean;
    filterFile: string;
  };
  maxPayloadSizeBytes: number;
  minPackSendDelayMS: number;
  minPackSizeToSend: number;
  checkConnectorsConfigurationInSeconds: number;
  handleDeviceRenaming: boolean;
  security: {
    type: string;
    accessToken?: string;
    caCer?: string;
    clientId?: string;
    userName?: string;
    password?: string;
  };
  qos: number;
  reportStrategy: {
    type: string;
  };
  checkingDeviceActivity: {
    checkDeviceInactivity: boolean;
    inactivityTimeoutSeconds: number;
    inactivityCheckPeriodSeconds: number;
  };
  rateLimits: string;
  dpRateLimits: string;
  messagesRateLimits: string;
  deviceMessagesRateLimits: string;
  deviceRateLimits: string;
  deviceDpRateLimits: string;
  ts: number;
}
