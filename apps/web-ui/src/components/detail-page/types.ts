import type { EventType } from '#/api/tb/event';
import type { EntityId } from '#/types/tb';

export type DetailPageState = 'error' | 'loading' | 'ready';

export interface DetailStatus {
  text: string;
  variant?: 'destructive' | 'secondary' | 'success' | 'warning';
}

export interface DetailTag {
  icon?: string;
  key: string;
  label?: string;
  value?: boolean | null | number | string;
}

interface DetailVisibility {
  /** Any matching role grants access. Omit to allow all roles; [] allows none. */
  auth?: string[];
  disabled?: boolean;
  visible?: boolean;
}

export interface DetailAction extends DetailVisibility {
  danger?: boolean;
  group?: string;
  icon?: string;
  key: string;
  label: string;
  loading?: boolean;
}

export interface DetailPrimaryAction {
  icon?: string;
  items: DetailAction[];
  label: string;
}

export type DetailTabKey =
  | 'alarmRules'
  | 'alarms'
  | 'api'
  | 'apiKeys'
  | 'attributes'
  | 'auditLogs'
  | 'calculatedFields'
  | 'details'
  | 'events'
  | 'relations'
  | 'telemetry';

/** Select a built-in tab; use an object when visibility or permissions are needed. */
export type DetailTab =
  | DetailTabKey
  | (DetailVisibility & { key: DetailTabKey });

export interface DetailPageProps {
  /** Disables page actions while a business operation is pending. */
  actionsDisabled?: boolean;
  entityId?: EntityId;
  errorMessage?: string;
  eventTypes?: EventType[];
  /** Page type displayed beside the entity name, e.g. Device details. */
  pageTitle?: string;
  primaryAction?: DetailPrimaryAction;
  secondaryActions?: DetailAction[];
  showBack?: boolean;
  state?: DetailPageState;
  status?: DetailStatus;
  tabs?: DetailTab[];
  tags?: DetailTag[];
  title?: string;
}
