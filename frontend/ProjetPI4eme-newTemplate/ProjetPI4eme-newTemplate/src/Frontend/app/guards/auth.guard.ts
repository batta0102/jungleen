import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.userService.getCurrentUser();
    
    if (currentUser) {
      return true;
    }
    
    // Rediriger vers la page de login si non authentifié
    this.router.navigate(['/login']);
    return false;
  }
}
