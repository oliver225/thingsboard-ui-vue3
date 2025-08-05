export enum ComponentDescriptorType {
  ENRICHMENT = 'ENRICHMENT',
  FILTER = 'FILTER',
  TRANSFORMATION = 'TRANSFORMATION',
  ACTION = 'ACTION',
  EXTERNAL = 'EXTERNAL',
  FLOW = 'FLOW',
}

export const COMPONENTS_DESCRIPTOR_TYPE_OPTIONS = [
  { value: ComponentDescriptorType.FILTER, label: '筛选器', color: '#EDEA64' },
  { value: ComponentDescriptorType.ENRICHMENT, label: '属性集', color: '#AED045' },
  { value: ComponentDescriptorType.TRANSFORMATION, label: '变换', color: '#639AB4' },
  { value: ComponentDescriptorType.ACTION, label: '动作', color: '#EC9390' },
  { value: ComponentDescriptorType.EXTERNAL, label: '外部', color: '#F6C968' },
  { value: ComponentDescriptorType.FLOW, label: '数据流', color: '#D7C3F1' },
];
