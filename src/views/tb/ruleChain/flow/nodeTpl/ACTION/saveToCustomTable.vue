<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="自定义表名称" name="tableName" :rules="[{ required: true, message: '自定义表名称必填!' }]"
            help="输入不带前缀“cs_tb_”的表名。">
            <Input v-model:value="formState.tableName" />
        </Form.Item>
        <Form.Item label="属性映射" name="fieldsMapping" :rules="[{ validator: validatorFieldsMapping }]">
            <Table class="mapping-table">
                <tr class="header">
                    <th>Message FileId</th>
                    <th>Table column</th>
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
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "save-to-custom-table",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Input, Button, Tooltip } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    fieldsMapping: Recordable,
    tableName: string,
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
    fieldsMapping: {},
    tableName: undefined,
});

watch(
    () => props.configuration,
    () => {
        mappingList.value = [];
        formState.fieldsMapping = props.configuration.fieldsMapping;
        formState.tableName = props.configuration.tableName;
        Object.keys(formState.fieldsMapping).forEach(key => {
            mappingList.value.push({ key: key, value: formState.fieldsMapping[key] })
        })
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        const data = await formRef.value?.validate();
        if (data) {
            mappingList.value.forEach(mapping => {
                data.fieldsMapping[mapping.key] = mapping.value;
            })
        }

        return data;
    } catch (error: any) {
        throw error;
    }
}

function validatorFieldsMapping() {
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
