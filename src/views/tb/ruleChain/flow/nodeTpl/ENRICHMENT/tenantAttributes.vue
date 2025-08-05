<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item name="dataToFetch">
            <div class="flex justify-center mb-2">
                <Radio.Group v-model:value="formState.dataToFetch" button-style="solid">
                    <Radio.Button value="ATTRIBUTES">Attributes</Radio.Button>
                    <Radio.Button value="LATEST_TELEMETRY">Last telemetry</Radio.Button>
                </Radio.Group>
            </div>
        </Form.Item>

        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <Form.Item :label="formState.dataToFetch == 'ATTRIBUTES' ? '属性映射' : '遥测数据映射'" name="dataMapping"
                :rules="[{ validator: validatorDataMapping }]">
                <Table class="mapping-table">
                    <tr class="header">
                        <th>原属性</th>
                        <th>目标属性</th>
                    </tr>
                    <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
                        <td class="py-2 px-4">
                            <Input v-model:value="mapping.key" placeholder="输入原属性" />
                        </td>
                        <td> <Input v-model:value="mapping.value" placeholder="输入目标属性" />
                        </td>
                        <td>
                            <Tooltip title="删除" class="pl-4">
                                <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                                    @click="handleDeleteMapping(index)" />
                            </Tooltip>
                        </td>
                    </tr>
                </Table>
                <Button class="my-4" type="primary" @click="handleAddMapping">添加映射</Button>
                <Alert type="success" message="所有输入字段都支持模板化。使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。" />
            </Form.Item>
        </div>
        <Form.Item name="fetchTo">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <span>添加映射属性到</span>
                <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
                    <Radio.Button value="DATA">Message</Radio.Button>
                    <Radio.Button value="METADATA">Metadata</Radio.Button>
                </Radio.Group>
            </div>

        </Form.Item>



    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "tenant-attributes",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Radio, Button, Tooltip, Alert } from 'ant-design-vue';
import { Icon } from '/@/components/Icon';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    dataMapping: Recordable,
    dataToFetch: 'ATTRIBUTES' | 'LATEST_TELEMETRY',
    fetchTo: 'METADATA' | 'DATA'
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const mappingList = ref<Array<any>>([]);

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    dataMapping: { alarmThreshold: 'threshold' },
    dataToFetch: 'ATTRIBUTES',
    fetchTo: 'METADATA',
});

watch(
    () => props.configuration,
    () => {
        mappingList.value = [];
        formState.dataMapping = props.configuration.dataMapping;
        formState.dataToFetch = props.configuration.dataToFetch;
        formState.fetchTo = props.configuration.fetchTo;
        Object.keys(formState.dataMapping).forEach(key => {
            mappingList.value.push({ key: key, value: formState.dataMapping[key] })
        })
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        const data = await formRef.value?.validate();
        if (data) {
            mappingList.value.forEach(mapping => {
                data.dataMapping[mapping.key] = mapping.value;
            })
        }
        return data;
    } catch (error: any) {
        throw error;
    }
}

function validatorDataMapping() {
    if (mappingList.value.length < 1) {
        return Promise.reject('属性映射必填！');
    } else {
        let validateTag = true;
        mappingList.value.forEach(mapping => {
            if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
                validateTag = false;
            }
        })
        if (!validateTag) {
            return Promise.reject('属性映射不能存在空值！');
        } else {
            return Promise.resolve();
        }

    }
}

function handleDeleteMapping(index: number) {
    mappingList.value.splice(index, 1)
}

function handleAddMapping() {
    mappingList.value.push({ key: '', value: '' })
}

defineExpose({ getConfiguration })

</script>

<style lang="less">
.ant-form-item-has-error {
    .mapping-table {
        border: 1px solid #ff4d4f;
    }
}

.mapping-table {
    width: 100%;
    align: "center";
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
