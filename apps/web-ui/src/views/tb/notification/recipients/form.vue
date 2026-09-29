<script lang="ts" setup>
import type {
  NotificationTarget,
  NotificationTargetConfig,
  NotificationUsersFilter,
  SlackConversation,
  SlackConversationType,
} from '#/api/tb/notification-target';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal, VbenSegmented, VbenSelect } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getNotificationTargetById,
  getSlackConversations,
  saveNotificationTarget,
} from '#/api/tb/notification-target';
import { getUsers } from '#/api/tb/user';
import {
  Authority,
  NotificationTargetConfigType,
  notificationTargetConfigTypeLabel,
  NotificationTargetType,
  notificationTargetTypeLabel,
} from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

interface RecipientFormValues {
  name: string;
  type: NotificationTargetType;
  usersFilterType: NotificationTargetConfigType;
  filterByTenants: 'tenantProfiles' | 'tenants';
  tenantsIds: string[];
  tenantProfilesIds: string[];
  customerId: string;
  usersIds: string[];
  conversationType: SlackConversationType;
  conversation: string;
  useOldApi: boolean;
  webhookUrl: string;
  channelName: string;
  description: string;
}

const emit = defineEmits<{ success: [target: NotificationTarget] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const record = ref<NotificationTarget | null>(null);
const generalOnly = ref(false);
const slackConversations = ref<SlackConversation[]>([]);

const { PLATFORM_USERS, SLACK, MICROSOFT_TEAMS } = NotificationTargetType;
const { ALL_USERS, CUSTOMER_USERS, TENANT_ADMINISTRATORS, USER_LIST } =
  NotificationTargetConfigType;

const typeOptions = computed(() =>
  [
    { value: PLATFORM_USERS, icon: 'lucide:users' },
    { value: SLACK, icon: 'lucide:slack' },
    { value: MICROSOFT_TEAMS, icon: 'lucide:video' },
  ].map((item) => ({
    ...item,
    label: notificationTargetTypeLabel(item.value),
  })),
);

const filterTypeOptions = computed(() =>
  (isSysAdmin
    ? [
        ALL_USERS,
        TENANT_ADMINISTRATORS,
        NotificationTargetConfigType.AFFECTED_TENANT_ADMINISTRATORS,
        NotificationTargetConfigType.SYSTEM_ADMINISTRATORS,
      ]
    : [
        ALL_USERS,
        TENANT_ADMINISTRATORS,
        CUSTOMER_USERS,
        USER_LIST,
        NotificationTargetConfigType.ORIGINATOR_ENTITY_OWNER_USERS,
        NotificationTargetConfigType.AFFECTED_USER,
      ]
  )
    .filter(
      (value) =>
        !generalOnly.value ||
        ![
          NotificationTargetConfigType.AFFECTED_TENANT_ADMINISTRATORS,
          NotificationTargetConfigType.AFFECTED_USER,
          NotificationTargetConfigType.ORIGINATOR_ENTITY_OWNER_USERS,
        ].includes(value),
    )
    .map((value) => ({
      label: notificationTargetConfigTypeLabel(value),
      value,
    })),
);

async function loadUserOptions() {
  if (isSysAdmin) return [];
  const options = await loadAllPages((pageLink) =>
    getUsers({ ...pageLink, sortOrder: 'ASC', sortProperty: 'email' }),
  );
  return options.flatMap((item) =>
    item.id?.id ? [{ label: item.email, value: item.id.id }] : [],
  );
}

async function loadSlackConversationOptions(params: {
  type: SlackConversationType;
}) {
  const formValues = await formApi.getValues();
  if (formValues.type !== SLACK || formValues.conversationType !== params.type)
    return [];
  const conversations = await getSlackConversations(params.type);
  const currentValues = await formApi.getValues();
  if (
    currentValues.type !== SLACK ||
    currentValues.conversationType !== params.type
  )
    return [];
  // 编辑时保留已保存的会话，即使它暂时未出现在集成查询结果中。
  const saved = record.value?.configuration;
  if (
    saved?.conversationType === params.type &&
    saved.conversation &&
    !conversations.some((item) => item.id === saved.conversation?.id)
  ) {
    conversations.unshift(saved.conversation);
  }
  slackConversations.value = conversations;
  return conversations.map((item) => ({
    label: item.title || item.wholeName || item.name,
    value: item.id,
  }));
}

const [Form, formApi] = useVbenForm<RecipientFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('notification.features.recipient.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('notification.features.recipient.fields.name'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t(
            'notification.features.recipient.validation.nameRequired',
          ),
        }),
    },
    {
      component: 'VbenInput',
      defaultValue: PLATFORM_USERS,
      fieldName: 'type',
      label: $t('notification.features.recipient.fields.type'),
      formItemClass: 'sm:col-span-2',
      rules: z.enum(NotificationTargetType),
    },
    {
      component: 'VbenSelect',
      componentProps: () => ({ options: filterTypeOptions.value }),
      defaultValue: ALL_USERS,
      fieldName: 'usersFilterType',
      label: $t('notification.features.recipient.fields.filterType'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === PLATFORM_USERS,
          rules: z
            .enum(NotificationTargetConfigType)
            .refine(
              (value) =>
                filterTypeOptions.value.some((item) => item.value === value),
              {
                message: $t(
                  'notification.features.recipient.validation.filterTypeRequired',
                ),
              },
            ),
        }),
      },
    },
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          {
            label: $t('notification.features.recipient.form.byTenants'),
            value: 'tenants',
          },
          {
            label: $t('notification.features.recipient.form.byTenantProfiles'),
            value: 'tenantProfiles',
          },
        ],
      },
      defaultValue: 'tenants',
      fieldName: 'filterByTenants',
      label: $t('notification.features.recipient.fields.filterBy'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType'],
        resolve: ({ values: formValues }) => ({
          if:
            isSysAdmin &&
            formValues.type === PLATFORM_USERS &&
            formValues.usersFilterType === TENANT_ADMINISTRATORS,
        }),
      },
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'TENANT',
        params: { sortProperty: 'title', sortOrder: 'ASC' },
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.recipient.form.tenantsPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'tenantsIds',
      label: $t('notification.features.recipient.fields.tenants'),
      description: $t('notification.features.recipient.form.tenantsHint'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType', 'filterByTenants'],
        resolve: ({ values: formValues }) => ({
          if:
            isSysAdmin &&
            formValues.type === PLATFORM_USERS &&
            formValues.usersFilterType === TENANT_ADMINISTRATORS &&
            formValues.filterByTenants === 'tenants',
        }),
      },
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'TENANT_PROFILE',
        params: { sortProperty: 'name', sortOrder: 'ASC' },
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.recipient.form.tenantProfilesPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'tenantProfilesIds',
      label: $t('notification.features.recipient.fields.tenantProfiles'),
      description: $t(
        'notification.features.recipient.form.tenantProfilesHint',
      ),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType', 'filterByTenants'],
        resolve: ({ values: formValues }) => ({
          if:
            isSysAdmin &&
            formValues.type === PLATFORM_USERS &&
            formValues.usersFilterType === TENANT_ADMINISTRATORS &&
            formValues.filterByTenants === 'tenantProfiles',
        }),
      },
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'CUSTOMER',
        params: { sortProperty: 'title', sortOrder: 'ASC' },
        showSearch: true,
        placeholder: $t(
          'notification.features.recipient.form.customerPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'customerId',
      label: $t('notification.features.recipient.fields.customer'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType'],
        resolve: ({ values: formValues }) => ({
          if:
            !isSysAdmin &&
            formValues.type === PLATFORM_USERS &&
            formValues.usersFilterType === CUSTOMER_USERS,
        }),
      },
      rules: z.string().min(1, {
        message: $t(
          'notification.features.recipient.validation.customerRequired',
        ),
      }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadUserOptions,
        immediate: false,
        mode: 'multiple',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t(
          'notification.features.recipient.form.usersPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'usersIds',
      label: $t('notification.features.recipient.fields.users'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'usersFilterType'],
        resolve: ({ values: formValues }) => ({
          if:
            !isSysAdmin &&
            formValues.type === PLATFORM_USERS &&
            formValues.usersFilterType === USER_LIST,
        }),
      },
      rules: z.array(z.string()).min(1, {
        message: $t('notification.features.recipient.validation.usersRequired'),
      }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: [
          {
            label: $t(
              'notification.features.recipient.conversationType.PUBLIC_CHANNEL',
            ),
            value: 'PUBLIC_CHANNEL',
          },
          {
            label: $t(
              'notification.features.recipient.conversationType.PRIVATE_CHANNEL',
            ),
            value: 'PRIVATE_CHANNEL',
          },
          {
            label: $t(
              'notification.features.recipient.conversationType.DIRECT',
            ),
            value: 'DIRECT',
          },
        ],
        onChange: () => {
          slackConversations.value = [];
          formApi.setFieldValue('conversation', '');
        },
      },
      defaultValue: 'PUBLIC_CHANNEL',
      fieldName: 'conversationType',
      label: $t('notification.features.recipient.fields.conversationType'),
      rules: z.enum(['PUBLIC_CHANNEL', 'PRIVATE_CHANNEL', 'DIRECT']),
      dependencies: {
        triggerFields: ['type'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === SLACK,
        }),
      },
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadSlackConversationOptions,
        immediate: false,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t(
          'notification.features.recipient.form.conversationPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'conversation',
      label: $t('notification.features.recipient.fields.conversation'),
      description: $t('notification.features.recipient.form.slackHint'),
      dependencies: {
        triggerFields: ['type', 'conversationType'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === SLACK,
          componentProps: { params: { type: formValues.conversationType } },
        }),
      },
      rules: z.string().min(1, {
        message: $t(
          'notification.features.recipient.validation.conversationRequired',
        ),
      }),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.recipient.fields.useOldApi'),
        description: $t('notification.features.recipient.form.useOldApiHint'),
      },
      defaultValue: false,
      fieldName: 'useOldApi',
      label: '',
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === MICROSOFT_TEAMS,
        }),
      },
    },
    {
      component: 'VbenInput',
      componentProps: { placeholder: 'https://...', autocomplete: 'off' },
      defaultValue: '',
      fieldName: 'webhookUrl',
      label: $t('notification.features.recipient.fields.webhookUrl'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type', 'useOldApi'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === MICROSOFT_TEAMS,
          rules: z
            .string()
            .trim()
            .min(1, {
              message: $t(
                'notification.features.recipient.validation.webhookUrlRequired',
              ),
            })
            .url({
              message: $t(
                'notification.features.recipient.validation.urlInvalid',
              ),
            })
            .regex(/^https?:\/\//i, {
              message: $t(
                'notification.features.recipient.validation.urlInvalid',
              ),
            }),
        }),
      },
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t(
          'notification.features.recipient.form.channelNamePlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'channelName',
      label: $t('notification.features.recipient.fields.channelName'),
      formItemClass: 'sm:col-span-2',
      dependencies: {
        triggerFields: ['type'],
        resolve: ({ values: formValues }) => ({
          if: formValues.type === MICROSOFT_TEAMS,
        }),
      },
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t(
            'notification.features.recipient.validation.channelNameRequired',
          ),
        }),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t(
          'notification.features.recipient.form.descriptionPlaceholder',
        ),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('notification.features.recipient.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

function handleFilterByTenantsChange(value: string | undefined) {
  if (
    (value !== 'tenants' && value !== 'tenantProfiles') ||
    value === formApi.form.values.filterByTenants
  )
    return;

  // 仅在用户切换过滤方式时清空，编辑回显的 setValues 不触发此事件。
  return formApi.setValues({
    filterByTenants: value,
    tenantsIds: [],
    tenantProfilesIds: [],
  });
}

function toRecipientPayload(
  formValues: RecipientFormValues,
  record: NotificationTarget | null,
  conversations: SlackConversation[],
  isSysAdmin: boolean,
): NotificationTarget | null {
  const configuration: NotificationTargetConfig = {
    description: formValues.description.trim(),
    type: formValues.type,
  };
  if (formValues.type === PLATFORM_USERS) {
    const usersFilter: NotificationUsersFilter = {
      type: formValues.usersFilterType,
    };
    switch (formValues.usersFilterType) {
      case CUSTOMER_USERS: {
        usersFilter.customerId = formValues.customerId;
        break;
      }
      case TENANT_ADMINISTRATORS: {
        if (isSysAdmin) {
          if (formValues.filterByTenants === 'tenantProfiles') {
            usersFilter.tenantProfilesIds = formValues.tenantProfilesIds;
          } else {
            usersFilter.tenantsIds = formValues.tenantsIds;
          }
        }
        break;
      }
      case USER_LIST: {
        usersFilter.usersIds = formValues.usersIds;
        break;
      }
    }
    configuration.usersFilter = usersFilter;
  } else if (formValues.type === SLACK) {
    const conversation = conversations.find(
      (item) => item.id === formValues.conversation,
    );
    if (!conversation) return null;
    configuration.conversationType = formValues.conversationType;
    configuration.conversation = conversation;
  } else if (formValues.type === MICROSOFT_TEAMS) {
    configuration.channelName = formValues.channelName.trim();
    configuration.useOldApi = formValues.useOldApi;
    configuration.webhookUrl = formValues.webhookUrl.trim();
  }

  return {
    ...record,
    configuration,
    name: formValues.name.trim(),
  };
}

const [Modal, modalApi] = useVbenModal<{
  notificationTargetId?: string;
  generalOnly?: boolean;
}>({
  async onConfirm() {
    if (modalState.value.submitting) return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const formValues = await formApi.getValues();

      const notificationTarget = toRecipientPayload(
        formValues,
        record.value,
        slackConversations.value,
        isSysAdmin,
      );
      if (!notificationTarget) {
        message.error(
          $t('notification.features.recipient.validation.conversationRequired'),
        );
        return;
      }

      const savedTarget = await saveNotificationTarget(notificationTarget);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success', savedTarget);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { notificationTargetId } = modalApi.getData() ?? {};
    generalOnly.value = modalApi.getData()?.generalOnly ?? false;
    record.value = null;
    slackConversations.value = [];
    await formApi.reset();
    modalApi.setState({
      title: notificationTargetId
        ? $t('notification.features.recipient.actions.edit')
        : $t('notification.features.recipient.actions.create'),
    });
    modalApi.lock();
    try {
      if (notificationTargetId) {
        const notificationTarget =
          await getNotificationTargetById(notificationTargetId);
        record.value = notificationTarget;
        const configuration = notificationTarget.configuration;
        const usersFilter = configuration?.usersFilter;
        if (configuration?.conversation)
          slackConversations.value = [configuration.conversation];
        await formApi.setValues({
          name: notificationTarget.name ?? '',
          type: configuration?.type ?? PLATFORM_USERS,
          usersFilterType: usersFilter?.type ?? ALL_USERS,
          filterByTenants: Array.isArray(usersFilter?.tenantProfilesIds)
            ? 'tenantProfiles'
            : 'tenants',
          tenantsIds: usersFilter?.tenantsIds ?? [],
          tenantProfilesIds: usersFilter?.tenantProfilesIds ?? [],
          customerId: usersFilter?.customerId ?? '',
          usersIds: usersFilter?.usersIds ?? [],
          conversationType: configuration?.conversationType ?? 'PUBLIC_CHANNEL',
          conversation: configuration?.conversation?.id ?? '',
          useOldApi:
            configuration?.useOldApi ?? configuration?.type === MICROSOFT_TEAMS,
          webhookUrl: configuration?.webhookUrl ?? '',
          channelName: configuration?.channelName ?? '',
          description: configuration?.description ?? '',
        });
        // 仅回显当前过滤方式需要的选项，隐藏字段不请求其他权限下的接口。
        if (configuration?.type === PLATFORM_USERS) {
          if (!isSysAdmin && usersFilter?.type === USER_LIST) {
            await formApi.updateSchema([
              {
                fieldName: 'usersIds',
                componentProps: { options: await loadUserOptions() },
              },
            ]);
          }
        } else if (
          configuration?.type === SLACK &&
          configuration.conversation
        ) {
          await formApi.updateSchema([
            {
              fieldName: 'conversation',
              componentProps: {
                options: [
                  {
                    label:
                      configuration.conversation.title ||
                      configuration.conversation.name,
                    value: configuration.conversation.id,
                  },
                ],
              },
            },
          ]);
        }
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form>
      <template #filterByTenants="slotProps">
        <VbenSelect
          v-bind="{
            ...slotProps.componentProps,
            'onUpdate:modelValue': handleFilterByTenantsChange,
          }"
        />
      </template>
      <template #type="slotProps">
        <VbenSegmented
          v-bind="{
            ...slotProps.componentProps,
            'onUpdate:modelValue': (value: string | undefined) => {
              if (value)
                slotProps.componentProps['onUpdate:modelValue']?.(
                  value as NotificationTargetType,
                );
            },
          }"
          :tabs="typeOptions"
          variant="navigation"
          class="!w-full [&_[role=tab]]:!min-w-0 [&_[role=tab]]:!px-2 [&_[role=tab]]:!text-sm"
        />
      </template>
    </Form>
  </Modal>
</template>
