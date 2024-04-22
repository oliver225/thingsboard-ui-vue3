<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item name="fetchAlarmRulesStateOnStart">
            <Checkbox v-model:value="formState.fetchAlarmRulesStateOnStart">
                保持报警规则状态
            </Checkbox>
        </Form.Item>
        <Form.Item name="persistAlarmRulesState">
            <Checkbox v-model:value="formState.persistAlarmRulesState">
                获取报警规则状态
            </Checkbox>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "device-profile",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Checkbox } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    fetchAlarmRulesStateOnStart: boolean,
    persistAlarmRulesState: boolean,

}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    fetchAlarmRulesStateOnStart: false,
    persistAlarmRulesState: false,
});

watch(
    () => props.configuration,
    () => {
        formState.fetchAlarmRulesStateOnStart = props.configuration.fetchAlarmRulesStateOnStart;
        formState.persistAlarmRulesState = props.configuration.persistAlarmRulesState;
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        return await formRef.value?.validate();
    } catch (error: any) {
        throw error;
    }
}

defineExpose({ getConfiguration })

</script>
