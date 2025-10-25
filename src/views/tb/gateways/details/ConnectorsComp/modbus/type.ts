import { REPORT_TYPE } from '/@/enums/gateway';

export enum TABLE_TYPE {
  ATTRIBUTES = 'attributes',
  TIMESERIES = 'timeseries',
  ATTRIBUTE_UPDATES = 'attributeUpdates',
  RPC = 'rpc',
}

export enum MODBUS_TYPE {
  TCP = 'tcp',
  UDP = 'udp',
  SERIAL = 'serial',
}

export enum MODBUS_METHOD {
  SOCKET = 'socket',
  RTU = 'rtu',
  ASCII = 'ascii',
}

export enum BYTE_ORDER {
  LITTLE = 'LITTLE',
  BIG = 'BIG',
}

export enum WORD_ORDER {
  LITTLE = 'LITTLE',
  BIG = 'BIG',
}

export enum MODIFIER_TYPE {
  DIVIDER = 'divider',
  MULTIPLIER = 'multiplier',
}

export enum DATA_TYPE {
  STRING = 'string',
  BYTES = 'bytes',
  BITS = 'bits',
  INT8 = '8int',
  INT16 = '16int',
  INT32 = '32int',
  INT64 = '64int',
  UINT8 = '8uint',
  UINT16 = '16uint',
  UINT32 = '32uint',
  UINT64 = '64uint',
  FLOAT16 = '16float',
  FLOAT32 = '32float',
  FLOAT64 = '64float',
}

export enum SERIAL_BAUDRATE {
  BAUD_1200 = 1200,
  BAUD_2400 = 2400,
  BAUD_4800 = 4800,
  BAUD_9600 = 9600,
  BAUD_19200 = 19200,
  BAUD_38400 = 38400,
  BAUD_57600 = 57600,
  BAUD_115200 = 115200,
  BAUD_230400 = 230400,
  BAUD_460800 = 460800,
  BAUD_921600 = 921600,
}

export enum SERIAL_BYTESIZE {
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
}

export enum SERIAL_PARITY {
  NONE = 'N',
  EVEN = 'E',
  ODD = 'O',
  MARK = 'M',
  SPACE = 'S',
}

export const MODBUS_TYPE_OPTIONS = [
  { label: 'TCP', value: MODBUS_TYPE.TCP },
  { label: 'UDP', value: MODBUS_TYPE.UDP },
  { label: 'Serial', value: MODBUS_TYPE.SERIAL },
];

export const MODBUS_METHOD_OPTIONS = [
  { label: 'Socket', value: MODBUS_METHOD.SOCKET },
  { label: 'RTU', value: MODBUS_METHOD.RTU },
];

export const MODBUS_METHOD_SERIAL_OPTIONS = [
  { label: 'RTU', value: MODBUS_METHOD.RTU },
  { label: 'ASCII', value: MODBUS_METHOD.ASCII },
];

export const ORDER_OPTIONS = [
  { label: 'Little', value: BYTE_ORDER.LITTLE },
  { label: 'Big', value: BYTE_ORDER.BIG },
];

export const SERIAL_BAUDRATE_OPTIONS = [
  { label: '1200', value: SERIAL_BAUDRATE.BAUD_1200 },
  { label: '2400', value: SERIAL_BAUDRATE.BAUD_2400 },
  { label: '4800', value: SERIAL_BAUDRATE.BAUD_4800 },
  { label: '9600', value: SERIAL_BAUDRATE.BAUD_9600 },
  { label: '19200', value: SERIAL_BAUDRATE.BAUD_19200 },
  { label: '38400', value: SERIAL_BAUDRATE.BAUD_38400 },
  { label: '57600', value: SERIAL_BAUDRATE.BAUD_57600 },
  { label: '115200', value: SERIAL_BAUDRATE.BAUD_115200 },
  { label: '230400', value: SERIAL_BAUDRATE.BAUD_230400 },
  { label: '460800', value: SERIAL_BAUDRATE.BAUD_460800 },
  { label: '921600', value: SERIAL_BAUDRATE.BAUD_921600 },
];

