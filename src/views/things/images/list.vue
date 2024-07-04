<template>
    <div class="image-list">
        <BasicTable @register="registerTable">
            <template #headerTop>
                {{ t(getTitle.value) }}
            </template>
            <template #leftToolbar>
                <a-button type="primary" @click="handleUpload({})">
                    <Icon icon="ant-design:upload-outlined" /> 上传图片
                </a-button>
                <a-input v-model:value="searchParam.textSearch" placeholder="输入搜索内容" allow-clear @change="reload"
                    style="width: 240px;">
                    <template #suffix>
                        <icon icon="ant-design:search-outlined" />
                    </template>
                </a-input>
                <template v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
                    <Checkbox v-model:checked="searchParam.includeSystemImages" @change="reload()">
                        包含系统图像
                    </Checkbox>
                </template>
            </template>
            <template #toolbar>
                <Tooltip placement="top">
                    <template #title>
                        <span>{{ t('贴换布局') }}</span>
                    </template>
                    <Icon @click="handleChangeLayout('list')" v-if="layout == 'grid'" style="margin-top: 6px;" :size="20"
                        icon="ant-design:bars-outlined" />
                    <Icon @click="handleChangeLayout('grid')" v-if="layout == 'list'" style="margin-top: 6px;" :size="20"
                        icon="ant-design:appstore-outlined" />
                </Tooltip>
            </template>
            <template #firstColumn="{ record }">
                <Space>
                    <img :src="record.preview" :width="40" :alt="record.name" class="cursor-pointer"
                        @click="handleDetail(record)">
                    {{ record.title }}
                    <!-- <span class="hidden">{{ record.preview }}</span> -->
                </Space>

            </template>
            <template #resolution="{ record }">
                {{ record.descriptor.width }}×{{ record.descriptor.height }}
            </template>
            <template #descriptorSize="{ record }">
                <div v-if="record.descriptor.size">
                    {{ convertBytesToSize(record.descriptor.size) }}
                </div>
                <div v-else>
                    -
                </div>
            </template>
            <template #isSystem="{ record }">
                <Checkbox :checked="record.link.indexOf('system') > -1" />
            </template>

        </BasicTable>
        <!-- <List v-if="layout == 'grid'" :dataSource="getDataSource()"
            :grid="{ gutter: 5, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }">
            <template #renderItem="{ item }">
                <List.Item v-bind:style="{ padding: '6px' }">
                    <img :src="item.preview" :width="40" :alt="item.name" class="cursor-pointer"
                        @click="handleDetail(item)">
                </List.Item>
            </template>
        </List> -->
        <EmbedImage @register="registerEmbedModal" />
        <Detail @register="registerDetailModal" @upload="handleUpload" @download="handleDownload"
            @embed="handleEmbedImage" />
        <ImageUpload @register="registerUploadModal" @success="reload" />
    </div>
</template>
<script lang="ts">
export default defineComponent({
    name: "ImageList",
});
</script>
<script lang="ts" setup>
import { defineComponent, reactive, ref } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { convertBytesToSize } from '/@/utils';
import { useModal } from '/@/components/Modal';
import { useUserStore } from '/@/store/modules/user';
import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
import { useMessage } from '/@/hooks/web/useMessage';
import { Icon } from '/@/components/Icon';
import { router } from '/@/router';
import { imageList, imagePreview, deleteImage, downloadImage } from '/@/api/things/images';
import { Space, Checkbox, Tooltip, List } from 'ant-design-vue';
import EmbedImage from './embedImage.vue';
import Detail from './detail.vue';
import ImageUpload from './upload.vue';
import { Authority } from '/@/enums/authorityEnum';
import { downloadByData } from '/@/utils/file/download';

const { t } = useI18n('things');
const userStore = useUserStore();
const { createConfirm, showMessage } = useMessage();

const layout = ref('list');

const getTitle = {
    value: router.currentRoute.value.meta.title || '图片集',
};

const searchParam = reactive({
    textSearch: '',
    includeSystemImages: false,
})

const tableColumns: BasicColumn[] = [
    {
        title: t('名称'),
        dataIndex: 'title',
        key: 'title',
        sorter: true,
        align: 'left',
        fixed: 'left',
        slot: 'firstColumn',
    },
    {
        title: t('创建时间'),
        dataIndex: 'createdTime',
        key: 'createdTime',
        format: 'date|YYYY-MM-DD HH:mm:ss',
        sorter: true,
        width: 160,
        align: 'center',
    },
    {
        title: '分辨率',
        dataIndex: 'descriptor.height',
        key: 'descriptor.height',
        align: 'center',
        width: 100,
        slot: 'resolution',

    },
    {
        title: t('文件大小'),
        dataIndex: 'descriptor.size',
        key: 'descriptor.size',
        sorter: true,
        width: 100,
        align: 'right',
        slot: 'descriptorSize',
    },
    {
        title: '系统',
        dataIndex: 'link',
        key: 'link',
        ifShow: userStore.getAuthority == Authority.TENANT_ADMIN,
        width: 80,
        align: 'center',
        slot: 'isSystem',
    },

]

