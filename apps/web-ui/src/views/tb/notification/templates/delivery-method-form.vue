<script lang="ts" setup>
import type { DeliveryMethodFormValues } from './template';

import type { VbenFormSchema } from '#/adapter/form';
import type { DeliveryMethodNotificationTemplate } from '#/api/tb/notification-template';

import { computed } from 'vue';

import { useAccess } from '@vben/access';

import { ColorPicker } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getDashboardById } from '#/api/tb/dashboard';
import {
  Authority,
  NotificationDeliveryMethod,
  NotificationType,
} from '#/enums';
import { $t } from '#/locales';

import {
  getDeliveryMethodFormValues,
  getDeliveryMethodTemplate,
} from './template';

const props = defineProps<{
  method: NotificationDeliveryMethod;
  template?: DeliveryMethodNotificationTemplate;
  notificationType: NotificationType;
}>();

const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const { WEB, MOBILE_APP, SMS, EMAIL, MICROSOFT_TEAMS } =
  NotificationDeliveryMethod;
const method = props.method;
const hasIcon = method === WEB || method === MOBILE_APP;
const hasAction = hasIcon || method === MICROSOFT_TEAMS;
const subjectMaxLengths: Partial<Record<NotificationDeliveryMethod, number>> = {
  [WEB]: 150,
  [MOBILE_APP]: 50,
  [EMAIL]: 250,
};
const bodyMaxLengths: Partial<Record<NotificationDeliveryMethod, number>> = {
  [WEB]: 250,
  [MOBILE_APP]: 150,
  [SMS]: 320,
};
const subjectMaxLength = subjectMaxLengths[method];
const bodyMaxLength = bodyMaxLengths[method];

const tapActionHint = computed(() =>
  method === MOBILE_APP &&
  [
    NotificationType.ALARM,
    NotificationType.ALARM_ASSIGNMENT,
    NotificationType.ALARM_COMMENT,
  ].includes(props.notificationType)
    ? $t('notification.features.template.form.tapActionHint')
    : '',
);

function requiredText() {
  return z
    .string()
    .trim()
    .min(1, {
      message: $t('notification.features.template.validation.required'),
    });
}

function limitedText(limit: number) {
  return requiredText().max(limit, {
    message: $t('notification.features.template.validation.maxLength', {
      count: limit,
    }),
  });
}

