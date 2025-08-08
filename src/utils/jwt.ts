import { jwtDecode } from 'jwt-decode';

export function decode(token: string | undefined | null) {
  if (token) {
    return jwtDecode(token);
  }
  return undefined;
}

export function getExpiration(token: string) {
  const unixTimestamp = jwtDecode(token).exp;
  if (unixTimestamp) {
    return new Date(unixTimestamp * 1000);
  }
  return undefined;
}

export function isExpired(token: string | undefined | null) {
  if (token) {
    const unixTimestamp = jwtDecode(token).exp;
    if (unixTimestamp) {
      return unixTimestamp * 1000 < new Date().getTime();
    }
  }
  return true;
}
