<script lang="ts" setup>
import { ref, watchEffect } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Card, InputNumber, Modal } from 'ant-design-vue';

defineOptions({
  name: 'TenantProfileRateLimit',
});

const props = withDefaults(defineProps<{ edit?: boolean; value: string }>(), {
  edit: true,
});

const emit = defineEmits(['update:value']);

interface RateLimitItem {
  quantity: number;
  second: number;
}

const modalVisible = ref(false);

const rateList = ref<Array<RateLimitItem>>([]);

watchEffect(() => {
  resolveRateLimit(props.value);
});

function resolveRateLimit(rateLimit: string) {
  if (!rateLimit?.trim()) {
    rateList.value = [];
    return;
  }
  const parsedData: RateLimitItem[] = rateLimit
    .split(',')
    .map((item) => {
      const [quantityStr, secondStr] = item.split(':');
      const quantity = Number.parseInt(quantityStr || '', 10);
      const second = Number.parseInt(secondStr || '', 10);

      if (
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        Number.isNaN(second) ||
        second <= 0
      ) {
        return null;
      }

      return { quantity, second };
    })
    .filter((item): item is RateLimitItem => item !== null);

  rateList.value = parsedData;
}

function updateRateLimitValue() {
  const validItems = rateList.value?.filter(
    (item) => item.quantity > 0 && item.second > 0,
  );

  if (!validItems || validItems.length === 0) {
    emit('update:value', undefined);
    return;
  }

  const rateLimitString = validItems
    .map(({ quantity, second }) => `${quantity}:${second}`)
    .join(',');

  emit('update:value', rateLimitString);
}

function handleOK() {
  updateRateLimitValue();
  modalVisible.value = false;
}

function handleClose() {
  modalVisible.value = false;
}

function handleEditRateLimit() {
  if (props.edit === true) {
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
      <VbenIconButton
        v-tippy="{
          content: '删除限制',
          theme: 'dark',
        }"
        v-if="edit === true"
      >
        <IconifyIcon
          class="size-6"
          icon="ant-design:plus-circle-outlined"
          color="blue"
          @click="handleEditRateLimit()"
        />
      </VbenIconButton>
      <!-- <Tooltip title="添加限制" class="mx-4" v-if="edit === true">
        <Icon
          class="cursor-pointer"
          icon="ant-design:plus-circle-outlined"
          :size="24"
          color="blue"
          @click="handleEditRateLimit()"
        />
      </Tooltip> -->
    </div>
    <Modal
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

            <VbenIconButton
              v-tippy="{
                content: '删除限制',
                theme: 'dark',
              }"
            >
              <IconifyIcon
                class="size-6"
                icon="ant-design:minus-circle-outlined"
                color="red"
                @click="handleDeleteRateItem(index)"
              />
            </VbenIconButton>
            <!-- 
            <Tooltip title="删除限制">
              <Icon
                class="cursor-pointer"
                icon="ant-design:minus-circle-outlined"
                :size="24"
                color="red"
                @click="handleDeleteRateItem(index)"
              />
            </Tooltip> -->
          </div>
        </div>
        <a-button type="primary" @click="handleAddRateItem">
          <IconifyIcon class="size-6" icon="i-fluent:add-12-filled" />
          添加限制
        </a-button>
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