function getBodyRules() {
  if (method === EMAIL) {
    return requiredText().refine(
      (value) =>
        /<img\b/i.test(value) ||
        value.replaceAll(/<[^>]*>/g, '').replaceAll(/&nbsp;|&#160;|\s/gi, '')
          .length > 0,
      { message: $t('notification.features.template.validation.required') },
    );
  }
  return bodyMaxLength ? limitedText(bodyMaxLength) : requiredText();
}

const schema: VbenFormSchema<DeliveryMethodFormValues>[] = [
  ...([EMAIL, MICROSOFT_TEAMS, MOBILE_APP, WEB].includes(method)
    ? [
        {
          component: 'VbenInput' as const,
          fieldName: 'subject',
          label: $t('notification.features.template.fields.subject'),
          componentProps: { maxlength: subjectMaxLength },
          rules: subjectMaxLength ? limitedText(subjectMaxLength) : undefined,
          formItemClass: 'sm:col-span-2',
        },
      ]
    : []),
  {
    component: method === EMAIL ? 'RichEditor' : 'Textarea',
    componentProps:
      method === EMAIL
        ? { minHeight: 240, maxHeight: 400 }
        : { rows: 4, maxlength: bodyMaxLength, showCount: !!bodyMaxLength },
    fieldName: 'body',
    label: $t('notification.features.template.fields.body'),
    formItemClass: 'sm:col-span-2',
    rules: getBodyRules(),
  },
  ...(hasIcon
    ? [
        {
          component: 'TbSwitch' as const,
          componentProps: {
            title: $t('notification.features.template.fields.iconEnabled'),
          },
          fieldName: 'iconEnabled',
          formItemClass: 'sm:col-span-2',
          hideLabel: true,
        },
        {
          component: 'IconPicker' as const,
          fieldName: 'icon',
          label: $t('notification.features.template.fields.icon'),
          rules: requiredText(),
          dependencies: {
            triggerFields: ['iconEnabled'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if: formValues.iconEnabled,
            }),
          },
        },
        {
          component: ColorPicker,
          modelPropName: 'value',
          componentProps: {
            valueFormat: 'hex',
            format: 'hex',
            disabledAlpha: true,
            showText: true,
          },
          fieldName: 'color',
          label: $t('notification.features.template.fields.color'),
          dependencies: {
            triggerFields: ['iconEnabled'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if: formValues.iconEnabled,
            }),
          },
        },
      ]
    : []),
  ...(method === MICROSOFT_TEAMS
    ? [
        {
          component: ColorPicker,
          modelPropName: 'value',
          componentProps: {
            valueFormat: 'hex',
            format: 'hex',
            disabledAlpha: true,
            showText: true,
            allowClear: true,
          },
          fieldName: 'themeColor',
          label: $t('notification.features.template.fields.themeColor'),
          formItemClass: 'sm:col-span-2',
        },
      ]
    : []),
  ...(hasAction
    ? [
        {
          component: 'TbSwitch' as const,
          componentProps: {
            title:
              method === MOBILE_APP
                ? $t('notification.features.template.fields.tapAction')
                : $t('notification.features.template.fields.actionButton'),
          },
          fieldName: 'actionEnabled',
          hideLabel: true,
          formItemClass: 'sm:col-span-2',
        },
        ...(method === MOBILE_APP
          ? []
          : [
              {
                component: 'VbenInput' as const,
                componentProps: { maxlength: 50 },
                fieldName: 'text',
                label: $t('notification.features.template.fields.buttonText'),
                rules: limitedText(50),
                dependencies: {
                  triggerFields: ['actionEnabled'],
                  resolve: ({
                    values: formValues,
                  }: {
                    values: DeliveryMethodFormValues;
                  }) => ({ if: formValues.actionEnabled }),
                },
              },
            ]),
        {
          component: 'VbenSelect' as const,
          componentProps: {
            options: [
              {
                label: $t('notification.features.template.linkType.link'),
                value: 'LINK',
              },
              {
                label: $t('notification.features.template.linkType.dashboard'),
                value: 'DASHBOARD',
              },
            ],
          },
          fieldName: 'linkType',
          label: $t('notification.features.template.fields.linkType'),
          dependencies: {
            triggerFields: ['actionEnabled'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if: formValues.actionEnabled,
            }),
          },
        },
        {
          component: 'VbenInput' as const,
          componentProps: { maxlength: 300 },
          fieldName: 'link',
          label: $t('notification.features.template.fields.link'),
          formItemClass: 'sm:col-span-2',
          rules: limitedText(300),
          dependencies: {
            triggerFields: ['actionEnabled', 'linkType'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if: formValues.actionEnabled && formValues.linkType === 'LINK',
            }),
          },
        },
        {
          component: isSysAdmin
            ? ('VbenInput' as const)
            : ('EntityInput' as const),
          componentProps: isSysAdmin
            ? {}
            : {
                entityType: 'DASHBOARD',
                showSearch: true,
                optionFilterProp: 'label',
                onChange: () => formApi.setValues({ dashboardState: '' }),
              },
          fieldName: 'dashboardId',
          label: isSysAdmin
            ? $t('notification.features.template.fields.dashboardId')
            : $t('notification.features.template.fields.dashboard'),
          rules: requiredText(),
          dependencies: {
            triggerFields: ['actionEnabled', 'linkType'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if:
                formValues.actionEnabled && formValues.linkType === 'DASHBOARD',
            }),
          },
        },
        {
          component: isSysAdmin
            ? ('VbenInput' as const)
            : ('ApiSelect' as const),
          componentProps: () =>
            isSysAdmin
              ? {}
              : {
                  api: loadDashboardStateOptions,
                  params: { dashboardId: formApi.form.values.dashboardId },
                  allowClear: true,
                  showSearch: true,
                  optionFilterProp: 'label',
                },
          fieldName: 'dashboardState',
          label: $t('notification.features.template.fields.dashboardState'),
          dependencies: {
            triggerFields: ['actionEnabled', 'linkType'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if:
                formValues.actionEnabled && formValues.linkType === 'DASHBOARD',
            }),
          },
        },
        {
          component: 'TbSwitch' as const,
          componentProps: {
            title: $t(
              'notification.features.template.fields.setEntityIdInState',
            ),
          },
          fieldName: 'setEntityIdInState',
          hideLabel: true,
          formItemClass: 'sm:col-span-2',
          dependencies: {
            triggerFields: ['actionEnabled', 'linkType'],
            resolve: ({
              values: formValues,
            }: {
              values: DeliveryMethodFormValues;
            }) => ({
              if:
                formValues.actionEnabled && formValues.linkType === 'DASHBOARD',
            }),
          },
        },
      ]
    : []),
];

const initialValues = getDeliveryMethodFormValues(method, props.template);
const [Form, formApi] = useVbenForm<DeliveryMethodFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  scrollToFirstError: true,
  schema: schema.map((field) => ({
    ...field,
    defaultValue:
      initialValues[field.fieldName as keyof DeliveryMethodFormValues],
  })),
});

async function loadDashboardStateOptions({
  dashboardId,
}: {
  dashboardId?: string;
}) {
  if (!dashboardId) return [];
  const dashboard = await getDashboardById(dashboardId);
  return Object.keys(dashboard.configuration?.states ?? {}).map((value) => ({
    label: value,
    value,
  }));
}

async function getValues() {
  return getDeliveryMethodTemplate(method, {
    ...initialValues,
    ...(await formApi.getValues()),
  });
}

defineExpose({ method, getValues, validate: () => formApi.validate() });
</script>

<template>
  <div>
    <Form />
    <p
      v-if="tapActionHint"
      class="text-muted-foreground mb-0 text-xs leading-5"
    >
      {{ tapActionHint }}
    </p>
  </div>
</template>
