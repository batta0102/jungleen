import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.userService.getCurrentUser();
    
    if (currentUser && currentUser.role === 'admin') {
      return true;
    }
    
    // Rediriger vers la page d'accès refusé si non admin
    this.router.navigate(['/access-denied']);
    return false;
  }
}