export const SERIAL_BYTESIZE_OPTIONS = [
  { label: '5', value: SERIAL_BYTESIZE.FIVE },
  { label: '6', value: SERIAL_BYTESIZE.SIX },
  { label: '7', value: SERIAL_BYTESIZE.SEVEN },
  { label: '8', value: SERIAL_BYTESIZE.EIGHT },
];

export const SERIAL_PARITY_OPTIONS = [
  { label: 'None', value: SERIAL_PARITY.NONE },
  { label: 'Even', value: SERIAL_PARITY.EVEN },
  { label: 'Odd', value: SERIAL_PARITY.ODD },
  { label: 'Mark', value: SERIAL_PARITY.MARK },
  { label: 'Space', value: SERIAL_PARITY.SPACE },
];

export const DATA_TYPE_OPTIONS = [
  { label: 'String', value: DATA_TYPE.STRING },
  { label: 'Bytes', value: DATA_TYPE.BYTES },
  { label: 'Bits', value: DATA_TYPE.BITS },
  { label: '8Int', value: DATA_TYPE.INT8 },
  { label: '16Int', value: DATA_TYPE.INT16 },
  { label: '32Int', value: DATA_TYPE.INT32 },
  { label: '64Int', value: DATA_TYPE.INT64 },
  { label: '8uint', value: DATA_TYPE.UINT8 },
  { label: '16uint', value: DATA_TYPE.UINT16 },
  { label: '32uint', value: DATA_TYPE.UINT32 },
  { label: '64uint', value: DATA_TYPE.UINT64 },
  { label: '16float', value: DATA_TYPE.FLOAT16 },
  { label: '32float', value: DATA_TYPE.FLOAT32 },
  { label: '64float', value: DATA_TYPE.FLOAT64 },
];

export enum BIT_TARGET_TYPE {
  INTEGER = 'int',
  BOOLEAN = 'bool',
}

// Bit target type 选项
export const BIT_TARGET_TYPE_OPTIONS = [
  { label: 'Integer', value: BIT_TARGET_TYPE.INTEGER },
  { label: 'Boolean', value: BIT_TARGET_TYPE.BOOLEAN },
];

export const FUNCTION_CODE_OPTIONS = [
  { label: '01 - Read Coils', value: 1 },
  { label: '02 - Read Discrete Inputs', value: 2 },
  { label: '03 - Read Multiple Holding Registers', value: 3 },
  { label: '04 - Read Input Registers', value: 4 },
  { label: '05 - Write Single Coil', value: 5 },
  { label: '06 - Write Single Holding Register', value: 6 },
  { label: '15 - Write Multiple Coils', value: 15 },
  { label: '16 - Write Multiple Holding Registers', value: 16 },
];

export const MODIFIER_TYPE_OPTIONS = [
  { label: '乘数 (Multiplier)', value: MODIFIER_TYPE.MULTIPLIER },
  { label: '除数 (Divider)', value: MODIFIER_TYPE.DIVIDER },
];

export const COLOR_MAP = {
  [DATA_TYPE.STRING]: 'blue',
  [DATA_TYPE.BITS]: 'green',
  [DATA_TYPE.INT8]: 'orange',
  [DATA_TYPE.INT16]: 'purple',
  [DATA_TYPE.INT32]: 'cyan',
  [DATA_TYPE.INT64]: 'magenta',
  [DATA_TYPE.UINT8]: 'red',
  [DATA_TYPE.UINT16]: 'volcano',
  [DATA_TYPE.UINT32]: 'gold',
  [DATA_TYPE.UINT64]: 'lime',
  [DATA_TYPE.FLOAT16]: 'geekblue',
  [DATA_TYPE.FLOAT32]: 'purple',
  [DATA_TYPE.FLOAT64]: 'magenta',
};

