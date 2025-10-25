export type CmdOption = { label: string; value: string };

export const COMMAND_OPTIONS: CmdOption[] = [
  { label: 'Ping', value: 'gateway_ping' },
  { label: 'Stats', value: 'gateway_stats' },
  { label: 'Devices', value: 'gateway_devices' },
  { label: 'Update', value: 'gateway_update' },
  { label: 'Version', value: 'gateway_version' },
  { label: 'Restart', value: 'gateway_restart' },
  { label: 'Reboot', value: 'gateway_reboot' },
];
