import { genMessage } from '../helper';
import antdLocale from 'ant-design-vue/es/locale/en_US';

// Keep nested english locale modules under existing 'en' directory for minimal change.
const modules = import.meta.glob('./en/**/*.ts', { eager: true });

export default {
  message: {
    // The key prefix inside files still uses 'en'; messages are registered under locale code 'en_US'.
    ...genMessage(modules as Recordable<Recordable>, 'en'),
    antdLocale,
  },
  dateLocale: null,
  // dayjs default english locale key is 'en'
  dateLocaleName: 'en',
};
