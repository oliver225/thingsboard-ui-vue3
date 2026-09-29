import { defineComponent, h, reactive } from 'vue';

import { Tag } from 'antdv-next';

export interface DictItem {
  name: string;
  value: number | string;
  color?: string;
}
const dictionaries = reactive<Record<string, DictItem[]>>({});
let loader:
  | ((types: string[]) => Promise<Record<string, DictItem[]>>)
  | undefined;
export function configureTableDictionaries(options: {
  data?: Record<string, DictItem[]>;
  load?: typeof loader;
}) {
  Object.assign(dictionaries, options.data);
  loader = options.load;
}
export function useDict() {
  return {
    getDictList: (type: string) => dictionaries[type] ?? [],
    initDict: async (types: Set<string>) => {
      const missing = [...types].filter((t) => !dictionaries[t]);
      if (missing.length > 0 && loader)
        Object.assign(dictionaries, await loader(missing));
    },
  };
}
export const DictLabel = defineComponent({
  props: {
    dictType: { type: String, default: undefined },
    dictValue: { type: [String, Number, Array], default: undefined },
    defaultValue: { type: [String, Number], default: undefined },
  },
  setup(props) {
    return () => {
      const values = Array.isArray(props.dictValue)
        ? props.dictValue
        : String(props.dictValue ?? '').split(',');
      return values.map((value) => {
        const item = (dictionaries[props.dictType ?? ''] ?? []).find(
          (item) => String(item.value) === String(value),
        );
        return item?.color
          ? h(Tag, { color: item.color }, () => item.name)
          : (item?.name ?? props.defaultValue ?? String(value));
      });
    };
  },
});
