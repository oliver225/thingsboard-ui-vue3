import { downloadByData } from '/@/utils/file/download';
import { defHttp } from '/@/utils/http/axios';

// 下载网关的 docker-compose.yml
export async function downloadGatewayDockerCompose(deviceId: string) {
  const res = await defHttp.get(
    { url: `/api/device-connectivity/gateway-launch/${deviceId}/docker-compose/download`, responseType: 'blob' },
    { isReturnNativeResponse: true, joinPrefix: false },
  );

  let name = res.headers['content-disposition'];
  name = name && name.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  name = name && name.length >= 1 && name[1].replace("utf-8'zh_cn'", '');
  return downloadByData(res.data, name);
}
