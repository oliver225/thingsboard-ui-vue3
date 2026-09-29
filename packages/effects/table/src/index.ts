import './theme.css';
export { default as BasicTable } from './BasicTable.vue';
export {
  add as addTableEditor,
  del as removeTableEditor,
} from './componentMap';
export type { EditRecordRow } from './components/editable';
export { default as EditTableHeaderIcon } from './components/EditTableHeaderIcon.vue';
export { default as TableAction } from './components/TableAction.vue';
export { default as TableImg } from './components/TableImg.vue';

export { setupVbenTable } from './config';
export type { TableConfig } from './config';
export { configureTableDictionaries } from './dictionary';
export { useBasicTable, useTable } from './hooks/useTable';
export type { FormProps, FormSchema } from './types/form';
export * from './types/pagination';

export * from './types/table';
export * from './types/tableAction';
