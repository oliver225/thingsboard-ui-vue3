<template>
  <div class="device-profile-alarm-form">
    <CollapseContainer
      v-for="(alarm, index) in alarmList"
      :key="index"
      class="border border-solid border-neutral-300 mb-2"
    >
      <template #title>
        {{ alarm.alarmType }}
      </template>
      <template #action>
        <Tooltip :title="t('tb.deviceProfile.alarm.delete')" class="mr-2">
          <Icon
            class="cursor-pointer"
            :icon="'ant-design:delete-outlined'"
            color="red"
            :size="20"
            @click="handleDeleteAlarm(index)"
          />
        </Tooltip>
      </template>
      <div class="flex items-center mb-4">
        <div class="">
          <label class="float-right ml-4 mr-2">{{ t('tb.deviceProfile.alarm.alarmType') }}</label>
        </div>
        <Input
          class="flex-1"
          :placeholder="t('tb.deviceProfile.alarm.alarmTypePlaceholder')"
          v-model:value="alarm.alarmType"
        />
      </div>
      <div class="ml-4 mb-4 flex items-center">
        <Checkbox v-model:checked="alarm.propagate">{{ t('tb.deviceProfile.alarm.propagateAlarm') }}</Checkbox>
      </div>
      <div v-if="alarm.propagate == true" class="mb-4">
        <div class="flex items-center">
          <div class="">
            <label class="float-right ml-4 mr-2">{{ t('tb.deviceProfile.alarm.relationTypesLabel') }}</label>
          </div>
          <Select
            class="flex-1"
            :allowClear="true"
            :placeholder="t('tb.deviceProfile.alarm.relationTypesPlaceholder')"
            mode="tags"
            :open="false"
            v-model:value="alarm.propagateRelationTypes"
          />
        </div>
        <span class="text-help ml-38">{{ t('tb.deviceProfile.alarm.relationTypesHelp') }}</span>
      </div>

      <div class="ml-4 mb-4 flex items-center">
        <Checkbox v-model:checked="alarm.propagateToOwner">{{ t('tb.deviceProfile.alarm.propagateToOwner') }}</Checkbox>
      </div>
      <div class="ml-4 mb-4 flex items-center">
        <Checkbox v-model:checked="alarm.propagateToTenant">{{
          t('tb.deviceProfile.alarm.propagateToTenant')
        }}</Checkbox>
      </div>
      <span>{{ t('tb.deviceProfile.alarm.createAlarmRules') }}</span>
      <div class="mb-4 mt-2">
        <div v-if="(alarm.createRulesList?.length || 0) < 1" class="flex justify-center p-2">
          <span class="text-base text-red-500">{{ t('tb.deviceProfile.alarm.needCreateRule') }}</span>
        </div>
        <div v-else>
          <div
            v-for="(item, createRuleIndex) in alarm.createRulesList"
            :key="createRuleIndex"
            class="flex items-center"
          >
            <div class="md:w-13/14 border border-solid border-neutral-400 rounded p-2 mb-2">
              <div class="md:flex">
                <div class="md:w-1/4 w-full border-r-1 border-slate-300 pr-1">
                  <div>{{ t('tb.deviceProfile.alarm.alarmLevel') }}</div>
                  <Select
                    class="w-full"
                    :placeholder="t('tb.deviceProfile.alarm.alarmLevel')"
                    v-model:value="item.severity"
                    :options="ALARM_SEVERITY_OPTIONS"
                  />
                </div>
                <div class="md:w-3/4 w-full pl-2">
                  <div class="flex items-center mb-4">
                    <label class="float-right mr-2 md:w-1/7">{{ t('tb.deviceProfile.alarm.condition') }}</label>
                    <Condition class="md:w-6/7 w-full" v-model:value="item.rule.condition" />
                  </div>
                  <div class="flex items-center mb-4">
                    <label class="float-right mr-2 md:w-1/5">{{ t('tb.deviceProfile.alarm.schedule') }}</label>
                    <Schedule class="flex-1 w-full md:w-4/5" v-model:value="item.rule.schedule" />
                  </div>
                  <div class="flex items-center mb-4">
                    <label class="float-right mr-2 md:w-1/5">{{ t('tb.deviceProfile.alarm.detailsTemplate') }}</label>
                    <Detail class="flex-1 w-full md:w-4/5" v-model:value="item.rule.alarmDetails" />
                  </div>
                  <div class="flex items-center">
                    <label class="float-right mr-2">{{ t('tb.deviceProfile.alarm.mobileDashboard') }}</label>
                    <Select
                      class="flex-1 w-full"
                      :allowClear="true"
                      v-model:value="item.rule.dashboardId.id"
                      :options="dashboardList"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="md:w-1/14">
              <Tooltip :title="t('tb.deviceProfile.common.delete')" class="mx-2">
                <Icon
                  class="cursor-pointer"
                  :icon="'ant-design:minus-circle-outlined'"
                  color="red"
                  :size="20"
                  @click="handleDeleteCreateRule(index, createRuleIndex)"
                />
              </Tooltip>
            </div>
          </div>
        </div>
        <a-button
          v-if="(alarm.createRulesList?.length || 0) < 6"
          type="default"
          size="small"
          @click="handleAddCreateRule(index)"
        >
          <Icon icon="ant-design:plus-circle-outlined" />{{ t('tb.deviceProfile.alarm.addCreateRule') }}
        </a-button>
      </div>

      <span>{{ t('tb.deviceProfile.alarm.clearAlarmRules') }}</span>
      <div class="mb-4 mt-2">
        <div v-if="alarm.clearRule != undefined" class="flex items-center">
          <div class="md:w-13/14 border border-solid border-neutral-400 rounded p-2 mb-2">
            <div class="flex items-center mb-4">
              <label class="float-right mr-2 md:w-1/7">{{ t('tb.deviceProfile.alarm.condition') }}</label>
              <Condition class="flex-1 w-full md:w-6/7" v-model:value="alarm.clearRule.condition" />
            </div>
            <div class="flex items-center mb-4">
              <label class="float-right mr-2 md:w-1/6">{{ t('tb.deviceProfile.alarm.schedule') }}</label>
              <Schedule class="flex-1 w-full md:w-5/6" v-model:value="alarm.clearRule.schedule" />
            </div>
            <div class="flex items-center mb-4">
              <label class="float-right mr-2 md:w-1/6">{{ t('tb.deviceProfile.alarm.detailsTemplate') }}</label>
              <Detail class="flex-1 w-full md:w-5/6" v-model:value="alarm.clearRule.alarmDetails" />
            </div>
            <div class="flex items-center">
              <label class="float-right mr-2">{{ t('tb.deviceProfile.alarm.mobileDashboard') }}</label>
              <Select
                class="flex-1 w-full"
                :allowClear="true"
                v-model:value="alarm.clearRule.dashboardId.id"
                :options="dashboardList"
              />
            </div>
          </div>
          <div class="md:w-1/14">
            <Tooltip :title="t('tb.deviceProfile.common.delete')" class="mx-2">
              <Icon
                class="cursor-pointer"
                :icon="'ant-design:minus-circle-outlined'"
                color="red"
                :size="20"
                @click="handleDeleteClearRule(index)"
              />
            </Tooltip>
          </div>
        </div>
        <a-button v-if="alarm.clearRule == undefined" type="default" size="small" @click="handleAddClearRule(index)">
          <Icon icon="ant-design:plus-circle-outlined" />{{ t('tb.deviceProfile.alarm.addClearRule') }}
        </a-button>
      </div>
    </CollapseContainer>

    <a-button type="primary" size="small" @click="handleAddAlarm">
      <Icon icon="i-fluent:add-12-filled" />{{ t('tb.deviceProfile.alarm.addAlarmRule') }}
    </a-button>
  </div>