export interface ModbusAttribute {
  tag: string;
  type: DATA_TYPE;
  functionCode: number;
  objectsCount: number;
  address: number | string;
  bitTargetType?: string; // 仅用于 bits 类型
  bit?: number | string; // 仅用于 bits 类型
  value?: string | number; // 值字段，用于服务器配置
  divider?: number;
  multiplier?: number;
  reportStrategy?: {
    type: REPORT_TYPE;
    reportPeriod?: number;
  };
}

export interface SecurityConfig {
  certfile: string;
  keyfile: string;
  password: string;
  server_hostname: string;
}

export interface ModbusSlave {
  host: string;
  port: number | string;
  type: MODBUS_TYPE;
  method: MODBUS_METHOD;
  timeout: number;
  byteOrder: BYTE_ORDER;
  wordOrder: WORD_ORDER;
  retries: boolean;
  retryOnEmpty: boolean;
  retryOnInvalid: boolean;
  pollPeriod: number;
  unitId: number;
  deviceName: string;
  deviceType: string;
  connectAttemptTimeMs: number;
  connectAttemptCount: number;
  waitAfterFailedAttemptsMs: number;
  // 串口相关字段
  baudrate?: SERIAL_BAUDRATE;
  bytesize?: SERIAL_BYTESIZE;
  stopbits?: number;
  parity?: SERIAL_PARITY;
  strict?: boolean;
  security?: SecurityConfig;
  reportStrategy: {
    type: REPORT_TYPE;
    reportPeriod?: number;
  };
  attributes: ModbusAttribute[];
  timeseries: ModbusAttribute[];
  attributeUpdates: ModbusAttribute[];
  rpc: ModbusAttribute[];
}

export interface ModbusMaster {
  slaves: ModbusSlave[];
}

export interface ModbusServerValue {
  address: number;
  type: DATA_TYPE;
  tag: string;
  objectsCount: number;
  value: string | number;
  functionCode?: number;
}

export interface ModbusServer {
  type: MODBUS_TYPE;
  host: string;
  port: number | string;
  method: MODBUS_METHOD;
  deviceName: string;
  deviceType: string;
  pollPeriod: number;
  sendDataToThingsBoard: boolean;
  byteOrder: BYTE_ORDER;
  wordOrder: WORD_ORDER;
  unitId: number;
  // 高级配置字段
  timeout?: number;
  connectAttemptTimeMs?: number;
  connectAttemptCount?: number;
  waitAfterFailedAttemptsMs?: number;
  retries?: boolean;
  retryOnEmpty?: boolean;
  retryOnInvalid?: boolean;
  // 串口配置字段
  baudrate?: SERIAL_BAUDRATE;
  bytesize?: SERIAL_BYTESIZE;
  stopbits?: number;
  parity?: SERIAL_PARITY;
  strict?: boolean;
  // 上报策略
  reportStrategy?: {
    type: REPORT_TYPE;
    reportPeriod?: number;
  };
  // 安全配置
  security?: SecurityConfig;
  // 设备身份信息
  identity: {
    vendorName: string;
    productCode: string;
    vendorUrl: string;
    productName: string;
    modelName: string;
  };
  values: {
    holding_registers: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    coils_initializer: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    input_registers: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
    discrete_inputs: {
      attributes: ModbusServerValue[];
      timeseries: ModbusServerValue[];
      attributeUpdates: ModbusServerValue[];
      rpc: ModbusServerValue[];
    };
  };
}

export interface ModbusGatewayConfig {
  master?: ModbusMaster;
  slave?: ModbusServer;

  configVersion: string;
  enableRemoteLogging: boolean;
  id: string;
  logLevel: string;
  name: string;
}
export function isIntegerType(type: DATA_TYPE) {
  return [
    DATA_TYPE.INT8,
    DATA_TYPE.INT16,
    DATA_TYPE.INT32,
    DATA_TYPE.INT64,
    DATA_TYPE.UINT8,
    DATA_TYPE.UINT16,
    DATA_TYPE.UINT32,
    DATA_TYPE.UINT64,
    DATA_TYPE.FLOAT16,
    DATA_TYPE.FLOAT32,
    DATA_TYPE.FLOAT64,
  ].includes(type);
}
