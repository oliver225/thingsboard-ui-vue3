<template>
    <div class="tenant-profile-list">
        <BasicTable @register="registerTable">
            <template #headerTop>
                {{ t(getTitle.value) }}
            </template>
            <template #leftToolbar>
                <a-button type="primary" @click="handleForm({})">
                    <Icon icon="fluent:add-12-filled" /> 新增租户配置
                </a-button>
                <a-input v-model:value="searchParam.textSearch" placeholder="输入搜索内容" allow-clear @change="reload"
                    style="width: 240px;">
                    <template #suffix>
                        <icon icon="ant-design:search-outlined" />
                    </template>
                </a-input>
            </template>
            <template #firstColumn="{ record }">
                <a @click="handleDetail({ id: record.id, })" :title="record.name">
                    {{ record.name }}
                </a>
            </template>
            <template #isolatedTbRuleEngine="{ record }">
                <Checkbox :checked="record.isolatedTbRuleEngine" />
            </template>
            <template #default="{ record }">
                <Checkbox :checked="record.default" />
            </template>

        </BasicTable>
        <InputForm @register="registerModal" @success="handleSuccess" />
        <DetailDrawer @register="registerDrawer" @edit="handleForm" @delete="handleDelete"
            @default="handleSetProfileDefault" />
    </div>
</template>
<script lang="ts">
export default defineComponent({
    name: "TenantProfileList",
});
</script>
<script lang="ts" setup>
import { defineComponent } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useModal } from '/@/components/Modal';
import { useDrawer } from '/@/components/Drawer';
import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
import { useMessage } from '/@/hooks/web/useMessage';
import { Icon } from '/@/components/Icon';
import { router } from '/@/router';
import { tenantProfileList, deleteTenantProfile, setTenantProfileDefault } from '/@/api/things/tenantProfile';
import { reactive } from 'vue';
import InputForm from './form.vue';
import DetailDrawer from './detail.vue';
import { Checkbox } from 'ant-design-vue';



const { t } = useI18n('things');
const { createConfirm, showMessage } = useMessage();

const getTitle = {
    value: router.currentRoute.value.meta.title || '租户配置',
};


const searchParam = reactive({
    textSearch: '',
})
const tableColumns: BasicColumn[] = [
    {
        title: t('配置名称'),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        width: 260,
        align: 'left',
        fixed: 'left',
        slot: 'firstColumn',
    },
    {
        title: '描述信息',
        dataIndex: 'description',
        key: 'description',
        align: 'left',
        ellipsis: true,
    },
    {
        title: '独立规则引擎',
        dataIndex: 'isolatedTbRuleEngine',
        key: 'isolatedTbRuleEngine',
        width: 120,
        align: 'center',
        slot: 'isolatedTbRuleEngine',
    },
    {
        title: '默认',
        dataIndex: 'default',
        key: 'default',
        width: 120,
        align: 'center',
        slot: 'default',
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
]

const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
        {
            icon: 'ant-design:flag-outlined',
            title: t('设为默认'),
            onClick: handleSetProfileDefault.bind(this, { ...record }),
            ifShow: !!!record?.default,
        },
        {
            icon: 'ant-design:delete-outlined',
            color: 'error',
            title: t('删除租户配置'),
            onClick: handleDelete.bind(this, { ...record }),
        },
    ],
};

const [registerModal, { openModal }] = useModal();
const [registerDrawer, { openDrawer }] = useDrawer();
const [registerTable, { reload }] = useTable({
    api: tenantProfileList,
    beforeFetch: wrapFetchParams,
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


function handleForm(record: Recordable) {
    openModal(true, record);
}

async function handleDelete(record: Recordable) {
    const modalFunc = createConfirm({
        iconType: 'error',
        title: `确定删除租户配置[${record.name}]吗？`,
        content: '请注意：确认后，租户配置和所有相关数据将不可恢复。',
        centered: false,
        okText: '删除',
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
        onCancel: () => modalFunc.destroy(),
        onOk: async () => {
            try {
                await deleteTenantProfile(record.id.id);
                showMessage('删除租户配置成功！');
            } catch (error: any) {
                console.log(error);
            } finally {
                modalFunc.destroy();
                handleSuccess();
            }
        }

    })
}

async function handleSetProfileDefault(record: Recordable) {
    const modalFunc = createConfirm({
        iconType: 'warning',
        title: `确定将租户配置[${record.name}]设置为默认吗？`,
        centered: false,
        okText: '确定',
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
        onCancel: () => modalFunc.destroy(),
        onOk: async () => {
            try {
                await setTenantProfileDefault(record.id.id);
                showMessage('设置默认租户配置成功！');
            } catch (error: any) {
                console.log(error);
            } finally {
                modalFunc.destroy();
                handleSuccess();
            }
        }

    })
}

function handleSuccess() {
    reload();
}

function handleDetail(record: Recordable) {
    openDrawer(true, record);
}


</script>
<style lang="less">
.tenant-profile-list {}
</style>