const actionColumn: BasicColumn = {
    width: 180,
    actions: (record: Recordable) => [
        {
            icon: 'ant-design:download-outlined',
            title: t('下载图片'),
            onClick: handleDownload.bind(this, { ...record }),
        },
        {
            icon: 'ant-design:code-outlined',
            title: t('嵌入图片'),
            onClick: handleEmbedImage.bind(this, { ...record }),
        },
        {
            icon: 'clarity:note-edit-line',
            color: "success",
            title: t('修改图片'),
            onClick: handleDetail.bind(this, { ...record }),
        },
        {
            icon: 'ant-design:delete-outlined',
            color: 'error',
            ifShow: !!!(userStore.getAuthority == Authority.TENANT_ADMIN && record.link.indexOf('system') > -1),
            title: t('删除图片'),
            onClick: handleDelete.bind(this, { ...record }),
        },
    ],
};


const [registerEmbedModal, { openModal: openEmbedModal }] = useModal();
const [registerDetailModal, { openModal: openDetailModal }] = useModal();
const [registerUploadModal, { openModal: openUploadModal }] = useModal();
// const [registerDrawer, { openDrawer }] = useDrawer();
const [registerTable, { reload, getDataSource,getSize }] = useTable({
    rowKey: (record) => record.id.id,
    api: params => imageList(params, searchParam.includeSystemImages),
    beforeFetch: wrapFetchParams,
    afterFetch: handleFetchAfter,
    defSort: { sortProperty: 'createdTime', sortOrder: 'DESC' },
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: true,
    useSearchForm: false,
    canResize: true,
});


function wrapFetchParams(fetchParam: any) {

    const page = fetchParam.page ? fetchParam.page - 1 : 0;
    return { ...fetchParam, page: page, textSearch: searchParam.textSearch }
}

async function handleFetchAfter(dataList) {
    for (let i = 0; i < dataList.length; i++) {
        dataList[i].preview = await fetchPreviewImage(dataList[i]);
    }
    return dataList;
}

async function handleDelete(record: Recordable) {
    createConfirm({
        iconType: 'error',
        title: `确定删除图片${record.title}吗？`,
        content: '请注意：确认后，图片和所有相关数据将不可恢复。',
        centered: false,
        okText: '删除',
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
        onOk: async () => {
            try {
                await deleteImage(record.link);
                showMessage('删除图片成功！');
                handleSuccess();
            } catch (error: any) {
                if (error.success == false) {
                    forceDelete(record, error)

                }
                console.log(error);
            }
        }

    })
}
async function forceDelete(record: Recordable, errorMsg: any) {
    const showEntities: any[] = [];
    const types = Object.keys(errorMsg.references);
    types.forEach(type => {
        const entities = errorMsg.references[type];
        entities.forEach(entity => {
            showEntities.push({ type: type, name: entity.name })
        })
    })
    createConfirm({
        iconType: 'error',
        title: `图片被其他实体引用`,
        content: '请注意：确认后，图片和所有相关数据将不可恢复。',
        centered: false,
        okText: '强制删除',
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
        onOk: async () => {
            try {
                await deleteImage(record.link, true);
                showMessage('删除图片成功！');
            } catch (error: any) {
                console.log(error);
            } finally {
                handleSuccess();
            }
        }

    })
}

async function fetchPreviewImage(record: Recordable) {
    return new Promise(resolve => {
        imagePreview(record.link).then((file) => {
            let fileReader = new FileReader();
            fileReader.onloadend = (e) => {
                resolve(e.target?.result);
            }
            fileReader.readAsDataURL(file);
        })
    })

}

function handleChangeLayout(dist: string) {
    layout.value = dist;

}

async function handleDownload(record: Recordable) {
    const res = await downloadImage(record.link);
    let name = res.headers['content-disposition'];
    name = name && name.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    name = name && name.length >= 1 && name[1].replace("utf-8'zh_cn'", '');
    downloadByData(res.data, name);
}

function handleSuccess() {
    reload();
}

function handleEmbedImage(record: Recordable) {
    openEmbedModal(true, record);
}

function handleDetail(record: Recordable) {
    openDetailModal(true, record);
}

function handleUpload(record: Recordable) {
    openUploadModal(true, record);
}




</script>

<style lang="less">
.image-list {}
</style>