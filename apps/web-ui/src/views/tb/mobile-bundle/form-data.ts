import type { MobileAppBundleInfo } from '#/api/tb/mobile-app';

export interface MobileBundleBasicValues {
  title: string;
  description: string;
  androidAppId?: string;
  iosAppId?: string;
}

export interface MobileBundleOAuthValues {
  oauth2Enabled: boolean;
  oauth2ClientIds: string[];
}

interface SelectOption {
  value?: string;
  label?: string;
}

// 保留当前关联项，即使它已不在可选列表中，并避免重复选项。
export function mergeOptions(
  options: SelectOption[],
  selected: SelectOption[],
) {
  const merged = new Map<string, { label: string; value: string }>();
  for (const option of [...options, ...selected]) {
    if (option.value && !merged.has(option.value)) {
      merged.set(option.value, {
        value: option.value,
        label: option.label || option.value,
      });
    }
  }
  return [...merged.values()];
}

export function toMobileBundleFormValues(record?: MobileAppBundleInfo): {
  basic: MobileBundleBasicValues;
  oauth: MobileBundleOAuthValues;
} {
  return {
    basic: {
      title: record?.title ?? '',
      description: record?.description ?? '',
      androidAppId: record?.androidAppId?.id,
      iosAppId: record?.iosAppId?.id,
    },
    oauth: {
      oauth2Enabled: record?.oauth2Enabled ?? true,
      oauth2ClientIds:
        record?.oauth2ClientInfos?.flatMap((client) =>
          client.id ? [client.id.id] : [],
        ) ?? [],
    },
  };
}
