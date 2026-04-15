import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor that attaches the Keycloak Bearer token to API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const url = req.urlWithParams;

  // Public endpoints must stay token-free to avoid 401 when a stale token exists.
  const isPublicEventRead = req.method === 'GET' && (
    /\/api\/events(?:\?.*)?$/.test(url) ||
    /\/api\/events\/\d+(?:\?.*)?$/.test(url) ||
    /\/api\/venues(?:\?.*)?$/.test(url) ||
    /\/api\/venues\/\d+(?:\?.*)?$/.test(url)
  );

  const isPublicEventRsvp = req.method === 'POST' &&
    /\/api\/events\/\d+\/registrations(?:\?.*)?$/.test(url);

  if (isPublicEventRead || isPublicEventRsvp) {
    return next(req);
  }
  
  // Only add token for API requests
  const isApiRequest = req.url.includes('/api/') || 
                       req.url.includes('localhost:8085') ||
                       req.url.includes('localhost:8081') ||
                       req.url.includes('localhost:8082') ||
                       req.url.includes('localhost:8083') ||
                       req.url.includes('localhost:8089') ||  // ressources service
                       req.url.includes('localhost:8090');
  
  // Skip token for Keycloak endpoints
  const isKeycloakRequest = req.url.includes('localhost:8180') || 
                            req.url.includes('/realms/');
  
  if (isApiRequest && !isKeycloakRequest) {
    const token = authService.getAccessToken();
    const tokenValid = authService.isAccessTokenValid();
    
    console.log('[AuthInterceptor] Request to:', req.url);
    console.log('[AuthInterceptor] Token available:', !!token);
    console.log('[AuthInterceptor] Token valid:', tokenValid);
    
    if (token && tokenValid) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[AuthInterceptor] Added Bearer token to request');
      return next(authReq);
    } else {
      console.warn('[AuthInterceptor] Missing/expired token - request will go without auth header');
    }
  }
  
  return next(req);
};
