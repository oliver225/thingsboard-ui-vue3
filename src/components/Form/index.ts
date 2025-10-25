import BasicForm from './src/BasicForm.vue';

export * from './src/types/form';
export * from './src/types/formItem';

export { useComponentRegister } from './src/hooks/useComponentRegister';
export { useForm } from './src/hooks/useForm';

export { default as Select } from './src/components/TbV3Select.vue';
export { default as TreeSelect } from './src/components/TbV3TreeSelect.vue';
export { default as RadioGroup } from './src/components/TbV3RadioGroup.vue';
export { default as RadioButtonGroup } from './src/components/TbV3RadioButtonGroup.vue';
export { default as CheckboxGroup } from './src/components/TbV3CheckboxGroup.vue';
export { default as FormGroup } from './src/components/FormGroup.vue';

export { BasicForm };
