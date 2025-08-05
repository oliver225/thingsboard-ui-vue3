import { BasicModel } from '../model/baseModel';
import { ComponentDescriptorType } from '/@/enums/componentEnum';
import { defHttp } from '/@/utils/http/axios';

export interface ComponentDescriptor extends BasicModel<null> {
  name: string;
  clazz: string;
  type: ComponentDescriptorType;
  scope: 'SYSTEM' | 'TENANT';
  clusteringMode: 'USER_PREFERENCE' | 'ENABLED' | 'SINGLETON';
  configurationVersion: number;
  configurationDescriptor: {
    nodeDefinition: {
      configDirective: string;
      customRelations: boolean;
      defaultConfiguration: Recordable;
      description: string;
      details: string;
      docUrl: string;
      icon: string;
      iconUrl: string;
      inEnabled: boolean;
      outEnabled: boolean;
      relationTypes: string[];
      ruleChainNode: boolean;
    };
  };
}

export function getComponentDescriptorList(
  componentTypes: Array<ComponentDescriptorType>,
  ruleChainType: 'CORE' | 'EDGE',
) {
  return defHttp.get<Array<ComponentDescriptor>>({
    url: '/api/components',
    params: { componentTypes: componentTypes.join(','), ruleChainType: ruleChainType },
  });
}

export function getComponentDescriptorByClazz(clazz: string) {
  return defHttp.get<ComponentDescriptor>({
    url: `/api/components/${clazz}`,
  });
}
