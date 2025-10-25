<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.relationQuery') }}</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.direction')"
              :name="['relationsQuery', 'direction']"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.directionRequired') }]"
            >
              <Select v-model:value="formState.relationsQuery.direction">
                <Select.Option value="FROM">{{ t('tb.ruleChain.nodeAction.fromOriginator') }}</Select.Option>
                <Select.Option value="TO">{{ t('tb.ruleChain.nodeAction.toOriginator') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item :label="t('tb.ruleChain.nodeAction.level')" :name="['relationsQuery', 'maxLevel']">
              <InputNumber
                v-model:value="formState.relationsQuery.maxLevel"
                :precision="0"
                :step="1"
                :min="1"
                :style="{ width: '100%' }"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          :name="['relationsQuery', 'fetchLastLevelOnly']"
          v-show="formState.relationsQuery.maxLevel && formState.relationsQuery.maxLevel > 1"
        >
          <Checkbox v-model:checked="formState.relationsQuery.fetchLastLevelOnly">
            {{ t('tb.ruleChain.nodeAction.fetchLastLevelOnly') }}
          </Checkbox>
        </Form.Item>
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
          <Form.Item
            :label="t('tb.ruleChain.nodeAction.relationFilters')"
            :name="['relationsQuery', 'filters']"
            :rules="[{ validator: validatorRelationsQueryFilters }]"
          >
            <div class="p-2">
              <Table class="mapping-table">
                <tr class="header">
                  <th>{{ t('tb.ruleChain.nodeAction.relationType') }}</th>
                  <th>{{ t('tb.ruleChain.nodeAction.entityType') }}</th>
                </tr>
                <tr class="content" v-for="(filter, index) in formState.relationsQuery.filters" :key="index">
                  <td class="py-2 px-4">
                    <Select
                      v-model:value="filter.relationType"
                      :style="{ width: '100%' }"
                      :options="relationTypeOptions.map((item) => ({ value: item }))"
                    >
                      <template #dropdownRender="{ menuNode: menu }">
                        <v-nodes :vnodes="menu" />
                        <Divider style="margin: 4px 0" />
                        <Space style="padding: 4px 8px">
                          <Input
                            ref="inputRef"
                            v-model:value="addName"
                            :placeholder="t('tb.ruleChain.nodeAction.enterRelationType')"
                          />
                          <Button type="text" @click="addRelationType">
                            <template #icon>
                              <plus-outlined />
                            </template>
                            {{ t('tb.ruleChain.nodeAction.addRelationType') }}
                          </Button>
                        </Space>
                      </template>
                    </Select>
                  </td>
                  <td>
                    <Select
                      v-model:value="filter.entityTypes"
                      mode="multiple"
                      :style="{ width: '100%' }"
                      :options="entityTypeOptions"
                    />
                  </td>
                  <td>
                    <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                      <Icon
                        :icon="'ant-design:delete-outlined'"
                        :size="20"
                        color="red"
                        class="cursor-pointer"
                        @click="handleDeleteFilter(index)"
                      />
                    </Tooltip>
                  </td>
                </tr>
              </Table>
              <Button class="my-4" type="primary" @click="handleAddFilter">{{
                t('tb.ruleChain.nodeAction.addFilter')
              }}</Button>
            </div>
          </Form.Item>
        </div>
      </div>
    </div>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.dataToFetch') }}</p>
      <div class="p-2">
        <Form.Item name="dataToFetch">
          <Radio.Group
            v-model:value="formState.dataToFetch"
            button-style="solid"
            :style="{ display: 'flex' }"
            class="w-full"
          >
            <Radio.Button class="flex-1" value="ATTRIBUTES">{{ t('tb.ruleChain.nodeAction.attributes') }}</Radio.Button>
            <Radio.Button class="flex-1" value="LATEST_TELEMETRY">{{
              t('tb.ruleChain.nodeAction.latestTelemetry')
            }}</Radio.Button>
            <Radio.Button class="flex-1" value="FIELDS">{{
              t('tb.ruleChain.nodeAction.originatorFields')
            }}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
          <Form.Item name="dataMapping" :rules="[{ validator: validatorDataMapping }]">
            <template #label>
              <span v-if="formState.dataToFetch == 'ATTRIBUTES'">{{
                t('tb.ruleChain.nodeAction.attributeMapping')
              }}</span>
              <span v-else-if="formState.dataToFetch == 'LATEST_TELEMETRY'">{{
                t('tb.ruleChain.nodeAction.telemetryMapping')
              }}</span>
              <span v-else>{{ t('tb.ruleChain.nodeAction.originatorFieldsMapping') }}</span>
            </template>
            <Table class="mapping-table">
              <tr class="header">
                <th>{{ t('tb.ruleChain.nodeAction.sourceAttribute') }}</th>
                <th>{{ t('tb.ruleChain.nodeAction.targetAttribute') }}</th>
              </tr>
              <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
                <td class="py-2 px-4">
                  <Input
                    v-model:value="mapping.key"
                    :placeholder="t('tb.ruleChain.nodeAction.sourceAttributePlaceholder')"
                  />
                </td>
                <td>
                  <Input
                    v-model:value="mapping.value"
                    :placeholder="t('tb.ruleChain.nodeAction.targetAttributePlaceholder')"
                  />
                </td>
                <td>
                  <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
                    <Icon
                      :icon="'ant-design:delete-outlined'"
                      :size="20"
                      color="red"
                      class="cursor-pointer"
                      @click="handleDeleteMapping(index)"
                    />
                  </Tooltip>
                </td>
              </tr>
            </Table>
            <Button class="my-4" type="primary" @click="handleAddMapping">{{
              t('tb.ruleChain.nodeAction.addMapping')
            }}</Button>
            <Alert type="success" :message="t('tb.ruleChain.nodeAction.targetFieldTemplatingHelp')" />
          </Form.Item>
        </div>
        <Form.Item name="fetchTo">
          <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
            <span>{{ t('tb.ruleChain.nodeAction.addMappedAttributesTo') }}</span>
            <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
              <Radio.Button value="DATA">{{ t('tb.ruleChain.nodeAction.message') }}</Radio.Button>
              <Radio.Button value="METADATA">{{ t('tb.ruleChain.nodeAction.metadata') }}</Radio.Button>
            </Radio.Group>
          </div>
        </Form.Item>
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'related-entity-data',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import {
    Form,
    Input,
    Radio,
    Button,
    Tooltip,
    Divider,
    Space,
    Row,
    Col,
    Checkbox,
    InputNumber,
    Select,
    Alert,
  } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';

  interface Configuration {
    dataMapping: Recordable;
    dataToFetch: 'ATTRIBUTES' | 'LATEST_TELEMETRY' | 'FIELDS';
    fetchTo: 'METADATA' | 'DATA';
    relationsQuery: {
      direction: 'FROM' | 'TO';
      maxLevel: number;
      fetchLastLevelOnly: boolean;
      filters: Array<any>;
    };
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const VNodes = defineComponent({
    props: {
      vnodes: {
        type: Object,
        required: true,
      },
    },
    render() {
      return this.vnodes;
    },
  });

  const mappingList = ref<Array<any>>([]);

  const formRef = ref<FormInstance>();

  const relationTypeOptions = ref(['Contains', 'Manages']);

  const addName = ref();
  const inputRef = ref();
  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.DEVICE ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.EDGE
    );
  });

  const formState = reactive<any>({
    dataMapping: { serialNumber: 'sn' },
    dataToFetch: 'ATTRIBUTES',
    fetchTo: 'METADATA',
    relationsQuery: {
      direction: 'FROM',
      maxLevel: 1,
      fetchLastLevelOnly: false,
      filters: [{ relationType: 'Contains', entityTypes: [] }],
    },
  });

  watch(
    () => props.configuration,
    () => {
      mappingList.value = [];
      formState.dataMapping = props.configuration.dataMapping;
      formState.dataToFetch = props.configuration.dataToFetch;
      formState.fetchTo = props.configuration.fetchTo;
      formState.relationsQuery = props.configuration.relationsQuery;
      Object.keys(formState.dataMapping).forEach((key) => {
        mappingList.value.push({ key: key, value: formState.dataMapping[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        mappingList.value.forEach((mapping) => {
          data.dataMapping[mapping.key] = mapping.value;
        });
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorDataMapping() {
    if (mappingList.value.length < 1) {
      return Promise.reject(t('tb.ruleChain.nodeAction.mappingRequired'));
    } else {
      let validateTag = true;
      mappingList.value.forEach((mapping) => {
        if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
          validateTag = false;
        }
      });
      if (!validateTag) {
        return Promise.reject(t('tb.ruleChain.nodeAction.fieldsMappingNotEmpty'));
      } else {
        return Promise.resolve();
      }
    }
  }

  function validatorRelationsQueryFilters() {
    let validateTag = true;

    formState.relationsQuery.filters.forEach((filter) => {
      if (isEmpty(filter.relationType) || isEmpty(filter.entityTypes)) {
        validateTag = false;
      }
    });
    if (!validateTag) {
      return Promise.reject(t('tb.ruleChain.nodeAction.relationFiltersNotEmpty'));
    } else {
      return Promise.resolve();
    }
  }

  function handleDeleteMapping(index: number) {
    mappingList.value.splice(index, 1);
  }

  function handleAddMapping() {
    mappingList.value.push({ key: '', value: '' });
  }

  function handleAddFilter() {
    if (isEmpty(formState.relationsQuery.filters)) {
      formState.relationsQuery.filters = [];
    }
    formState.relationsQuery.filters.push({ relationType: 'Contains', entityTypes: [] });
  }

  function handleDeleteFilter(index: number) {
    formState.relationsQuery.filters.splice(index, 1);
  }

  function addRelationType(e) {
    e.preventDefault();
    relationTypeOptions.value.push(addName.value);
    addName.value = '';
    setTimeout(() => {
      inputRef.value?.focus();
    }, 0);
  }

  defineExpose({ getConfiguration });
</script>

<style lang="less">
  .ant-form-item-has-error {
    .mapping-table {
      border: 1px solid #ff4d4f;
    }
  }

  .mapping-table {
    width: 100%;
    align: 'center';
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
      border-bottom: 1px solid @border-color-base;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      color: @border-color-base;
    }

    .td {
      padding: 2px 2px;
    }
  }
</style>
