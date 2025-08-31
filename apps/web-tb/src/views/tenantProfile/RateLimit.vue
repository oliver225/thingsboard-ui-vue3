<script lang="ts" setup name="RateLimit">
import { ref, watchEffect } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { VbenButton, VbenIconButton } from '@vben-core/shadcn-ui';

import { Card, InputNumber } from 'ant-design-vue';
import { isEmpty } from 'lodash-es';

interface RateItem {
  quantity: number;
  second: number;
}

interface Props {
  value?: string;
  edit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  edit: true,
});

const emit = defineEmits(['update:value']);

const rateList = ref<RateItem[]>([]);

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    updateRateLimitValue();
    modalApi.close();
  },
});

watchEffect(() => {
  resolveRateLimit(props.value);
});

function resolveRateLimit(rateLimit?: string) {
  rateList.value = [];
  if (isEmpty(rateLimit)) {
    return;
  }
  rateLimit!.split(',').forEach((item) => {
    const datum = item.split(':');
    if (datum.length === 2) {
      const quantity = Number.parseInt(datum[0] || '');
      const second = Number.parseInt(datum[1] || '');
      if (!Number.isNaN(quantity) && !Number.isNaN(second)) {
        rateList.value.push({ quantity, second });
      }
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

function handleEditRateLimit() {
  if (props.edit === true) {
    modalApi.open();
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
    <div class="preview" @click="handleEditRateLimit">
      <div v-if="rateList.length === 0" class="text-help">未配置</div>
      <p v-for="(rate, index) in rateList" :key="index">
        <span v-show="index > 0">但小于</span>
        <span class="quantity">{{ rate.quantity }}</span>
        条消息每
        <span class="second">{{ rate.second }}</span>
        秒
      </p>
    </div>

    <VbenIconButton
      v-if="edit === true"
      v-tippy="{ theme: 'auto', content: '添加限制' }"
      @click.stop="handleEditRateLimit"
    >
      <IconifyIcon
        icon="ant-design:plus-circle-outlined"
        class="size-6"
        color="blue"
      />
    </VbenIconButton>

    <Modal title="编辑速率限制" class="w-1/3">
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
            <VbenIconButton
              v-tippy="{ theme: 'auto', content: '删除限制' }"
              @click="handleDeleteRateItem(index)"
            >
              <IconifyIcon
                icon="ant-design:minus-circle-outlined"
                class="size-6"
                color="red"
              />
            </VbenIconButton>
          </div>
        </div>
        <VbenButton type="primary" size="sm" @click="handleAddRateItem">
          <IconifyIcon
            icon="fluent:add-12-filled"
            class="mr-2 size-4"
          />添加限制
        </VbenButton>
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
              <span class="second">{{ rate.second }}</span>
              秒
            </p>
          </div>
        </Card>
      </div>
    </Modal>
  </div>
</template>

<style lang="less">
.tenant-profile-rate-limit {
  display: flex;
  align-items: center;

  .preview {
    flex: 1;
    min-height: 50px;
    border: 1px solid hsl(var(--border));
    cursor: pointer;
    border-radius: 8px;
    padding: 8px 16px;

    > * {
      margin-top: 2px;
    }

    .quantity {
      border: 1px solid hsl(var(--border));
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      color: hsl(var(--primary));
      font-weight: 500;
    }

    .second {
      color: #f50;
      border: 1px solid hsl(var(--border));
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
    border: 1px solid hsl(var(--border));
    padding: 8px 16px;

    > * {
      margin-top: 2px;
    }

    .quantity {
      border: 1px solid hsl(var(--border));
      border-radius: 4px;
      padding: 1px 6px;
      margin: auto 4px;
      color: hsl(var(--primary));
      font-weight: 500;
    }

    .second {
      color: #f50;
      border: 1px solid hsl(var(--border));
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
