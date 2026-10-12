/** JWT 这里只用于选择认证流程，实际身份与签名始终由服务端验证。 */
export function getTokenClaims(token: string): {
  exp: number;
  scopes: string[];
} {
  try {
    const payload = token.split('.')[1] ?? '';
    const claims = JSON.parse(
      atob(payload.replaceAll('-', '+').replaceAll('_', '/')),
    );
    return {
      exp: typeof claims.exp === 'number' ? claims.exp : 0,
      scopes: Array.isArray(claims.scopes) ? claims.scopes : [],
    };
  } catch {
    return { exp: 0, scopes: [] };
  }
}

/** 登录重定向只接收站内业务路径，拒绝异常编码、外站和认证入口循环。 */
export function getLoginRedirect(value: unknown, fallback = '/home') {
  if (typeof value !== 'string') return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (
      !decoded.startsWith('/') ||
      decoded.startsWith('//') ||
      // 拒绝控制字符，避免 URL 解析时移除字符后改变跳转目标。
      // oxlint-disable-next-line no-control-regex
      /[\\\u0000-\u0020]/u.test(decoded)
    )
      return fallback;
    const normalized = new URL(decoded, 'http://localhost');
    const path = normalized.pathname + normalized.search + normalized.hash;
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      // oxlint-disable-next-line no-control-regex
      /[\\\u0000-\u0020]/u.test(path) ||
      /^\/(?:auth|login|noauth|setup|activation)(?:\/|\?|#|$)/u.test(path)
    )
      return fallback;
    return path;
  } catch {
    return fallback;
  }
}

let loginCallback:
  | undefined
  | { token: string; refreshToken?: string; redirect?: string };

/** 在路由、页面及业务请求启动前移除 OAuth2 URL 中的凭据，仅在内存消费一次。 */
export function captureLoginCallback() {
  const url = new URL(window.location.href);
  const hashIndex = url.hash.indexOf('?');
  const hashQuery = new URLSearchParams(
    hashIndex === -1 ? '' : url.hash.slice(hashIndex + 1),
  );
  for (const params of [url.searchParams, hashQuery]) {
    if (params.has('loginError')) {
      loginCallback = { token: '' };
      params.delete('loginError');
    }
    if (params.has('accessToken') || params.has('refreshToken')) {
      loginCallback = {
        token: params.get('accessToken') || '',
        refreshToken: params.get('refreshToken') || undefined,
      };
      params.delete('accessToken');
      params.delete('refreshToken');
    }
  }
  if (hashIndex !== -1)
    url.hash =
      url.hash.slice(0, hashIndex) +
      (hashQuery.size > 0 ? `?${hashQuery}` : '');
  if (loginCallback?.token) {
    loginCallback.redirect = getLoginRedirect(
      hashQuery.get('redirect') ||
        url.searchParams.get('redirect') ||
        (url.hash.startsWith('#/')
          ? url.hash.slice(1)
          : `${url.pathname}${url.search}`),
    );
  }
  if (loginCallback) window.history.replaceState(window.history.state, '', url);
}

export function takeLoginCallback() {
  const pair = loginCallback;
  loginCallback = undefined;
  return pair;
}
