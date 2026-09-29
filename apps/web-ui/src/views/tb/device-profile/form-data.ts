import type DetailsForm from './components/details-form.vue';
import type ProvisionForm from './components/provision-form.vue';
import type TransportForm from './components/transport-form.vue';

import type { DeviceProfile } from '#/api/tb/device-profile';

import { EntityType } from '#/enums';

interface DeviceProfileFormValues {
  details: Awaited<ReturnType<InstanceType<typeof DetailsForm>['getValues']>>;
  transport: Awaited<
    ReturnType<InstanceType<typeof TransportForm>['getValues']>
  >;
  provision: Awaited<
    ReturnType<InstanceType<typeof ProvisionForm>['getValues']>
  >;
}

function toEntityId<T extends EntityType>(entityType: T, id?: null | string) {
  return id ? { entityType, id } : null;
}

export function toDeviceProfilePayload(
  formValues: DeviceProfileFormValues,
  record: DeviceProfile | null,
): DeviceProfile {
  const { details, transport, provision } = formValues;
  const provisionConfiguration = { ...provision.provisionConfiguration };
  const provisionDeviceKey = provisionConfiguration.provisionDeviceKey;
  delete provisionConfiguration.provisionDeviceKey;

  return {
    ...record,
    name: details.name.trim(),
    description: details.description ?? '',
    image: details.image || null,
    defaultDashboardId: toEntityId(
      EntityType.DASHBOARD,
      details.defaultDashboardId,
    ),
    defaultEdgeRuleChainId: toEntityId(
      EntityType.RULE_CHAIN,
      details.defaultEdgeRuleChainId,
    ),
    defaultQueueName: details.defaultQueueName || null,
    defaultRuleChainId: toEntityId(
      EntityType.RULE_CHAIN,
      details.defaultRuleChainId,
    ),
    profileData: {
      ...record?.profileData,
      configuration: record?.profileData?.configuration ?? {
        type: 'DEFAULT',
      },
      provisionConfiguration,
      transportConfiguration: transport.transportConfiguration,
    },
    provisionDeviceKey: provisionDeviceKey || null,
    provisionType: provisionConfiguration.type,
    transportType: transport.transportType,
    type: record?.type ?? 'DEFAULT',
  };
}
