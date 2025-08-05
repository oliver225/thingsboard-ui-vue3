<template>
  <div class="device-profile-alarm-schedule">
    <div class="preview" @click="handleEditSchedule">
      <div v-if="record.type == 'ANY_TIME'">
        始终启动
      </div>
      <div v-if="record.type == 'SPECIFIC_TIME'">
        <span v-for="(day, index) in record.daysOfWeek" :key="index">
          {{ daysOfWeekOptions.find(a => a.value == day)?.label }},
        </span>
        <strong>
          {{ dayjs(record.startsOn || 0).format('HH:mm:ss') }} --
          {{ dayjs(record.endsOn || 0).format('HH:mm:ss') }}
        </strong>
      </div>
      <div v-if="record.type == 'CUSTOM'">
        <span v-for="(item, index) in record.items" :key="index">
          <span v-if="item.enabled == true">
            {{ daysOfWeekOptions.find(a => a.value == item.dayOfWeek)?.label }}
            <strong>
              ({{ dayjs(item.startsOn || 0).format('HH:mm:ss') }} -
              {{ dayjs(item.endsOn || 0).format('HH:mm:ss') }})
            </strong>
            ,
          </span>
        </span>
      </div>
    </div>
    <BasicModal :open="modalVisible" title="告警日程表" width="50%" :show-ok-btn="edit == true" @ok="handleSubmit"
      :onCancel="handleModalClose">
      <Form ref="formRef" :model="record" layout="vertical">
        <Form.Item name="type">
          <Select v-model:value="record.type" style="width: 100%;" :disabled="edit == false">
            <Select.Option value="ANY_TIME">始终启动</Select.Option>
            <Select.Option value="SPECIFIC_TIME">定时启用</Select.Option>
            <Select.Option value="CUSTOM">自定义启用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="天" name="daysOfWeek" v-if="record.type == 'SPECIFIC_TIME'"
          :rules="[{ validator: checkDaysOfWeek, trigger: 'change' }]">
          <CheckboxGroup v-model:value="record.daysOfWeek" :options="daysOfWeekOptions" :disabled="edit == false" />
        </Form.Item>
        <div v-if="record.type == 'SPECIFIC_TIME'">
          时间
          <Row>
            <Col :span="6">
            <Form.Item name="startsOn" :rules="[{ validator: checkStartsOn, trigger: 'change' }]">
              <span class="mr-4">从</span>
              <TimePicker v-model:value="record.startsOn" :allowClear="false" :disabled="edit == false" />
            </Form.Item>
            </Col>
            <Col :span="6">
            <Form.Item name="endsOn" :rules="[{ validator: checkEndsOn, trigger: 'change' }]">
              <span class="mr-4">到</span>
              <TimePicker v-model:value="record.endsOn" :allowClear="false" :disabled="edit == false" />
            </Form.Item>
            </Col>
          </Row>
        </div>
        <Form.Item label="天" name="items" v-if="record.type == 'CUSTOM'"
          :rules="[{ validator: checkItems, trigger: 'change' }]">
          <div v-for="(item, index) in record.items" :key="index" class="mb-4">
            <Checkbox v-model:checked="item.enabled" :disabled="edit == false">
              {{ daysOfWeekOptions.find(a => a.value == item.dayOfWeek)?.label }}
            </Checkbox>
            <span class="ml-8 mr-4">从</span>
            <TimePicker v-model:value="item.startsOn" :disabled="edit == false" />
            <span class="mx-4">到</span>
            <TimePicker v-model:value="item.endsOn" :disabled="edit == false" />
          </div>
        </Form.Item>

      </Form>

    </BasicModal>

  </div>
</template>
<script lang="ts" setup name="AlarmSchedule">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { Form, Row, Col, Select, Checkbox, CheckboxGroup, TimePicker, FormInstance } from 'ant-design-vue';
import { BasicModal } from '/@/components/Modal';
import { propTypes } from '/@/utils/propTypes';
import { Schedule } from '/@/api/tb/deviceProfile';
import dayjs from 'dayjs';
import duration from "dayjs/plugin/duration";
import { isEmpty } from 'lodash-es';

dayjs.extend(duration);
const emit = defineEmits(['update:value']);
const { t } = useI18n('tb');
const { showMessage } = useMessage();


const props = defineProps({
  value: {
    type: Object as PropType<Schedule>,
    required: true,
  },
  edit: propTypes.bool.def(true),
});

