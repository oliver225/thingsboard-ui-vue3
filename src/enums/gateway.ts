export enum CONNECTOR_KEY_TYPE {
  ACTIVE = 'active_connectors',
  INACTIVE = 'inactive_connectors',
}

export enum REPORT_TYPE {
  ON_RECEIVED = 'ON_RECEIVED',
  ON_VALUE_CHANGE_OR_REPORT_PERIOD = 'ON_VALUE_CHANGE_OR_REPORT_PERIOD',
  ON_REPORT_PERIOD = 'ON_REPORT_PERIOD',
  ON_VALUE_CHANGE = 'ON_VALUE_CHANGE',
}

/**
 * Report strategy Select
 */
export const REPORT_TYPE_OPTIONS = [
  { label: 'On received', value: REPORT_TYPE.ON_RECEIVED },
  { label: 'On value change or report period', value: REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD },
  { label: 'On report period', value: REPORT_TYPE.ON_REPORT_PERIOD },
  { label: 'On value change', value: REPORT_TYPE.ON_VALUE_CHANGE },
];

export const SHOW_REPORT_PERIOD = [REPORT_TYPE.ON_VALUE_CHANGE_OR_REPORT_PERIOD, REPORT_TYPE.ON_REPORT_PERIOD];
