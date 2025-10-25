<template>
  <BasicModal @register="registerModal" width="50%">
    <template #title>
      <Icon :icon="'ant-design:history-outlined'" class="pr-1 m-1" />
      <span>{{ t('tb.gateway.details.activity.title') }}</span>
    </template>
    <div class="border border-solid border-neutral-300 p-2 my-2 rounded-md">
      <List size="small" :dataSource="commentList" class="activity-list">
        <template #header>
          <div class="mx-2 my-3 flex justify-around items-center">
            <Input
              :placeholder="t('tb.gateway.details.activity.addComment')"
              v-model:value="inputComment"
              style="width: 90%"
            />
            <Tooltip :title="t('tb.gateway.details.activity.submit')">
              <Icon
                class="cursor-pointer"
                :icon="'ant-design:send-outlined'"
                color="green"
                size="28"
                @click="handleAddComment"
              />
            </Tooltip>
          </div>
        </template>
        <template #renderItem="{ item }">
          <List.Item style="border-bottom-width: 0">
            <!-- 自己/用户评论样式 -->
            <div
              v-if="item.type === 'OTHER'"
              class="my-comment-row"
              :class="{ mine: userStore.getUserInfo?.email == item.email }"
            >
              <div class="left">
                <Avatar class="mr-3">{{ item.firstName }}</Avatar>
                <div class="content-wrap">
                  <div class="name-time">
                    <span class="name">{{ item.firstName }}</span>
                    <Tooltip :title="dayjs(item.createdTime).format('YYYY-MM-DD HH:mm:ss')" placement="right">
                      <a-button type="text" size="small" class="time-btn">
                        {{ dayjs(item.createdTime).fromNow() }}
                      </a-button>
                    </Tooltip>
                  </div>
                  <div class="text">{{ item.comment.text }}</div>
                </div>
              </div>
              <div class="right" v-if="userStore.getUserInfo?.email == item.email">
                <Tooltip :title="t('tb.alarm.detail.comment.edit')">
                  <Icon
                    class="cursor-pointer"
                    :icon="'i-clarity:note-edit-line'"
                    color="green"
                    :size="20"
                    @click="handleEditComment()"
                  />
                </Tooltip>
                <Tooltip :title="t('tb.alarm.detail.comment.delete')">
                  <Icon
                    class="cursor-pointer"
                    :icon="'ant-design:delete-outlined'"
                    color="red"
                    :size="20"
                    @click="handleDeleteComment(item)"
                  />
                </Tooltip>
              </div>
            </div>

            <!-- 系统日志样式（保持居中灰色） -->
            <div v-else class="flex justify-center text-gray-400">
              {{ item.comment.text }}
              <Tooltip :title="dayjs(item.createdTime).format('YYYY-MM-DD HH:mm:ss')" placement="right">
                <a-button type="text" size="small" class="time-btn">{{ dayjs(item.createdTime).fromNow() }}</a-button>
              </Tooltip>
            </div>
          </List.Item>
        </template>
      </List>
    </div>
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <Tooltip :title="t('tb.gateway.details.activity.export')">
            <Icon class="cursor-pointer" :icon="'ant-design:download-outlined'" :size="20" @click="handleExport" />
          </Tooltip>
          <Tooltip
            :title="sortAsc ? t('tb.gateway.details.activity.sortAsc') : t('tb.gateway.details.activity.sortDesc')"
          >
            <Icon
              class="cursor-pointer"
              :icon="sortAsc ? 'ant-design:sort-ascending-outlined' : 'ant-design:sort-descending-outlined'"
              :size="20"
              @click="toggleSort"
            />
          </Tooltip>
          <Tooltip :title="t('tb.gateway.details.activity.refresh')">
            <Icon class="cursor-pointer" :icon="'ant-design:reload-outlined'" :size="20" @click="fetchComments" />
          </Tooltip>
        </div>
        <div class="flex items-center gap-2">
          <a-button @click="closeModal">{{ t('tb.gateway.details.activity.cancel') }}</a-button>
          <a-button type="primary" @click="closeModal">{{ t('tb.gateway.details.activity.confirm') }}</a-button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>