</template>
<script lang="ts" setup name="DeviceProfileAlarmForm">
  import { ref, onMounted } from 'vue';
  import { CollapseContainer } from '/@/components/Container';
  import { Icon } from '/@/components/Icon';
  import { buildUUID } from '/@/utils/uuid';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { AlarmSeverity, ALARM_SEVERITY_OPTIONS } from '/@/enums/alarmEnum';
  import { Tooltip, Input, Checkbox, Select } from 'ant-design-vue';
  import { Alarm, AlarmRule } from '/@/api/tb/deviceProfile';
  import { NamePath } from 'ant-design-vue/es/form/interface';
  import { useMessage } from '/@/hooks/web/useMessage';
  import Condition from './Condition.vue';
  import Schedule from './Schedule.vue';
  import Detail from './Detail.vue';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  const emit = defineEmits(['success', 'register']);
  const { showMessage } = useMessage();
  const { t } = useI18n('tb');

  const dashboardList = ref<any[]>([]);
  const alarmList = ref<Array<Alarm>>([]);

  onMounted(async () => {
    await fetchDashboardList();
  });

  async function setConfigFieldsValue(values: any) {
    alarmList.value = values || [];
    if (values.length > 0) {
      for (let i = 0; i < values.length; i++) {
        alarmList.value[i].createRulesList = [];
        if (!isEmpty(values[i].createRules)) {
          Object.keys(values[i].createRules).forEach((key) => {
            const rule = values[i].createRules[key];
            if (!rule.dashboardId) {
              rule.dashboardId = { entityType: EntityType.DASHBOARD, id: '' };
            }
            alarmList.value[i].createRulesList?.push({ severity: key, rule: rule });
          });
        }
        if (!isEmpty(values[i].clearRule) && isEmpty(values[i].clearRule?.dashboardId)) {
          alarmList.value[i].clearRule = {
            ...values[i].clearRule,
            dashboardId: { entityType: EntityType.DASHBOARD, id: '' },
          } as AlarmRule;
        }
      }
    }
    console.log(alarmList.value);
  }

  async function validateFieldsValue(nameList?: NamePath[]) {
    const data: Array<any> = [];
    alarmList.value.forEach((item) => {
      if (item.clearRule && isEmpty(item.clearRule.condition)) {
        showMessage(t('tb.deviceProfile.alarm.clearAlarmConditionEmpty'), 'error');
        throw new Error(t('tb.deviceProfile.alarm.clearAlarmConditionEmpty'));
      }
      const clearRule = isEmpty(item.clearRule)
        ? undefined
        : {
            ...item.clearRule,
            dashboardId: isEmpty(item.clearRule.dashboardId?.id) ? undefined : item.clearRule.dashboardId,
          };
      const createRules = {};
      if (item.createRulesList) {
        if (item.createRulesList?.length < 1) {
          showMessage(t('tb.deviceProfile.alarm.createAlarmRulesEmpty'), 'error');
          throw new Error(t('tb.deviceProfile.alarm.createAlarmRulesEmpty'));
        }
        item.createRulesList.forEach((createRuleItem) => {
          if (isEmpty(createRuleItem.rule.condition)) {
            showMessage(t('tb.deviceProfile.alarm.createAlarmRuleEmpty'), 'error');
            throw new Error(t('tb.deviceProfile.alarm.createAlarmRuleEmpty'));
          }
          createRules[createRuleItem.severity] = {
            ...createRuleItem.rule,
            dashboardId: isEmpty(createRuleItem.rule.dashboardId?.id) ? undefined : createRuleItem.rule.dashboardId,
          };
        });
      }
      data.push({
        id: item.id,
        alarmType: item.alarmType,
        propagate: item.propagate,
        propagateToOwner: item.propagateToOwner,
        propagateToTenant: item.propagateToTenant,
        propagateRelationTypes: item.propagateRelationTypes,
        clearRule: clearRule,
        createRules: createRules,
      });
    });
    return data;
  }

  defineExpose({ validate: validateFieldsValue, setFieldsValue: setConfigFieldsValue });

  function handleAddAlarm() {
    alarmList.value.push({
      id: buildUUID(),
      createRulesList: [],
    } as Alarm);
  }

  function handleDeleteAlarm(index: number) {
    alarmList.value.splice(index, 1);
  }

  function handleAddCreateRule(index: number) {
    let createRulesList = alarmList.value[index].createRulesList;
    if (createRulesList == undefined) {
      createRulesList = [];
    }
    createRulesList.push({
      severity: AlarmSeverity.INDETERMINATE,
      rule: { schedule: { type: 'ANY_TIME' }, dashboardId: { entityType: EntityType.DASHBOARD, id: '' } } as AlarmRule,
    });
    alarmList.value[index].createRulesList = createRulesList;
  }

  function handleDeleteCreateRule(index: number, createRuleIndex: number) {
    alarmList.value[index].createRulesList?.splice(createRuleIndex, 1);
  }

  function handleAddClearRule(index: number) {
    alarmList.value[index].clearRule = {
      schedule: { type: 'ANY_TIME' },
      dashboardId: { entityType: EntityType.DASHBOARD, id: '' },
    } as AlarmRule;
  }

  function handleDeleteClearRule(index: number) {
    alarmList.value[index].clearRule = undefined;
  }

  async function fetchDashboardList() {
    const result = await currentTenantDashboardList({ pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' });
    dashboardList.value = result.data.map((item) => ({ label: item.title, value: item.id.id }));
  }
</script>
<style lang="less">
  .device-profile-alarm-form {
  }
</style>
