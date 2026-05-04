import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, User } from './user.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthSimpleService {
  private readonly userService = inject(UserService);
  private readonly _currentUser = signal<AuthUser | null>(null);
  private router = inject(Router);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  constructor() {
    // Charger l'utilisateur au démarrage
    this.loadStoredUser();
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.userService.isAuthenticated();
  }

  /**
   * Récupérer l'ID de l'utilisateur connecté
   */
  getCurrentUserId(): number {
    return this.userService.getCurrentUserId();
  }

  /**
   * Récupérer les informations complètes de l'utilisateur
   */
  getCurrentUser(): AuthUser | null {
    return this._currentUser();
  }

  /**
   * Connexion avec redirection
   */
  async login(returnUrl?: string): Promise<void> {
    // Rediriger vers la page de sélection d'utilisateur
    this.router.navigate(['/front/user-selection'], { 
      queryParams: { returnUrl: returnUrl || '/front' } 
    });
  }

  /**
   * Inscription
   */
  async register(returnUrl?: string): Promise<void> {
    // Rediriger vers la page de sélection d'utilisateur
    this.router.navigate(['/front/user-selection'], { 
      queryParams: { returnUrl: returnUrl || '/front' } 
    });
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.userService.logout();
    this._currentUser.set(null);
    this.router.navigate(['/front']);
  }

  /**
   * Synchroniser l'utilisateur connecté
   */
  syncCurrentUser(): void {
    const user = this.userService.getCurrentUser();
    if (user) {
      const authUser: AuthUser = {
        id: user.id.toString(),
        name: user.nom,
        email: user.email,
        role: user.role
      };
      this._currentUser.set(authUser);
      console.log('✅ Utilisateur synchronisé:', authUser);
    } else {
      this._currentUser.set(null);
    }
  }

  /**
   * Sauvegarder l'utilisateur dans localStorage
   */
  private saveUserToStorage(user: AuthUser): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Charger l'utilisateur depuis localStorage
   */
  private loadStoredUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this._currentUser.set(user);
        console.log('📥 Utilisateur chargé depuis localStorage:', user);
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        this.clearUserFromStorage();
      }
    }
  }

  /**
   * Effacer l'utilisateur du localStorage
   */
  private clearUserFromStorage(): void {
    localStorage.removeItem('currentUser');
  }
}
