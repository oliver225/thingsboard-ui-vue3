import type {
  VbenFormProps as FormProps,
  VbenFormSchema as FormSchema,
  FormValues,
} from '@vben/common-ui';

import type { ComponentPropsMap, ComponentType } from './component';
import type { JsonValidationOptions } from './component/code-editor/types';

import { setupVbenForm, useVbenForm as useForm, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { parseJsonText } from './component/code-editor/utils/json';

function jsonRule(options?: JsonValidationOptions) {
  return (value: unknown) => {
    const result = parseJsonText(
      typeof value === 'string' ? value : '',
      options,
    );
    if (value !== null && value !== undefined && typeof value !== 'string') {
      return $t('tb.components.codeEditor.validation.json.invalidJson');
    }
    return result.valid
      ? true
      : $t(`tb.components.codeEditor.validation.json.${result.error}`);
  };
}

async function initSetupVbenForm() {
  setupVbenForm<ComponentType>({
    config: {
      // ant design vue组件库默认都是 v-model:value
      baseModelPropName: 'value',

      // 一些组件是 v-model:checked 或者 v-model:fileList
      modelPropNameMap: {
        CodeEditor: 'modelValue',
        DebugSettingsButton: 'modelValue',
        Checkbox: 'checked',
        EntityInput: 'modelValue',
        ImageInput: 'modelValue',
        JsonEditor: 'modelValue',
        ScriptEditor: 'modelValue',
        Radio: 'checked',
        // VbenTiptap uses Vue's standard modelValue/update:modelValue pair.
        RichEditor: 'modelValue',
        SecondsInput: 'modelValue',
        Switch: 'checked',
        TbCheckbox: 'checked',
        TbSwitch: 'checked',
        Upload: 'fileList',
        UploadDragger: 'fileList',
      },
    },
    rules: {
      json: jsonRule(),
      jsonRequired: jsonRule({ required: true }),
      jsonObject: jsonRule({ rootType: 'object' }),
      jsonObjectRequired: jsonRule({ required: true, rootType: 'object' }),
      jsonArray: jsonRule({ rootType: 'array' }),
      jsonArrayRequired: jsonRule({ required: true, rootType: 'array' }),
      // 输入项目必填国际化适配
      required: (value, _params, ctx) => {
        if (value === undefined || value === null || value.length === 0) {
          return $t('ui.formRules.required', [ctx.label]);
        }
        return true;
      },
      // 选择项目必填国际化适配
      selectRequired: (value, _params, ctx) => {
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && !value.trim()) ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return $t('ui.formRules.selectRequired', [ctx.label]);
        }
        return true;
      },
    },
  });
}
function useVbenForm<
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  options: FormProps<
    ComponentType,
    ComponentPropsMap,
    TFormValues,
    TSubmitValues
  >,
) {
  return useForm<TFormValues, ComponentType, ComponentPropsMap, TSubmitValues>(
    options,
  );
}

export { initSetupVbenForm, useVbenForm, z };

export type VbenFormSchema<TValues extends FormValues = FormValues> =
  FormSchema<ComponentType, ComponentPropsMap, TValues>;
export type VbenFormProps<
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
> = FormProps<ComponentType, ComponentPropsMap, TFormValues, TSubmitValues>;
