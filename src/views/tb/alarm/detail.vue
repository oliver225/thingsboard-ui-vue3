<template>
  <BasicModal v-bind="$attrs" @register="registerModal" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <Description @register="register" size="default">
      <template #severity="{ data }">
        <Tag :color="ALARM_SEVERITY_OPTIONS.find((item) => item.value === data.severity)?.color">
          {{ ALARM_SEVERITY_OPTIONS.find((item) => item.value === data.severity)?.label }}
        </Tag>
      </template>
      <template #assignee>
        <Select
          v-model:value="assigneeId"
          placeholder="请选择委托人"
          :allow-clear="true"
          style="width: 90%"
          @change="handleAssigneeChange"
        >
          <Select.Option v-for="(option, index) in assigneeOptions" :key="index" :value="option.value">
            {{ option.label }}
          </Select.Option>
        </Select>
      </template>
    </Description>
    <div class="border border-solid border-neutral-300 p-1 my-4 rounded-md" v-if="!isEmpty(alarmInfo?.details)">
      <JsonPreview :data="alarmInfo.details" />
    </div>
    <div class="border border-solid border-neutral-300 p-2 my-4 rounded-md">
      <List size="small" :dataSource="commentList">
        <template #header>
          <div class="text-base font-bold">评论</div>
          <div class="mx-2 my-3 flex justify-around">
            <Input placeholder="请输入评论并提交" v-model:value="inputComment" style="width: 90%" />

            <Tooltip :title="'提交评论'">
              <Icon
                class="cursor-pointer"
                :icon="'ant-design:send-outlined'"
                color="green"
                size="30"
                @click="handleAddComment"
              />
            </Tooltip>
          </div>
        </template>
        <template #renderItem="{ item }">
          <List.Item style="border-bottom-width: 0">
            <List.Item.Meta>
              <template #description>
                <div v-if="item.type == 'OTHER'">
                  {{ item.comment.text }}
                </div>
                <div v-else class="flex justify-center">
                  {{ item.comment.text }}
                  <Tooltip :title="dayjs(item.createdTime).format('YYYY-MM-DD HH:mm:ss')" placement="right">
                    <a-button type="text" size="small">
                      {{ dayjs(item.createdTime).fromNow() }}
                    </a-button>
                  </Tooltip>
                </div>
              </template>
              <template #title v-if="item.type == 'OTHER'">
                {{ item.firstName }}
                <Tooltip :title="dayjs(item.createdTime).format('YYYY-MM-DD HH:mm:ss')" placement="right">
                  <a-button type="text" size="small">
                    {{ dayjs(item.createdTime).fromNow() }}
                  </a-button>
                </Tooltip>
              </template>
              <template #avatar v-if="item.type == 'OTHER'">
                <Avatar>{{ item.firstName }}</Avatar>
              </template>
            </List.Item.Meta>
            <template #actions v-if="item.type == 'OTHER'">
              <Tooltip :title="'修改评论'" v-if="userStore.getUserInfo?.email == item.email">
                <Icon
                  class="cursor-pointer"
                  :icon="'i-clarity:note-edit-line'"
                  color="green"
                  :size="20"
                  @click="handleEditComment(item)"
                />
              </Tooltip>
              <Tooltip :title="'删除评论'" v-if="userStore.getUserInfo?.email == item.email">
                <Icon
                  class="cursor-pointer"
                  :icon="'ant-design:delete-outlined'"
                  color="red"
                  :size="20"
                  @click="handleDeleteComment(item)"
                />
              </Tooltip>
            </template>
          </List.Item>
        </template>
      </List>
    </div>

    <template #footer>
      <Space>
        <a-button type="primary" :loading="confirmLoading" @click="handleAck" v-if="alarmInfo?.acknowledged == false"
          >应答</a-button
        >
        <a-button type="primary" :loading="confirmLoading" @click="handleClear" v-if="alarmInfo?.cleared == false"
          >清除</a-button
        >
        <a-button @click="closeModal">关闭</a-button>
      </Space>
    </template>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbAlarmDetail">
  import { Avatar, Input, List, Select, Space, Tag, Tooltip } from 'ant-design-vue';
  import dayjs from 'dayjs';
  import duration from 'dayjs/plugin/duration';
  import RelativeTime from 'dayjs/plugin/relativeTime';
  import { isEmpty } from 'lodash-es';
  import { computed, ref, unref } from 'vue';
  import {
    AlarmCommentInfo,
    AlarmInfo,
    ackAlarm,
    alarmCommentList,
    assignAlarm,
    clearAlarm,
    deleteAlarmComment,
    getAlarmInfoById,
    saveAlarmComment,
    unAssignAlarm,
  } from '/@/api/tb/alarm';
  import { getUsersForAssign } from '/@/api/tb/user';
  import { JsonPreview } from '/@/components/CodeEditor';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ALARM_SEVERITY_OPTIONS, ALARM_SHOW_STATUS_OPTIONS } from '/@/enums/alarmEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { useUserStore } from '/@/store/modules/user';

  const emit = defineEmits(['success', 'register']);
  dayjs.locale('zh-cn');
  dayjs.extend(duration);
  dayjs.extend(RelativeTime);

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const userStore = useUserStore();
  const { meta } = unref(router.currentRoute);
  const alarmInfo = ref<AlarmInfo>({} as AlarmInfo);
  const commentList = ref<Array<AlarmCommentInfo>>();
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: t('报警详细信息'),
  }));

  const assigneeId = ref('');
  const assigneeOptions = ref<any[]>([]);

  const inputComment = ref('');

  const confirmLoading = ref(false);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    await init(data.id.id);
    await fetchAssigneeOptions(data.id.id);
    setModalProps({ loading: false });
  });

  async function init(alarmId: string) {
    alarmInfo.value = await getAlarmInfoById(alarmId);
    assigneeId.value = alarmInfo.value.assigneeId?.id || '';
    const { data: comments } = await alarmCommentList(alarmId, {
      page: 0,
      pageSize: 2147483647,
      sortProperty: 'createdTime',
      sortOrder: 'DESC',
    });
    commentList.value = comments;
    setDescProps({ data: alarmInfo.value });
  }

  async function fetchAssigneeOptions(alarmId: string) {
    const assignResult = await getUsersForAssign(
      { pageSize: 50, page: 0, sortProperty: 'email', sortOrder: 'ASC' },
      alarmId,
    );
    assigneeOptions.value = assignResult.data.map((item) => ({ label: item.firstName, value: item.id.id }));
  }

  const descSchema: DescItem[] = [
    {
      label: t('发起者'),
      field: 'originatorName',
      span: 2,
    },
    {
      label: t('报警等级'),
      field: 'severity',
      slot: 'severity',
      span: 2,
    },
    {
      label: t('开始时间'),
      field: 'createdTime',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
      span: 2,
    },
    {
      label: t('持续时间'),
      field: 'createdTime',
      render: (val) => getDuration(),
      span: 2,
    },
    {
      label: t('报警类型'),
      field: 'type',
      span: 2,
    },
    {
      label: t('报警状态'),
      field: 'status',
      render: (val) => (val ? ALARM_SHOW_STATUS_OPTIONS.find((item) => item.value === val)?.label || val : ''),
      span: 2,
    },
    {
      label: t('委托人'),
      field: 'assignee',
      slot: 'assignee',
      span: 4,
    },
  ];

  const [register, { setDescProps }] = useDescription({
    schema: descSchema,
  });

  function getDuration() {
    if (alarmInfo.value?.createdTime) {
      const duration = dayjs.duration(dayjs().diff(dayjs(alarmInfo.value.createdTime)));
      const seconds = duration.seconds();
      const minutes = duration.minutes();
      const hours = duration.hours();
      const days = duration.days();
      const months = duration.months();
      const years = duration.years();
      return `${years > 0 ? years + '年' : ''}${months > 0 ? months + '个月' : ''}${days > 0 ? days + '天' : ''}${hours > 0 ? hours + '小时' : ''}${minutes > 0 ? minutes + '分钟' : ''}${seconds > 0 ? seconds + '秒' : ''}`;
    }
    return '';
  }

  async function handleAddComment() {
    if (isEmpty(inputComment.value)) {
      return;
    }
    try {
      const result = await saveAlarmComment(
        { alarmId: alarmInfo.value.id, comment: { text: inputComment.value }, type: 'OTHER' },
        alarmInfo.value.id.id,
      );
      showMessage('新增评论成功！');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      inputComment.value = '';
      await init(alarmInfo.value.id.id);
    }
  }

  async function handleDeleteComment(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: `确定要删除评论[${record.comment.text}]吗？`,
      content: '请注意：确认后，数据将不可恢复。',
      centered: false,
      okText: '删除',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteAlarmComment(record.id.id, alarmInfo.value.id.id);
          showMessage('删除评论成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          inputComment.value = '';
          await init(alarmInfo.value.id.id);
        }
      },
    });
  }

  function handleEditComment(record: Recordable) {
    showMessage('开发中。。。');
  }

  async function handleAck() {
    try {
      confirmLoading.value = true;
      alarmInfo.value = await ackAlarm(alarmInfo.value.id.id);
      showMessage(`应答成功！`);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      await init(alarmInfo.value.id.id);
      confirmLoading.value = false;
    }
  }

  async function handleClear() {
    try {
      confirmLoading.value = true;
      alarmInfo.value = await clearAlarm(alarmInfo.value.id.id);
      showMessage(`清除成功！`);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      await init(alarmInfo.value.id.id);
      confirmLoading.value = false;
    }
  }

  async function handleAssigneeChange(assigneeId: string) {
    try {
      if (isEmpty(assigneeId)) {
        await unAssignAlarm(alarmInfo.value.id.id);
      } else {
        await assignAlarm(alarmInfo.value.id.id, assigneeId);
      }
      showMessage(`${isEmpty(assigneeId) ? '清空' : '修改'}委托人成功！`);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      await init(alarmInfo.value.id.id);
    }
  }
</script>
