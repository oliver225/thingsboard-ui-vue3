import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

/** 生成随机令牌(对齐 gitee randomSecret) */
export function randomSecret(length: number) {
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  while (str.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte >= 248) continue;
      str += chars[byte % chars.length];
      if (str.length === length) break;
    }
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
