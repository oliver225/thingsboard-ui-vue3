/**
 * 安全类型
 */
export const SECURITY_TABS = [
  { value: 'accessToken', label: 'Access Token' },
  { value: 'tlsAccessToken', label: 'TLS + Access Token' },
  { value: 'usernamePassword', label: 'Username and Password' },
];

/**
 * 日志等级
 */
export const LEVEL_OPTIONS = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'CRITICAL', value: 'CRITICAL' },
  { label: 'TRACE', value: 'TRACE' },
];

export const LEVEL_OPTIONS_COLORS: Record<string, string> = {
  INFO: 'blue',
  WARN: 'orange',
  WARNING: 'orange',
  ERROR: 'red',
  DEBUG: 'purple',
};

/**
 * 时间类型
 */
export const PERIOD_UNIT_OPTIONS = [
  { label: 'seconds', value: 'S' },
  { label: 'minutes', value: 'M' },
  { label: 'hours', value: 'H' },
  { label: 'days', value: 'D' },
];

export const LOCAL_TABS = [
  { value: 'service', label: 'Service' },
  { value: 'connector', label: 'Connector' },
  { value: 'converter', label: 'Converter' },
  { value: 'tb_connection', label: 'TB Connection' },
  { value: 'storage', label: 'Storage' },
  { value: 'extension', label: 'Extension' },
];
