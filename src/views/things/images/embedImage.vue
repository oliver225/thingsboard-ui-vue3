<template>
    <BasicModal v-bind="$attrs" :footer="undefined" @register="registerModal" width="50%">
        <template #title>
            <Icon icon="ant-design:code-outlined" class="pr-1 m-1" />
            <span> 嵌入图片 </span>
        </template>
        <div class="border border-neutral-300 rounded-md  px-4 py-2 mb-4">
            <div>嵌入HTML</div>
            <div>
                <p>使用以下代码片段，您可以将图片嵌入到基于纯HTML的组件中。</p>
                <p>这类组件包括HTML卡片部件、单元格内容功能等。</p>
            </div>
            <div>

                <CodeEditor v-model:value="embedHtmlCode" :mode="'javascript'" class="border border-gray-400" />
            </div>
        </div>
        <div class="border border-neutral-300 rounded-md  px-4 py-2 mb-4">
            <div>嵌入VUE Template</div>
            <div>
                <p>使用以下代码片段，您可以在VUE的HTML模板中嵌入图片，这些模板将用于组件中。</p>
                <p>这类组件包括Markdown部件、部件编辑器中的HTML部分、自定义操作等。</p>
            </div>
            <div>
                <CodeEditor v-model:value="embedVueCode" :mode="'javascript'" class="border border-gray-400" />


            </div>
        </div>
    </BasicModal>
</template>
<script lang="ts" setup name="EmbedImage">
import { Icon } from '/@/components/Icon';
import { ref } from 'vue';
import { CodeEditor } from '/@/components/CodeEditor';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { ResourceInfo } from '/@/api/things/resourceLibrary';

const emit = defineEmits(['register']);

const record = ref<ResourceInfo>({} as ResourceInfo);


const embedHtmlCode = ref<String>('<img src="/api/images/public/7DI9oupw00AbhLnaLuT4GlOZXR6lEc3f" alt="&quot;Count widgets&quot; system bundle image" />');

const embedVueCode = ref<String>('<img [src]="/api/images/system/count_widgets_system_bundle_image.png | image | async" />');

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { ...data, } as ResourceInfo;

    setModalProps({ loading: false });
});

function clear() {
    record.value = {} as ResourceInfo;

}




</script>