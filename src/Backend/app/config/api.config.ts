/**
 * API Configuration
 * Centralized API URLs for Backend Admin
 *
 * API Gateway: Spring Boot "ApiGateway" on port 8085
 * Eureka: http://localhost:8761/eureka (eureka.client.service-url.defaultZone)
 *
 * DO NOT USE port 4300 (Angular dev server)
 */
export const API_CONFIG = {
  API_GATEWAY_URL: 'http://localhost:8085',

  // Service-specific endpoints (gateway routes to Eureka-registered services)
  PRODUCTS_API: 'http://localhost:8085/products',
  RESOURCES_API: 'http://localhost:8085/resources',
  USERS_API: 'http://localhost:8085/users',
  COURSES_API: 'http://localhost:8085/courses',
  BOOKINGS_API: 'http://localhost:8085/bookings',
  SESSIONS_API: 'http://localhost:8085/sessions',
  
  // Endpoints
  ENDPOINTS: {
    PRODUCTS: {
      GET_ALL: '/allProducts',
      GET_ONE: (id: number) => `/getProduct/${id}`,
      ADD: '/addProduct',
      UPDATE: (id: number) => `/updateProduct/${id}`,
      DELETE: (id: number) => `/deleteProduct/${id}`
    }
  },

  /**
   * Get full API URL for a service
   * @param service - Service name (e.g., 'products', 'resources')
   * @param endpoint - Endpoint path (e.g., '/allProducts')
   * @returns Full URL
   */
  getUrl(service: string, endpoint: string): string {
    const baseUrl = `${this.API_GATEWAY_URL}/${service}`;
    return `${baseUrl}${endpoint}`;
  }
};

/**
 * Usage in services:
 * 
 * ✅ CORRECT:
 * const url = API_CONFIG.getUrl('products', '/allProducts');
 * // → 'http://localhost:8085/products/allProducts'
 * 
 * const url2 = API_CONFIG.ENDPOINTS.PRODUCTS.ADD;
 * // → '/addProduct'
 * 
 * ❌ WRONG:
 * const url = 'http://localhost:4300/products/allProducts';  // Wrong port!
 */
