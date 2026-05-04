import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  avatar?: string;
  dateInscription?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = this._isAuthenticated.asReadonly();

  // Base de données utilisateurs simulée
  private readonly users: User[] = [
    {
      id: 1,
      nom: 'Alice Martin',
      email: 'alice@example.com',
      role: 'student',
      avatar: '👩‍🎓',
      dateInscription: new Date('2024-01-15')
    },
    {
      id: 2,
      nom: 'Bob Dupont',
      email: 'bob@example.com',
      role: 'tutor',
      avatar: '👨‍🏫',
      dateInscription: new Date('2024-01-20')
    },
    {
      id: 3,
      nom: 'Claire Durand',
      email: 'claire@example.com',
      role: 'student',
      avatar: '👩‍💻',
      dateInscription: new Date('2024-02-01')
    },
    {
      id: 4,
      nom: 'David Lefebvre',
      email: 'david@example.com',
      role: 'admin',
      avatar: '👨‍💼',
      dateInscription: new Date('2024-01-10')
    },
    {
      id: 5,
      nom: 'Emma Bernard',
      email: 'emma@example.com',
      role: 'student',
      avatar: '👩‍🎨',
      dateInscription: new Date('2024-02-15')
    },
    {
      id: 6,
      nom: 'François Petit',
      email: 'francois@example.com',
      role: 'tutor',
      avatar: '👨‍🔬',
      dateInscription: new Date('2024-01-25')
    }
  ];

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {
    // Vérifier s'il y a un utilisateur sauvegardé dans localStorage
    this.loadStoredUser();
  }

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  getCurrentUser(): User | null {
    return this._currentUser();
  }

  /**
   * Obtenir l'ID de l'utilisateur connecté
   */
  getCurrentUserId(): number {
    const user = this._currentUser();
    return user ? user.id : 0;
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  /**
   * Connexion par email
   */
  async login(email: string, returnUrl?: string): Promise<boolean> {
    console.log('🔐 Tentative de connexion:', email);
    
    // Simuler une vérification asynchrone
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          console.log('✅ Connexion réussie:', user);
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          this.sessionService.startSession();
          
          // Rediriger vers la page demandée
          const redirectUrl = returnUrl || '/front';
          this.router.navigate([redirectUrl]);
          resolve(true);
        } else {
          console.log('❌ Échec de connexion: utilisateur non trouvé');
          resolve(false);
        }
      }, 500); // Simuler un délai de 500ms
    });
  }

  /**
   * Connexion directe en tant qu'utilisateur spécifique (pour le développement)
   */
  loginAsUser(userId: number): void {
    console.log('🚀 Connexion directe en tant qu\'utilisateur:', userId);
    
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
      this.saveUserToStorage(user);
      this.sessionService.startSession();
      console.log('✅ Connexion directe réussie:', user);
    } else {
      console.error('❌ Utilisateur non trouvé:', userId);
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    console.log('🚪 Déconnexion de l\'utilisateur:', this._currentUser()?.nom);
    this.sessionService.stopSession();
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.clearUserFromStorage();
    this.router.navigate(['/front']);
  }

  /**
   * Obtenir tous les utilisateurs
   */
  getAllUsers(): User[] {
    return this.users;
  }

  /**
   * Obtenir un utilisateur par son ID
   */
  getUserById(id: number): User | null {
    return this.users.find(u => u.id === id) || null;
  }

  /**
   * Obtenir un utilisateur par son email
   */
  getUserByEmail(email: string): User | null {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Obtenir les utilisateurs par rôle
   */
  getUsersByRole(role: 'student' | 'tutor' | 'admin'): User[] {
    return this.users.filter(u => u.role === role);
  }

  /**
   * Sauvegarder l'utilisateur dans localStorage
   */
  private saveUserToStorage(user: User): void {
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
        this._isAuthenticated.set(true);
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
