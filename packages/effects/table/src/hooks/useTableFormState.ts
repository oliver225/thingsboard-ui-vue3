import type { FormActionType, FormProps, FormSchema } from '../types/form';
import type { Recordable } from '../types/shared';

import { reactive } from 'vue';

export function useTableFormState(): FormActionType {
  const values = reactive<Recordable>({});
  let config: Partial<FormProps> = {};
  let schemas: FormSchema[] = [];
  const actions: FormActionType = {
    async setProps(props) {
      config = { ...config, ...props };
      if (props.schemas) schemas = props.schemas;
      Object.assign(values, props.model);
      for (const schema of schemas)
        if (!(schema.field in values) && schema.defaultValue !== undefined)
          values[schema.field] = schema.defaultValue;
    },
    async updateSchema(data) {
      for (const schema of Array.isArray(data) ? data : [data]) {
        const old = schemas.find((s) => s.field === schema.field);
        if (old) Object.assign(old, schema);
      }
    },
    async resetSchema(data) {
      schemas = (Array.isArray(data) ? data : [data]) as FormSchema[];
    },
    getFieldsValue: () => ({ ...values }),
    async setFieldsValue(data) {
      Object.assign(values, data);
    },
    async appendSchemaByField(schema, field, first) {
      const index = schemas.findIndex((s) => s.field === field);
      const insertionIndex = index === -1 ? schemas.length : index + 1;
      schemas.splice(first ? 0 : insertionIndex, 0, schema);
    },
    async removeSchemaByFiled(fields) {
      const keys = Array.isArray(fields) ? fields : [fields];
      schemas = schemas.filter((s) => !keys.includes(s.field));
    },
    async resetFields() {
      for (const key of Object.keys(values))
        Reflect.deleteProperty(values, key);
      await actions.setProps(config);
    },
    async submit() {
      await actions.validate();
    },
    async validate() {
      return { ...values };
    },
    async validateFields() {
      return { ...values };
    },
    async clearValidate() {},
    async scrollToField() {},
  };
  return actions;
}
