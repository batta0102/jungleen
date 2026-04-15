import { environment } from '../../environments/environment';

/**
 * Join URL segments properly, handling slashes
 * @param parts URL segments to join
 * @returns Properly joined URL
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .map((part, index) => {
      if (index === 0) {
        // First part: remove trailing slash
        return part.replace(/\/+$/, '');
      } else {
        // Other parts: remove leading and trailing slashes
        return part.replace(/^\/+|\/+$/g, '');
      }
    })
    .filter(part => part.length > 0)
    .join('/');
}

/**
 * Build API URL using the configured base URL
 * @param path API path (without leading slash)
 * @returns Full API URL
 */
export function buildApiUrl(path: string): string {
  return joinUrl(environment.gatewayUrl, path);
}

/**
 * Build API URL with query parameters
 * @param path API path
 * @param params Query parameters object
 * @returns Full API URL with query string
 */
export function buildApiUrlWithParams(path: string, params: Record<string, string | number | boolean>): string {
  const baseUrl = buildApiUrl(path);
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
