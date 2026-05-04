/**
 * API Configuration for Frontend
 * Centralized API URLs for Frontend Angular App
 * 
 * ALWAYS USE port 8085 (that's the API Gateway)
 */

export const API_CONFIG = {
  // ✅ CORRECT: API Gateway
  API_GATEWAY_URL: 'http://localhost:8085',
  
  // Service-specific endpoints
  NOTIFICATIONS_API: 'http://localhost:8085/notifications',
  BUDDY_SESSIONS_API: 'http://localhost:8085/buddySessions',
  
  // Base URL for session notifications
  BASE_URL: 'http://localhost:8085/api'
};
