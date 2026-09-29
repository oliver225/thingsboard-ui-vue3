import { ref } from 'vue';

type FormAction = () => Promise<unknown>;

/** 统一读取、保存状态；只有读取成功后才能保存，避免用默认值覆盖服务端配置。 */
export function useFormRequest() {
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isReady = ref(false);
  async function read(action: FormAction) {
    if (isLoading.value || isSaving.value) return;
    isLoading.value = true;
    isReady.value = false;
    try {
      await action();
      isReady.value = true;
    } catch {
      // 请求层负责错误提示；保留未就绪状态，允许用户重试读取。
    } finally {
      isLoading.value = false;
    }
  }
  async function write(action: FormAction) {
    if (!isReady.value || isLoading.value || isSaving.value) return;
    isSaving.value = true;
    try {
      await action();
    } catch {
      // 表单校验和请求层各自负责提示，此处仅恢复按钮状态。
    } finally {
      isSaving.value = false;
    }
  }
  return { isLoading, isSaving, isReady, read, write };
}
