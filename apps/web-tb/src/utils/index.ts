import { message } from 'ant-design-vue';

/**
 * 复制文本
 *
 * @param value 点击复制的内容
 * @param msg 复制成功的提示内容
 */
export function copyToClipboard(
  value: string,
  msg: string | undefined = '复制成功!',
) {
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  message.success(msg);
  input.remove();
}
