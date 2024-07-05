<template>
    <div class="image-list">
        <TableHeader :style="{ padding: '5px 2px 5px 7px' }">
            <template #headerTop>
                {{ t(getTitle.value) }}
            </template>
            <template #leftToolbar>
                <a-button type="primary" @click="handleUpload({})">
                    <Icon icon="ant-design:upload-outlined" /> 上传图片
                </a-button>
                <a-input v-model:value="searchParam.textSearch" placeholder="输入搜索内容" allow-clear @change="fetch()"
                    style="width: 240px;">
                    <template #suffix>
                        <icon icon="ant-design:search-outlined" />
                    </template>
                </a-input>
                <template v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
                    <Checkbox v-model:checked="searchParam.includeSystemImages" @change="fetch()">
                        包含系统图像
                    </Checkbox>
                </template>
            </template>
            <template #toolbar>
                <Tooltip placement="top">
                    <template #title>
                        <span>{{ t('贴换布局') }}</span>
                    </template>
                    <Icon @click="handleChangeLayout('list')" v-if="layout == 'grid'" style="margin-top: 6px;" :size="24"
                        icon="ant-design:bars-outlined" />
                    <Icon @click="handleChangeLayout('grid')" v-if="layout == 'list'" style="margin-top: 6px;" :size="24"
                        icon="ant-design:appstore-outlined" />
                </Tooltip>
                <Tooltip placement="top">
                    <template #title>
                        <span>{{ t('刷新') }}</span>
                    </template>
                    <Icon @click="fetch()" style="margin-top: 6px;" :size="24" icon="ant-design:redo-outlined" />
                </Tooltip>

            </template>
        </TableHeader>
        <BasicTable @register="registerTable" :data-source="dataSource" :pagination="paginationSetting"
            v-if="layout == 'list'">
            <template #firstColumn="{ record }">

                <Space>
                    <div class="h-10 w-10 bg-white flex justify-center">
                        <img :src="record.preview" :alt="record.name" class="cursor-pointer h-full"
                            @click="handleDetail(record)">
                    </div>
                    {{ record.title }}
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
        <List v-if="layout == 'grid'" :dataSource="dataSource"
            :grid="{ gutter: 5, xs: 1, sm: 2, md: 2, lg: 3, xl: 5, xxl: 6 }">
            <template #renderItem="{ item }">
                <List.Item v-bind:style="{ padding: '6px' }">
                    <div class="h-80 border rounded-md border-slate-200 bg-slate-100 p-2 ">
                        <div class="h-60 w-full flex justify-center py-2 ">
                            <img :src="item.preview" :alt="item.name" class="cursor-pointer h-full"
                                @click="handleDetail(item)">
                        </div>
                        <div class="flex flex-col justify-between h-16">
                            <div class="font-medium">
                                {{ item.name }}
                            </div>
                            <Space :size="1">
                                <template #split>
                                    <Divider type="vertical" />
                                </template>
                                <div class="text-zinc-500">{{ item.descriptor?.width }}×{{ item.descriptor?.height }}</div>
                                <div class="text-zinc-500"> {{ convertBytesToSize(item.descriptor?.size) }}</div>
                            </Space>
                        </div>
                    </div>

                </List.Item>
            </template>
        </List>
        <EmbedImage @register="registerEmbedModal" />
        <Detail @register="registerDetailModal" @upload="handleUpload" @download="handleDownload"
            @embed="handleEmbedImage" />
        <ImageUpload @register="registerUploadModal" @success="fetch()" />
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
import { BasicTable, BasicColumn, useTable, TableHeader } from '/@/components/Table';
import { useMessage } from '/@/hooks/web/useMessage';
import { Icon } from '/@/components/Icon';
import { router } from '/@/router';
import { imageList, imagePreview, deleteImage, downloadImage } from '/@/api/things/images';
import { Space, Checkbox, Tooltip, List, Divider } from 'ant-design-vue';
import EmbedImage from './embedImage.vue';
import Detail from './detail.vue';
import ImageUpload from './upload.vue';
import { Authority } from '/@/enums/authorityEnum';
import { downloadByData } from '/@/utils/file/download';
import { ResourceInfo } from '/@/api/things/resourceLibrary';
import { PAGE_SIZE } from '/@/components/Table/src/const';
import { onMounted } from 'vue';

const { t } = useI18n('things');
const userStore = useUserStore();
const { createConfirm, showMessage } = useMessage();

const layout = ref('list');

const getTitle = {
    value: router.currentRoute.value.meta.title || '图片集',
};

const dataSource = ref<ResourceInfo[]>([]);

const searchParam = reactive({
    textSearch: '',
    includeSystemImages: false,
})

const paginationSetting = reactive({
    total: 0,
    pageSize: PAGE_SIZE,
    current: 1,
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
const [registerTable] = useTable({
    rowKey: (record) => record.id.id,
    onChange: fetch,
    columns: tableColumns,
    actionColumn: actionColumn,
    showTableSetting: false,
    useSearchForm: false,
    canResize: true,
});

onMounted(() => {
    fetch();
})


async function fetch(pagination?: any, filters?: any, sorter?: any) {
    const params = {
        pageSize: pagination?.pageSize ? pagination.pageSize : PAGE_SIZE,
        page: pagination?.current ? pagination.current - 1 : 0,
        textSearch: searchParam.textSearch,
        sortProperty: sorter?.field ? sorter.field : 'createdTime',
        sortOrder: sorter?.order ? sorter.order.replace('end', '') : 'DESC',
    }
    try {
        const result = await imageList(params, searchParam.includeSystemImages);
        dataSource.value = result.data;
        paginationSetting.total = result.totalElements;
        paginationSetting.current = params.page + 1;
    } catch (error) {
        console.log(error);
    } finally {
        for (let i = 0; i < dataSource.value.length; i++) {
            await fetchPreviewImage(dataSource.value[i]).then(base64 => dataSource.value[i].preview = base64)
        }
    }

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