import { $t } from '#/locales';

export const allowedEntityFields = [
  'createdTime',
  'name',
  'type',
  'firstName',
  'lastName',
  'email',
  'title',
  'country',
  'state',
  'city',
  'address',
  'address2',
  'zip',
  'phone',
  'label',
  'id',
  'additionalInfo',
] as const;

export function getEntityFieldOptions() {
  return allowedEntityFields.map((value) => ({
    value,
    label: $t(
      `rule-chain.nodeAction.${value === 'type' ? 'profileName' : value}`,
    ),
  }));
}
