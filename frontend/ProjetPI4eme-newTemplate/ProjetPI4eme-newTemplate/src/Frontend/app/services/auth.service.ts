import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  /**
   * Obtient l'ID de l'utilisateur courant
   * À adapter selon votre logique d'authentification réelle
   */
  getCurrentUserId(): number {
    // Logique 1: Depuis localStorage
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        return parsedUser.id || 1;
      } catch {
        return 1;
      }
    }
    
    // Logique 2: Depuis sessionStorage
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        return parsedUser.id || 1;
      } catch {
        return 1;
      }
    }
    
    // Logique 3: Valeur par défaut pour les tests
    return 1; // À remplacer par votre vraie logique
  }
  
  /**
   * Vérifie si un utilisateur est connecté
   */
  isUserConnected(): boolean {
    return this.getCurrentUserId() !== null;
  }
  
  /**
   * Définit l'utilisateur courant
   */
  setCurrentUser(user: any): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  
  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
  }
  
  /**
   * Obtient les informations de l'utilisateur courant
   */
  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        return JSON.parse(user);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    // Pour la démo, on considère que l'utilisateur est admin
    // Dans une vraie application, ceci vérifierait le rôle de l'utilisateur connecté
    const user = this.getCurrentUser();
    if (user) {
      return user.role === 'admin' || user.isAdmin === true || user.email?.includes('admin');
    }
    return false;
  }
}
