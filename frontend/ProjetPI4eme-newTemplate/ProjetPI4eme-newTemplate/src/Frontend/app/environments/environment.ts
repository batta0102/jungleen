/**
 * Environment Configuration
 * Used for API URL configuration across the application
 */
export const environment = {
  production: false,
  
  /**
   * Base URL for API calls (proxied through Angular to API Gateway)
   */
  apiBaseUrl: '/api',
  
  /**
   * Direct API Gateway URL (for cases where proxy is not available)
   */
  gatewayUrl: 'http://localhost:8085',
  
  /**
   * Keycloak Configuration (reference only - actual config in keycloak.config.ts)
   */
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'myrealm',
    clientId: 'jungle-web'
  }
};
