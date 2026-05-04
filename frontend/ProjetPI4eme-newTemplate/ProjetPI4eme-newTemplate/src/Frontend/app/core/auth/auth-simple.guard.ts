import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSimpleService } from '../../services/auth-simple.service';

@Injectable({ providedIn: 'root' })
export class AuthSimpleGuardService {
  private authSimpleService = inject(AuthSimpleService);
  private router = inject(Router);

  canActivate(): boolean {
    // Vérifier si l'utilisateur est authentifié
    if (this.authSimpleService.isAuthenticated()) {
      return true;
    }

    // Rediriger vers la page de sélection d'utilisateur avec l'URL de retour
    const returnUrl = this.router.url;
    this.router.navigate(['/front/user-selection'], {
      queryParams: { returnUrl }
    });
    return false;
  }
}

export const authSimpleGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthSimpleGuardService);
  return service.canActivate();
};
