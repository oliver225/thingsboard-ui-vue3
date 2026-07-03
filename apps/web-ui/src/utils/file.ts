/**
 * 文件相关工具
 */

/** 将文件读取为 base64 Data URL */
export function fileToBase64(target: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(target);
  });
}

/** base64 → UTF-8 文本 */
export function base64ToUtf8(base64?: string): string {
  if (!base64) {
    return '';
  }
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.codePointAt(0) ?? 0);
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

/** 字节数转可读大小,如 1.5 MB;无效值返回 '-' */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** 校验是否为 SVG 文件(svgz 为 gzip 压缩的 svg,无法本地预览) */
export function isSvgFile(target: File): boolean {
  const name = target.name.toLowerCase();
  return (
    target.type === 'image/svg+xml' ||
    name.endsWith('.svg') ||
    name.endsWith('.svgz')
  );
}
