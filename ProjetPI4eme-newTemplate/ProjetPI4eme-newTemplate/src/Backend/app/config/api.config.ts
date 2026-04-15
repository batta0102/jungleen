/**
 * API Configuration
 * Centralized API URLs for Backend Admin
 * 
 * DO NOT USE port 4300 (that's the Angular backend admin server)
 * ALWAYS USE port 8085 (that's the API Gateway)
 */

export const API_CONFIG = {
  // ✅ CORRECT: API Gateway
  API_GATEWAY_URL: 'http://localhost:8085',
  
  // ❌ WRONG (Don't use these!)
  // ANGULAR_BACKEND_PORT: 4300,  // <- This is the Angular server, NOT the API!
  
  // Service-specific endpoints
  PRODUCTS_API: 'http://localhost:8085/products',
  RESOURCES_API: 'http://localhost:8085/resources',
  USERS_API: 'http://localhost:8085/users',
  
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
