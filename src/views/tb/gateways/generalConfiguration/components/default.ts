import {
  GrpcConfigurationValue,
  LogsConfigurationValue,
  StorageConfigurationValue,
} from '/@/api/tb/gateways/types/configuration';

import { GeneralConfigurationValue } from '/@/api/tb/gateways/types/configuration';

export const DEFAULT_LOGS_FORM: LogsConfigurationValue = {
  version: 1,
  disable_existing_loggers: false,
  formatters: {
    LogFormatter: {
      class: 'logging.Formatter',
      format:
        '%(asctime)s.%(msecs)03d - |%(levelname)s| - [%(filename)s] - %(module)s - %(funcName)s - %(lineno)d - %(message)s',
      datefmt: '%Y-%m-%d %H:%M:%S',
    },
  },
  handlers: {
    consoleHandler: {
      class: 'logging.StreamHandler',
      formatter: 'LogFormatter',
      level: 0,
      stream: 'ext://sys.stdout',
    },
    databaseHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/database.log',
      backupCount: 1,
      encoding: 'utf-8',
    },
    serviceHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/service.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
    connectorHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/connector.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
    converterHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/converter.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
    tb_connectionHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/tb_connection.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
    storageHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/storage.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
    extensionHandler: {
      class: 'thingsboard_gateway.tb_utility.tb_handler.TimedRotatingFileHandler',
      formatter: 'LogFormatter',
      filename: './logs/extension.log',
      backupCount: 7,
      interval: 3,
      when: 'D',
      encoding: 'utf-8',
    },
  },
  loggers: {
    database: {
      handlers: ['databaseHandler', 'consoleHandler'],
      level: 'DEBUG',
      propagate: false,
    },
    service: {
      handlers: ['serviceHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
    connector: {
      handlers: ['connectorHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
    converter: {
      handlers: ['converterHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
    tb_connection: {
      handlers: ['tb_connectionHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
    storage: {
      handlers: ['storageHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
    extension: {
      handlers: ['extensionHandler', 'consoleHandler'],
      level: 'INFO',
      propagate: false,
    },
  },
  root: {
    level: 'ERROR',
    handlers: ['consoleHandler'],
  },
};

export const DEFAULT_GENERAL_FORM: Partial<GeneralConfigurationValue> = {
  host: location.hostname,
  port: 1883,
  remoteShell: false,
  remoteConfiguration: true,
  handleDeviceRenaming: true,
  security: {
    type: 'accessToken',
    accessToken: '',
  },
};

export const DEFAULT_STATISTICS_FORM = {
  enable: true,
  statsSendPeriodInSeconds: 3600,
  customStatsSendPeriodInSeconds: 3600,
  commands: [],
};

export const DEFAULT_STORAGE_FORM: Omit<StorageConfigurationValue, 'ts' | 'ts'> = {
  type: 'memory',
  read_records_count: 100,
  max_records_count: 100000,
  data_folder_path: './data/',
  max_file_count: 10,
  max_read_records_count: 10,
  max_records_per_file: 10000,
  data_file_path: './data/data.db',
  messages_ttl_check_in_hours: 1,
  messages_ttl_in_days: 7,
};

export const DEFAULT_GRPC_FORM: Omit<GrpcConfigurationValue, 'ts'> = {
  enabled: false,
  serverPort: 9595,
  keepAliveTimeMs: 10000,
  keepAliveTimeoutMs: 5000,
  keepalivePermitWithoutCalls: true,
  maxPingsWithoutData: 2,
  minTimeBetweenPingsMs: 10000,
  minPingIntervalWithoutDataMs: 5000,
};

export const DEFAULT_OTHER_FORM: Partial<GeneralConfigurationValue> = {
  checkingDeviceActivity: {
    checkDeviceInactivity: false,
    inactivityTimeoutSeconds: 300,
    inactivityCheckPeriodSeconds: 10,
  },
  minPackSendDelayMS: 50,
  qos: 1,
  checkConnectorsConfigurationInSeconds: 60,
  maxPayloadSizeBytes: 8196,
  minPackSizeToSend: 500,
};