<script lang="ts" setup name="GatewayActivityModal">
  import { ref } from 'vue';
  import { Avatar, Input, List, Tooltip } from 'ant-design-vue';
  import RelativeTime from 'dayjs/plugin/relativeTime';
  import duration from 'dayjs/plugin/duration';
  import dayjs from 'dayjs';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStore } from '/@/store/modules/user';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { EntityType } from '/@/enums/entityTypeEnum';

  import { AlarmCommentInfo, alarmCommentList, deleteAlarmComment, saveAlarmComment } from '/@/api/tb/alarm';

  dayjs.locale('zh-cn');
  dayjs.extend(duration);
  dayjs.extend(RelativeTime);

  const { t } = useI18n('');

  const userStore = useUserStore();
  const { createConfirm, showMessage } = useMessage();

  const inputComment = ref('');
  const commentList = ref<Array<AlarmCommentInfo>>([]);
  const currentAlarmId = ref<string>('');
  const sortAsc = ref(false);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    currentAlarmId.value = data?.alarmId || '';
    await fetchComments();
    setModalProps({ loading: false });
  });

  async function fetchComments(sortOrder: 'DESC' | 'ASC' | undefined = 'DESC') {
    if (!currentAlarmId.value) return;
    setModalProps({ loading: true });
    try {
      const { data } = await alarmCommentList(currentAlarmId.value, {
        page: 0,
        pageSize: 2147483647,
        sortProperty: 'createdTime',
        sortOrder: sortOrder,
      });
      commentList.value = data;
    } finally {
      setModalProps({ loading: false });
    }
  }

  function toggleSort() {
    sortAsc.value = !sortAsc.value;
    fetchComments('ASC');
  }

  function handleExport() {
    const header = [
      t('tb.gateway.details.activity.author'),
      t('tb.gateway.details.activity.createdTime'),
      t('tb.gateway.details.activity.editedTime'),
      t('tb.gateway.details.activity.text'),
    ];
    const rows: Array<[string, string, string, string]> = (commentList.value || []).map((i: any) => {
      const author =
        i?.type === 'OTHER'
          ? i?.firstName || i?.email || t('tb.gateway.details.activity.user')
          : t('tb.gateway.details.activity.system');
      const created = i?.createdTime ? dayjs(i.createdTime).format('YYYY-MM-DD HH:mm:ss') : '';
      const editedTs = i?.updatedTime ?? i?.modifiedTime ?? i?.lastUpdatedTime ?? '';
      const edited = editedTs ? dayjs(editedTs).format('YYYY-MM-DD HH:mm:ss') : '';
      const text = i?.comment?.text ?? '';
      return [author, created, edited, text];
    });
    const escapeCell = (val: unknown) => String(val ?? '').replace(/"/g, '""');
    const BOM = '\uFEFF';
    const csvBody = [header.join(';'), ...rows.map((r) => r.map((c) => `"${escapeCell(c)}"`).join(';'))].join('\n');
    const csv = `${BOM}${csvBody}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('tb.gateway.details.activity.activityExportFilename', {
      id: currentAlarmId.value,
      timestamp: dayjs().format('YYYYMMDDHHmmss'),
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddComment() {
    if (!inputComment.value.trim() || !currentAlarmId.value) return;
    try {
      await saveAlarmComment(
        {
          alarmId: { id: currentAlarmId.value, entityType: EntityType.ALARM },
          comment: { text: inputComment.value.trim() },
          type: 'OTHER',
        },
        currentAlarmId.value,
      );
      inputComment.value = '';
      await fetchComments();
    } catch (e) {
      // ignore
    }
  }

  async function handleDeleteComment(record: Recordable) {
    createConfirm({
      iconType: 'error',
      title: t('tb.alarm.detail.comment.deleteConfirm', { text: record.comment.text }),
      content: t('tb.alarm.detail.comment.deleteConfirmContent'),
      centered: false,
      okText: t('common.delText'),
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onOk: async () => {
        try {
          await deleteAlarmComment(record.id.id, currentAlarmId.value);
          showMessage(t('tb.alarm.detail.comment.deleteSuccess'));
        } catch (error: any) {
          console.log(error);
        } finally {
          inputComment.value = '';
          await fetchComments();
        }
      },
    });
  }

  function handleEditComment() {
    showMessage(t('common.wip'));
  }
</script>

<style scoped lang="less">
  .activity-list {
    .my-comment-row {
      width: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 4px;
      background: #f6f7fb;
      border: 1px solid transparent;

      &.mine {
        background: #eefdf3; /* 个人回复淡绿色底 */
        border-color: #a7f3d0; /* 边框绿色 */
        box-shadow: 0 1px 2px rgba(16, 185, 129, 0.15);
      }
    }

    .left {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .content-wrap {
      display: flex;
      flex-direction: column;
    }

    .name-time {
      display: flex;
      align-items: center;
      gap: 8px;
      .name {
        font-weight: 600;
        color: #1f2937;
      }
      .time-btn {
        padding: 0 4px;
        color: #9ca3af;
      }
    }

    .text {
      margin-top: 4px;
      color: #374151;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
</style>
