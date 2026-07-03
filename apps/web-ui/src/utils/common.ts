import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

/** 生成随机令牌(对齐 gitee randomSecret) */
export function randomSecret(length: number) {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for (let index = 0; index < length; index += 1) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

export async function copyToClipboard(
  value: string,
  successText = '已复制到剪贴板',
) {
  const { copy } = useClipboard({ legacy: true });
  await copy(value);
  message.success(successText);
}
