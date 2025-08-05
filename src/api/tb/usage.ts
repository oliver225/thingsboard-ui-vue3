import { defHttp } from '/@/utils/http/axios';

export interface Usage extends Recordable {
  sms: number;
  emails: number;
  devices: number;
  assets: number;
  alarms: number;
  users: number;
  customers: number;
  dashboards: number;
  jsExecutions: number;
  transportMessages: number;

  maxSms: number;
  maxEmails: number;
  maxDevices: number;
  maxAssets: number;
  maxAlarms: number;
  maxUsers: number;
  maxCustomers: number;
  maxDashboards: number;
  maxJsExecutions: number;
  maxTransportMessages: number;
}

export function getUsage() {
  return defHttp.get<Usage>({
    url: '/api/usage',
  });
}
