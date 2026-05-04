import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    this.auth.login();
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthGuardService);
  return service.canActivate();
};
