<script lang="ts" setup>
import type { MobileApp, MobileAppBundleInfo } from '#/api/tb/mobile-app';

import { ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob } from '@vben/utils';

import { Input } from '@vben-core/shadcn-ui';

import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getMobileApp, getMobileAppBundleInfo } from '#/api/tb/mobile-app';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

const configurationFileName = 'configs.json';
const cloneCommand =
  'git clone -b master https://github.com/thingsboard/flutter_thingsboard_app.git';
const runCommand = `flutter run --dart-define-from-file ${configurationFileName}`;

const record = ref<MobileAppBundleInfo | null>(null);
const androidApp = ref<MobileApp>();
const iosApp = ref<MobileApp>();
const { copy } = useClipboard({ legacy: true });

function parseServerUrl(endpoint: string): undefined | URL {
  try {
    const url = new URL(endpoint.trim());
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    ) {
      return url;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function toMobileConfigurationPayload(
  serverUrl: URL,
  bundle: MobileAppBundleInfo,
  androidApplication?: MobileApp,
  iosApplication?: MobileApp,
): Record<string, string> {
  return {
    thingsboardApiEndpoint: serverUrl.origin,
    appLinksUrlHost: serverUrl.host,
    appLinksUrlScheme: serverUrl.protocol.slice(0, -1),
    ...(androidApplication
      ? {
          androidApplicationId: androidApplication.pkgName,
          androidApplicationName:
            androidApplication.title?.trim() || bundle.title,
          thingsboardOAuth2CallbackUrlScheme: `${androidApplication.pkgName}.auth`,
          thingsboardAndroidAppSecret: androidApplication.appSecret,
        }
      : {}),
    ...(iosApplication
      ? {
          iosApplicationId: iosApplication.pkgName,
          iosApplicationName: iosApplication.title?.trim() || bundle.title,
          thingsboardIosAppSecret: iosApplication.appSecret,
        }
      : {}),
  };
}

async function handleCopyCommand(command: string) {
  try {
    await copy(command);
    message.success($t('mobile-center.features.bundle.configuration.copied'));
  } catch {
    message.error($t('mobile-center.features.bundle.configuration.copyFailed'));
  }
}

async function handleDownload() {
  const { valid } = await formApi.validate();
  if (!valid || !record.value) return;
  const values = await formApi.getValues();
  const serverUrl = parseServerUrl(values.endpoint);
  if (!serverUrl) return;
  const configuration = toMobileConfigurationPayload(
    serverUrl,
    record.value,
    androidApp.value,
    iosApp.value,
  );
  downloadFileFromBlob({
    fileName: configurationFileName,
    source: new Blob([JSON.stringify(configuration, null, 2)], {
      type: 'application/json',
    }),
  });
}

const [Form, formApi] = useVbenForm<{ endpoint: string }>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0',
  },
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'https://thingsboard.example.com',
        autocomplete: 'url',
      },
      defaultValue: '',
      fieldName: 'endpoint',
      label: $t('mobile-center.features.bundle.configuration.endpoint'),
      description: $t(
        'mobile-center.features.bundle.configuration.endpointHint',
      ),
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t(
            'mobile-center.features.bundle.configuration.endpointRequired',
          ),
        })
        .refine((value) => !!parseServerUrl(value), {
          message: $t(
            'mobile-center.features.bundle.configuration.endpointInvalid',
          ),
        }),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ mobileAppBundleId?: string }>({
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { mobileAppBundleId } = modalApi.getData() ?? {};
    record.value = null;
    androidApp.value = undefined;
    iosApp.value = undefined;
    modalApi.lock();
    try {
      await formApi.reset({ values: { endpoint: window.location.origin } });
      if (!mobileAppBundleId) {
        modalApi.close();
        return;
      }
      const bundle = await getMobileAppBundleInfo(mobileAppBundleId);
      const [android, ios] = await Promise.all([
        bundle.androidAppId ? getMobileApp(bundle.androidAppId.id) : undefined,
        bundle.iosAppId ? getMobileApp(bundle.iosAppId.id) : undefined,
      ]);
      androidApp.value = android;
      iosApp.value = ios;
      record.value = bundle;
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    :title="$t('mobile-center.features.bundle.actions.configure')"
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :show-confirm-button="false"
    :cancel-text="$t('tb.common.close')"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          icon="lucide:smartphone"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ $t('mobile-center.features.bundle.actions.configure') }}
      </span>
    </template>
    <div class="space-y-4">
      <div class="flex min-w-0 items-start gap-3">
        <div
          class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
        >
          <IconifyIcon
            icon="lucide:package"
            class="size-5"
            aria-hidden="true"
          />
        </div>
        <div class="min-w-0">
          <p class="break-words text-sm font-semibold">{{ record?.title }}</p>
          <p class="text-muted-foreground mt-1 text-sm leading-6">
            {{ $t('mobile-center.features.bundle.configuration.description') }}
          </p>
        </div>
      </div>

      <FormSection
        :title="$t('mobile-center.features.bundle.configuration.prepareTitle')"
        :collapsible="false"
      >
        <div
          class="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
        >
          <p class="text-muted-foreground flex-1 text-sm leading-6">
            {{
              $t(
                'mobile-center.features.bundle.configuration.prepareDescription',
              )
            }}
          </p>
          <VbenButton
            as="a"
            href="https://docs.flutter.dev/get-started/install"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            class="shrink-0 gap-2 !cursor-pointer"
          >
            <IconifyIcon
              icon="lucide:external-link"
              class="size-4"
              aria-hidden="true"
            />
            {{
              $t('mobile-center.features.bundle.configuration.documentation')
            }}
          </VbenButton>
        </div>
      </FormSection>

      <FormSection
        :title="$t('mobile-center.features.bundle.configuration.sourceTitle')"
        :collapsible="false"
      >
        <p class="text-muted-foreground mb-3 text-sm leading-6">
          {{
            $t('mobile-center.features.bundle.configuration.sourceDescription')
          }}
        </p>
        <div class="flex min-w-0 items-center gap-2">
          <Input
            :model-value="cloneCommand"
            readonly
            class="bg-muted/50 min-w-0 flex-1 font-mono text-xs"
            :aria-label="
              $t('mobile-center.features.bundle.configuration.sourceTitle')
            "
          />
          <VbenButton
            type="button"
            variant="outline"
            size="icon"
            class="size-10 shrink-0"
            :title="
              $t('mobile-center.features.bundle.configuration.copySource')
            "
            :aria-label="
              $t('mobile-center.features.bundle.configuration.copySource')
            "
            @click="handleCopyCommand(cloneCommand)"
          >
            <IconifyIcon icon="lucide:copy" class="size-4" aria-hidden="true" />
          </VbenButton>
        </div>
      </FormSection>

      <FormSection
        :title="$t('mobile-center.features.bundle.configuration.settingsTitle')"
        :collapsible="false"
      >
        <p class="text-muted-foreground mb-4 text-sm leading-6">
          {{
            $t(
              'mobile-center.features.bundle.configuration.settingsDescription',
            )
          }}
        </p>
        <Form />
        <div
          class="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap gap-2 text-xs">
            <span
              v-if="androidApp"
              class="bg-muted text-foreground max-w-full break-all rounded-md border px-2 py-1"
              >Android · {{ androidApp.pkgName }}</span>
            <span
              v-if="iosApp"
              class="bg-muted text-foreground max-w-full break-all rounded-md border px-2 py-1"
              >iOS · {{ iosApp.pkgName }}</span>
            <span
              v-if="record && !androidApp && !iosApp"
              class="text-muted-foreground"
              >{{
                $t('mobile-center.features.bundle.configuration.noApplications')
              }}</span>
          </div>
          <VbenButton
            type="button"
            variant="outline"
            class="shrink-0 gap-2"
            :disabled="!record"
            @click="handleDownload"
          >
            <IconifyIcon
              icon="lucide:download"
              class="size-4"
              aria-hidden="true"
            />
            {{ $t('mobile-center.features.bundle.configuration.download') }}
          </VbenButton>
        </div>
      </FormSection>

      <FormSection
        :title="$t('mobile-center.features.bundle.configuration.runTitle')"
        :collapsible="false"
      >
        <p class="text-muted-foreground mb-3 text-sm leading-6">
          {{ $t('mobile-center.features.bundle.configuration.runDescription') }}
        </p>
        <div class="flex min-w-0 items-center gap-2">
          <Input
            :model-value="runCommand"
            readonly
            class="bg-muted/50 min-w-0 flex-1 font-mono text-xs"
            :aria-label="
              $t('mobile-center.features.bundle.configuration.runTitle')
            "
          />
          <VbenButton
            type="button"
            variant="outline"
            size="icon"
            class="size-10 shrink-0"
            :title="$t('mobile-center.features.bundle.configuration.copyRun')"
            :aria-label="
              $t('mobile-center.features.bundle.configuration.copyRun')
            "
            @click="handleCopyCommand(runCommand)"
          >
            <IconifyIcon icon="lucide:copy" class="size-4" aria-hidden="true" />
          </VbenButton>
        </div>
      </FormSection>
      <FormSection :collapsible="false">
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p class="text-muted-foreground">
            {{
              $t('mobile-center.features.bundle.configuration.moreInformation')
            }}
          </p>
          <VbenButton
            as="a"
            href="https://docs.flutter.dev/get-started/learn-flutter"
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            class="shrink-0 gap-2 !cursor-pointer"
          >
            {{
              $t('mobile-center.features.bundle.configuration.gettingStarted')
            }}
            <IconifyIcon
              icon="lucide:arrow-up-right"
              class="size-4"
              aria-hidden="true"
            />
          </VbenButton>
        </div>
      </FormSection>
    </div>
  </Modal>
</template>
