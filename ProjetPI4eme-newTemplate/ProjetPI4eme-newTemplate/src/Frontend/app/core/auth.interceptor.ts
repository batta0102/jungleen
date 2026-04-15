import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding token to non-API requests
    if (!req.url.includes('/api')) {
      return next.handle(req);
    }

    // Get the JWT token from AuthService
    const token = this.authService.getAccessToken();

    // If we have a token, add it to the request headers
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - token might be expired
        if (error.status === 401) {
          // Optionally refresh token or redirect to login
          console.warn('Unauthorized request - token may have expired');
        }
        return throwError(() => error);
      })
    );
  }
}
