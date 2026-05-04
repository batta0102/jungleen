/**
 * API base URL: relative so the dev server proxy is used (avoids CORS).
 * Proxy: /api -> http://localhost:8098 (no path strip).
 * So GET /api/v1/onlinecourses/all is sent to http://localhost:8098/api/v1/onlinecourses/all.
 * If your backend serves at 8098/onlinecourses/all (no /api/v1), set pathRewrite in proxy.conf.json: "^/api/v1": ""
 */
export const environment = {
  /** Base for course/session APIs. Full URLs: /api/v1/onlinecourses/all, /api/v1/onsitecourses/all */
  apiBaseUrl: '/api/v1',
  apiGatewayUrl: 'http://localhost:8098',
  apiUrl: '/back',
} as const;
