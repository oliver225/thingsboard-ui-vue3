/** 限流协议为“数量:秒数”，同一时间窗口不得重复；空值表示未配置。 */
export function isValidRateLimit(value: string) {
  if (!value.trim()) return true;
  const windows = new Set<number>();
  return value.split(',').every((part) => {
    if (!/^\s*\d+\s*:\s*\d+\s*$/.test(part)) return false;
    const [count, seconds] = part.split(':').map(Number);
    if (
      count === undefined ||
      seconds === undefined ||
      !Number.isSafeInteger(count) ||
      !Number.isSafeInteger(seconds) ||
      count < 1 ||
      seconds < 1 ||
      windows.has(seconds)
    )
      return false;
    windows.add(seconds);
    return true;
  });
}

/** 校验通过后归一化协议值；清空全部条件时提交空字符串。 */
export function normalizeRateLimit(value: string) {
  return value.trim()
    ? value
        .split(',')
        .map((part) => part.split(':').map(Number).join(':'))
        .join(',')
    : '';
}
