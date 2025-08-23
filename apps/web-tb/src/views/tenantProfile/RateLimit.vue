<!-- eslint-disable vue/no-required-prop-with-default -->
<script lang="ts" setup name="RateLimit">
import { ref, watchEffect } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Card, InputNumber } from 'ant-design-vue';
import { isEmpty } from 'lodash-es';

interface Props {
  value: string;
  edit: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  edit: true,
});

const emit = defineEmits(['update:value']);

const modalVisible = ref(false);

const rateList = ref<Array<any>>([]);

watchEffect(() => {
  resolveRateLimit(props.value);
});

function resolveRateLimit(rateLimit: string) {
  rateList.value = [];
  if (isEmpty(rateLimit)) {
    return;
  }
  rateLimit.split(',').forEach((item) => {
    const datum = item.split(':');
    if (datum.length === 2) {
      rateList.value.push({
        quantity: Number.parseInt(datum[0]),
        second: Number.parseInt(datum[1]),
      });
    }
  });
}

function updateRateLimitValue() {
  if (isEmpty(rateList.value) || rateList.value.length === 0) {
    emit('update:value', undefined);
    return;
  }
  emit(
    'update:value',
    rateList.value
      .filter((item) => item.quantity > 0 && item.second > 0)
      .map((item) => `${item.quantity}:${item.second}`)
      .join(','),
  );
}

function handleOK() {
  updateRateLimitValue();
  modalVisible.value = false;
}

function handleClose() {
  modalVisible.value = false;
}

function handleEditRateLimit() {
  if (props.edit == true) {
    modalVisible.value = true;
  }
}

function handleAddRateItem() {
  rateList.value.push({ quantity: 1, second: 1 });
}

function handleDeleteRateItem(index: number) {
  rateList.value.splice(index, 1);
}
</script>
<template>
  <div class="tenant-profile-rate-limit">
    <div class="preview">
      <div v-if="rateList.length === 0" class="text-help">未配置</div>
      <p v-for="(rate, index) in rateList" :key="index">
        <span v-show="index > 0">但小于</span>
        <span class="quantity">{{ rate.quantity }}</span>
        条消息每
        <span class="second"> {{ rate.second }}</span>
        秒
      </p>
    </div>

    <div>
      <IconifyIcon
        v-if="edit === true"
        class="mx-4 cursor-pointer"
        v-tippy="{ theme: 'auto', content: '添加限制' }"
        icon="ant-design:plus-circle-outlined"
        :size="24"
        color="blue"
        @click="handleEditRateLimit()"
      />
    </div>
    <BasicModal
      :open="modalVisible"
      title="编辑速率限制"
      width="50%"
      @ok="handleOK"
      @cancel="handleClose"
    >
      <div class="tenant-profile-rate-limit-modal">
        <div class="edit-container">
          <div v-for="(rate, index) in rateList" :key="index" class="edit-item">
            <InputNumber
              v-model:value="rate.quantity"
              :min="1"
              addon-after="条消息"
              :style="{ width: '100%' }"
            />
            <InputNumber
              v-model:value="rate.second"
              :min="1"
              addon-before="每"
              addon-after="秒"
              :style="{ width: '100%' }"
            />
            <IconifyIcon
              class="cursor-pointer"
              v-tippy="{ theme: 'auto', content: '删除限制' }"
              icon="ant-design:minus-circle-outlined"
              :size="24"
              color="red"
              @click="handleDeleteRateItem(index)"
            />
          </div>
        </div>
        <Button type="primary" @click="handleAddRateItem">
          <IconifyIcon icon="i-fluent:add-12-filled" />添加限制
        </Button>
        <div class="h-8"></div>

        <Card title="预览" size="small">
          <div
            v-if="rateList.length === 0"
            class="modal-preview un-config"
            @click="handleAddRateItem"
          >
            未配置， 点击添加限制
          </div>
          <div v-else class="modal-preview">
            <p v-for="(rate, index) in rateList" :key="index">
              <span v-show="index > 0">但小于</span>
              <span class="quantity">{{ rate.quantity }}</span>
              条消息每
              <span class="second"> {{ rate.second }}</span>
              秒
            </p>
          </div>
        </Card>
      </div>
    </BasicModal>
  </div>
</template>
<style lang="less">
.tenant-profile-rate-limit {
  display: flex;
  align-items: center;

  .preview {
    flex: 1;
    min-height: 50px;
    border: 1px solid @border-color-base;
    cursor: pointer;
    border-radius: 8px;
    padding: 8px 16px;

    > * {
      margin-top: 2px;
    }

    .quantity {
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      color: @primary-color;
      font-weight: 500;
    }

    .second {
      color: #f50;
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      font-weight: 500;
    }
  }
}

.tenant-profile-rate-limit-modal {
  .edit-container {
    .edit-item {
      > * {
        margin-right: 24px;
      }

      margin-bottom: 18px;
      display: flex;
      align-items: center;
    }
  }

  .modal-preview {
    border: 1px solid @border-color-base;
    padding: 8px 16px;

    > * {
      margin-top: 2px;
    }

    .quantity {
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      color: @primary-color;
      font-weight: 500;
    }

    .second {
      color: #f50;
      border: 1px solid darken(@border-color-base, 20%);
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      font-weight: 500;
    }
  }

  .un-config {
    cursor: pointer;
  }
}
</style>
