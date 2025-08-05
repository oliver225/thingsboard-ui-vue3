import { defHttp } from '/@/utils/http/axios';

// export function getProvinceArea() {
//   return defHttp.get<Recordable>({
//     url: '/api/uiSettings/province/area',
//   });
// }

export function getHelpBaseUrl() {
  return defHttp.get<string>({
    url: '/api/uiSettings/helpBaseUrl',
  });
}
