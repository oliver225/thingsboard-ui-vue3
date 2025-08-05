<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <Form.Item label="原始字段映射" name="dataMapping" :rules="[{ validator: validatorDataMapping }]">
                <Table class="mapping-table">
                    <tr class="header">
                        <th>原字段</th>
                        <th>目标字段</th>
                    </tr>
                    <tr class="content" v-for="(mapping, index) in mappingList" :key="index">
                        <td class="py-2 px-4">
                            <Select v-model:value="mapping.key" :options="mappingKeyOptions" />
                        </td>
                        <td> <Input v-model:value="mapping.value" placeholder="输入目标字段" />
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
                <Alert type="success" message="目标关键字段支持模板化。使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。" />
            </Form.Item>
        </div>
        <Form.Item name="fetchTo">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <span>添加原始字段映射到</span>
                <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
                    <Radio.Button value="DATA">Message</Radio.Button>
                    <Radio.Button value="METADATA">Metadata</Radio.Button>
                </Radio.Group>
            </div>

        </Form.Item>
        <Form.Item name="ignoreNullStrings">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <Checkbox v-model:checked="formState.ignoreNullStrings">
                    跳过空字段
                </Checkbox>
            </div>
        </Form.Item>



    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "originator-fields",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Select, Radio, Button, Checkbox, Tooltip, Alert } from 'ant-design-vue';
import { Icon } from '/@/components/Icon';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    dataMapping: Recordable,
    ignoreNullStrings: boolean,
    fetchTo: 'METADATA' | 'DATA'
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const mappingKeyOptions = [
    { value: 'createdTime', label: '创建时间' },
    { value: 'name', label: '名称' },
    { value: 'firstName', label: '名字' },
    { value: 'lastName', label: '姓氏' },
    { value: 'email', label: '电子邮件' },
    { value: 'title', label: '标题' },
    { value: 'country', label: '国家' },
    { value: 'state', label: '省' },
    { value: 'city', label: '城市' },
    { value: 'address', label: '地址' },
    { value: 'address2', label: '地址2' },
    { value: 'zip', label: '邮政编码' },
    { value: 'phone', label: '电话' },
    { value: 'label', label: '标签' },
    { value: 'id', label: 'Id' }
]

const mappingList = ref<Array<any>>([]);

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    dataMapping: { name: 'originatorName' },
    ignoreNullStrings: false,
    fetchTo: 'METADATA',
});

watch(
    () => props.configuration,
    () => {
        mappingList.value = [];
        formState.dataMapping = props.configuration.dataMapping;
        formState.ignoreNullStrings = props.configuration.ignoreNullStrings;
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
        return Promise.reject('原始字段映射必填！');
    } else {
        let validateTag = true;
        mappingList.value.forEach(mapping => {
            if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
                validateTag = false;
            }
        })
        if (!validateTag) {
            return Promise.reject('原始字段映射不能存在空值！');
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
