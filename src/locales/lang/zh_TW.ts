import { genMessage } from '../helper';
import antdLocale from 'ant-design-vue/es/locale/zh_TW';

const modules = import.meta.glob('./zh-TW/**/*.ts', { eager: true });

export default {
  message: {
    ...genMessage(modules as Recordable<Recordable>, 'zh-TW'),
    antdLocale,
  },
  dateLocale: null,
  dateLocaleName: 'zh-tw',
};
