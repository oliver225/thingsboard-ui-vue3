<template>
    <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
        <template #title>
            <div class="flex flex-row items-center">
                <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
                <div class="flex flex-col">
                    <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
                    <span class="text-sm">OTA 升级详情</span>
                </div>
            </div>
        </template>
        <Space size="middle" class="mb-3">
            <a-button type="primary success" @click="handleEditOtaPackage">
                <Icon :icon="'clarity:note-edit-line'" />编辑包
            </a-button>
            <a-button type="primary" @click="handleDownload" :disabled="!record.dataSize">
                <Icon :icon="'ant-design:download-outlined'" />下载包
            </a-button>
            <a-button type="primary" danger @click="handleDeleteOtaPackage">
                <Icon :icon="'ant-design:delete-outlined'" />删除包
            </a-button>
        </Space>
        <br />
        <Space size="middle" class="mb-3">
            <a-button @click="handleCopyOtaPackageInfoId">
                <Icon :icon="'ant-design:copy-filled'" />
                复制包ID
            </a-button>
            <a-button @click="handleCopyChecksum" v-if="!isEmpty(record.checksum)">
                <Icon :icon="'ant-design:copy-filled'" />
                复制校验和
            </a-button>
        </Space>
        <div class="px-4 py-2 pointer-events-none">
            <Form ref="formRef" layout="vertical">
                <Row :gutter="16">
                    <Col :span="8">
                    <Form.Item label="标题" name="title">
                        <Input :value="record.title" placeholder="标题" />
                    </Form.Item>
                    </Col>
                    <Col :span="8">
                    <Form.Item label="版本" name="version">
                        <Input :value="record.version" placeholder="版本" />
                    </Form.Item>
                    </Col>
                    <Col :span="8">
                    <Form.Item label="版本标签" name="tag">
                        <Input :value="record.tag" placeholder="版本标签" />
                    </Form.Item>
                    </Col>
                    <Col :span="8">
                    <Form.Item label="包类型" name="type">
                        <Select :value="record.type" placeholder="包类型">
                            <Select.Option value="FIRMWARE">固件</Select.Option>
                            <Select.Option value="SOFTWARE">软件</Select.Option>
                        </Select>
                    </Form.Item>
                    </Col>
                    <Col :span="16">
                    <Form.Item label="设备配置" :name="['deviceProfileId', 'id']">
                        <Select :value="record.deviceProfileId?.id" placeholder="设备配置">
                            <Select.Option :value="deviceProfile?.id?.id">{{ deviceProfile?.name }}</Select.Option>
                        </Select>
                    </Form.Item>
                    </Col>
                    <template v-if="!isEmpty(record.checksum)">
                        <Col :span="8">
                        <Form.Item label="校验和算法" name="checksumAlgorithm">
                            <Input :value="record.checksumAlgorithm" placeholder="校验和算法" />
                        </Form.Item>
                        </Col>
                        <Col :span="16">
                        <Form.Item label="校验和" name="checksum">
                            <Input :value="record.checksum" placeholder="校验和" />
                        </Form.Item>
                        </Col>
                    </template>
                    <template v-if="!isEmpty(record.fileName)">
                        <Col :span="8">
                        <Form.Item label="文件名" name="fileName">
                            <Input :value="record.fileName" placeholder="文件名" />
                        </Form.Item>
                        </Col>
                        <Col :span="8">
                        <Form.Item label="文件大小（以字节为单位）" name="dataSize">
                            <Input :value="record.dataSize" placeholder="文件大小" />
                        </Form.Item>
                        </Col>
                        <Col :span="8">
                        <Form.Item label="内容类型" name="dataSize">
                            <Input :value="record.contentType" placeholder="内容类型" />
                        </Form.Item>
                        </Col>
                    </template>
                </Row>
                <Form.Item label="说明" :name="['additionalInfo', 'description']">
                    <Textarea :value="record.additionalInfo?.description" placeholder="说明" />
                </Form.Item>
            </Form>
        </div>

    </BasicDrawer>
</template>
<script lang="ts" setup name="OtaPackageDetail">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { isEmpty } from 'lodash';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { OtaPackageInfo, getOtaPackageInfoById } from '/@/api/things/otaPackage';
import { getDeviceProfileInfoById, DeviceProfileInfo } from '/@/api/things/deviceProfile';
import { Space, Form, Input, Textarea, Select, Row, Col } from 'ant-design-vue';


const emit = defineEmits(['edit', 'delete', 'download', 'register',]);

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<OtaPackageInfo>({} as OtaPackageInfo);

const deviceProfile = ref<DeviceProfileInfo>();

const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
}));


const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
        setDrawerProps({ loading: true });
        await clear();
        record.value = await getOtaPackageInfoById(data.id.id);
        if (record.value.deviceProfileId?.id) {
            deviceProfile.value = await getDeviceProfileInfoById(record.value.deviceProfileId.id);
        }
    } catch (error: any) {
        if (error.message) {
            showMessage(error.message, 'error')
        }
        console.log('error', error);
    } finally {
        setDrawerProps({ loading: false });
    }
});

async function clear() {
    record.value = {} as OtaPackageInfo;
}

function handleCopyOtaPackageInfoId() {
    copyToClipboard(record.value.id.id, '复制OTA包ID成功！')
}

function handleCopyChecksum() {
    if (record.value.checksum) {
        copyToClipboard(record.value.checksum, '复制校验和成功！')
    }

}

function handleDeleteOtaPackage() {
    emit('delete', record.value);
    closeDrawer();
}

function handleEditOtaPackage() {
    emit('edit', record.value);
    closeDrawer();
}

function handleDownload() {
    emit('download', record.value);
    closeDrawer();
}

</script>