const modalVisible = ref(false);
const formRef = ref<FormInstance>();
const record = reactive<Schedule>({
  type: 'ANY_TIME',
  timezone: 'Asia/Shanghai',
  daysOfWeek: [1],
  startsOn: dayjs().subtract(6, 'hour'),
  endsOn: dayjs().subtract(4, 'hour'),
  items: [
    { enabled: false, dayOfWeek: 1, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 2, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 3, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 4, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 5, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 6, startsOn: 0, endsOn: 0 },
    { enabled: false, dayOfWeek: 7, startsOn: 0, endsOn: 0 },
  ]
} as Schedule);

const daysOfWeekOptions = [
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
  { value: 7, label: '星期日' },
];


onMounted(() => {
  init();
})

function init() {
  if (props.value) {
    record.type = props.value.type;
    record.timezone = 'Asia/Shanghai';
    record.daysOfWeek = props.value.daysOfWeek;
    record.startsOn = dayjs().startOf('D').add(dayjs.duration(props.value.startsOn || 0));
    record.endsOn = dayjs().startOf('D').add(dayjs.duration(props.value.endsOn || 10000));
    if (record.type == 'CUSTOM') {
      record.items = props.value.items.map(item => ({
        enabled: item.enabled,
        dayOfWeek: item.dayOfWeek,
        startsOn: item.enabled ? dayjs().startOf('D').add(dayjs.duration(item.startsOn)) : 0,
        endsOn: item.enabled ? dayjs().startOf('D').add(dayjs.duration(item.endsOn)) : 0,
      }));
    }
  }
}


function handleEditSchedule() {
  modalVisible.value = true;
}

function handleModalClose() {
  modalVisible.value = false;
}

async function checkDaysOfWeek(_rule: any, value: Array<number>) {
  if (!value) {
    return Promise.reject('每周至少选择一天。');
  } else if (value.length < 1) {
    return Promise.reject('每周至少选择一天。');
  } else {
    return Promise.resolve();
  }
}

async function checkItems(_rule: any, value: Array<any>) {
  const enabledArray = value.filter(item => item.enabled == true);
  if (enabledArray.length < 1) {
    return Promise.reject('每周至少选择一天。');
  } else {
    for (let i = 0; i < enabledArray.length; i++) {
      if (enabledArray[i].startsOn == 0 || isEmpty(enabledArray[i].startsOn)) {
        return Promise.reject(`${daysOfWeekOptions.find(a => a.value == enabledArray[i].dayOfWeek)?.label} 开始时间不能为空。`);
      }
      if (enabledArray[i].endsOn == 0 || isEmpty(enabledArray[i].endsOn)) {
        return Promise.reject(`${daysOfWeekOptions.find(a => a.value == enabledArray[i].dayOfWeek)?.label} 结束时间不能为空。`);
      }
    }
  }
  return Promise.resolve();

}

async function checkStartsOn(_rule: any, value: any) {
  if (value == 0 || isEmpty(value)) {
    return Promise.reject('开始时间不能为空。');
  }
  return Promise.resolve();
}
async function checkEndsOn(_rule: any, value: any) {
  if (value == 0 || isEmpty(value)) {
    return Promise.reject('结束时间不能为空。');
  }
  return Promise.resolve();
}


async function handleSubmit() {
  try {
    if (!formRef.value) {
      throw new Error('表单未初始化');
    }
    let data = await formRef.value.validate();
    if (data.type == 'ANY_TIME') {
      data = { type: 'ANY_TIME' };
    } else if (data.type == 'SPECIFIC_TIME') {
      data = {
        type: 'SPECIFIC_TIME',
        timezone: 'Asia/Shanghai',
        daysOfWeek: data.daysOfWeek,
        startsOn: dayjs(data.startsOn).diff(dayjs().startOf('D')),
        endsOn: dayjs(data.endsOn).diff(dayjs().startOf('D'))
      }
    } else if (data.type == 'CUSTOM') {
      data.items.forEach(item => {
        item.startsOn = item.enabled == true ? dayjs(item.startsOn).diff(dayjs().startOf('D')) : undefined;
        item.endsOn = item.enabled == true ? dayjs(item.endsOn).diff(dayjs().startOf('D')) : undefined;
      });
      data = {
        type: 'CUSTOM',
        timezone: 'Asia/Shanghai',
        items: data.items,
      }
    }
    emit('update:value', data);
    handleModalClose();

  } catch (error: any) {
    if (error && error.errorFields) {
      showMessage(t('common.validateError'));
    }
    console.log('error', error);
  }

}

</script>
<style lang="less">
.device-profile-alarm-schedule {
  .preview {
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>