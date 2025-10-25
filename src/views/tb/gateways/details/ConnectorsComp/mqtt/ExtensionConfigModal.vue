<template>
  <BasicModal
    @register="registerModal"
    :title="t('tb.gateway.details.mqtt.extensionConfigModal.title')"
    width="600px"
    :showFooter="true"
    @ok="handleSave"
  >
    <Form ref="formRef" :model="{ configItems: tempConfig }">
      <div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6">
        <div class="flex items-start">
          <Icon icon="ant-design:info-circle-outlined" class="text-blue-400 mr-2 mt-0.5" />
          <div class="text-sm text-blue-700">{{ t('tb.gateway.details.mqtt.extensionConfigModal.description') }}</div>
        </div>
      </div>

      <div v-if="tempConfig.length === 0" class="text-center py-8 text-gray-500">
        <Icon icon="ant-design:setting-outlined" class="text-3xl mb-2" />
        <div>{{ t('tb.gateway.details.mqtt.extensionConfigModal.noConfigItems') }}</div>
        <div class="text-xs">{{ t('tb.gateway.details.mqtt.extensionConfigModal.clickToAdd') }}</div>
      </div>

      <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-2">
        <div v-for="(configItem, index) in tempConfig" :key="index" class="border border-gray-200 rounded bg-white">
          <!-- 折叠视图 -->
          <div
            v-if="!expandedItems[index]"
            class="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            @click="toggleItemExpanded(index)"
          >
            <div class="flex items-center gap-2">
              <Tag color="blue" size="small">{{ t('tb.gateway.details.mqtt.extensionConfigModal.configItem') }}</Tag>
              <span class="font-medium">{{
                configItem.key || t('tb.gateway.details.mqtt.extensionConfigModal.unnamed')
              }}</span>
              <Icon icon="ant-design:arrow-right-outlined" class="text-gray-400" />
              <span class="text-gray-600">{{
                configItem.value || t('tb.gateway.details.mqtt.extensionConfigModal.noValue')
              }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                type="text"
                size="small"
                @click.stop="toggleItemExpanded(index)"
                class="text-gray-400 hover:text-blue-500"
              >
                <Icon icon="ant-design:down-outlined" />
              </Button>
              <Button
                type="text"
                size="small"
                @click.stop="removeTempConfig(index)"
                class="text-red-500 hover:text-red-600"
              >
                <Icon icon="ant-design:delete-outlined" />
              </Button>
            </div>
          </div>

          <!-- 展开视图 -->
          <div v-else class="p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Icon icon="ant-design:setting-outlined" class="text-blue-500" />
                <span class="font-medium">{{
                  t('tb.gateway.details.mqtt.extensionConfigModal.configItemSettings')
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  type="text"
                  size="small"
                  @click="toggleItemExpanded(index)"
                  class="text-gray-400 hover:text-blue-500"
                >
                  <Icon icon="ant-design:up-outlined" />
                </Button>
                <Button
                  type="text"
                  size="small"
                  @click="removeTempConfig(index)"
                  class="text-red-500 hover:text-red-600"
                >
                  <Icon icon="ant-design:delete-outlined" />
                  {{ t('tb.gateway.details.mqtt.extensionConfigModal.delete') }}
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormItem
                :label="t('tb.gateway.details.mqtt.extensionConfigModal.configKey')"
                :name="['configItems', index, 'key']"
                :rules="[
                  { required: true, message: t('tb.gateway.details.mqtt.extensionConfigModal.configKeyRequired') },
                ]"
                class="mb-0"
              >
                <Input
                  v-model:value="configItem.key"
                  :placeholder="t('tb.gateway.details.mqtt.extensionConfigModal.configKeyPlaceholder')"
                />
              </FormItem>
              <FormItem
                :label="t('tb.gateway.details.mqtt.extensionConfigModal.configValue')"
                :name="['configItems', index, 'value']"
                :rules="[
                  { required: true, message: t('tb.gateway.details.mqtt.extensionConfigModal.configValueRequired') },
                ]"
                class="mb-0"
              >
                <Input
                  v-model:value="configItem.value"
                  :placeholder="t('tb.gateway.details.mqtt.extensionConfigModal.configValuePlaceholder')"
                />
              </FormItem>
            </div>
          </div>
        </div>
      </div>

      <Button type="dashed" block @click="addTempConfig" class="mt-4">
        <Icon icon="ant-design:plus-outlined" />
        {{ t('tb.gateway.details.mqtt.extensionConfigModal.addConfigItem') }}
      </Button>
    </Form>
  </BasicModal>
</template>

<script lang="ts" setup name="ExtensionConfigModal">
  import { ref, unref } from 'vue';
  import { Form, FormItem, Input, Button, Tag } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface ConfigItem {
    key: string;
    value: string;
  }

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n();

  const formRef = ref<FormInstance>();
  const tempConfig = ref<ConfigItem[]>([]);

  // UI state
  const expandedItems = ref<Record<number, boolean>>({});

  const [registerModal, { closeModal }] = useModalInner(async (data) => {
    if (data?.configItems) {
      tempConfig.value = cloneDeep(data.configItems);
      // Initialize UI state
      expandedItems.value = {};
      tempConfig.value.forEach((_, index) => {
        expandedItems.value[index] = false;
      });
    } else {
      tempConfig.value = [];
      expandedItems.value = {};
    }
  });

  function createDefaultConfigItem(): ConfigItem {
    return {
      key: '',
      value: '',
    };
  }

  function addTempConfig() {
    const newIndex = tempConfig.value.length;
    tempConfig.value.push(createDefaultConfigItem());

    // Initialize UI state for new item
    expandedItems.value[newIndex] = true; // New items start expanded
  }

  function removeTempConfig(index: number) {
    if (tempConfig.value.length > index) {
      tempConfig.value.splice(index, 1);

      // Clean up UI state
      delete expandedItems.value[index];
    }
  }

  function toggleItemExpanded(index: number) {
    expandedItems.value[index] = !expandedItems.value[index];
  }

  async function handleSave() {
    try {
      await unref(formRef)?.validate();

      emit('success', {
        configItems: cloneDeep(tempConfig.value),
      });
      closeModal();
    } catch (error) {
      console.error(t('tb.gateway.details.mqtt.extensionConfigModal.validationFailed'), error);
    }
  }
</script>

<style scoped></style>
