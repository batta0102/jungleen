import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { AuthSimpleService } from '../../services/auth-simple.service';

@Component({
  selector: 'app-user-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-selection.page.html',
  styleUrls: ['./user-selection.page.scss']
})
export class UserSelectionPage implements OnInit {
  private userService = inject(UserService);
  private authSimpleService = inject(AuthSimpleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  users: User[] = [];
  returnUrl: string = '/front';
  selectedUserId: number | null = null;

  ngOnInit(): void {
    console.log('🎭 Page de sélection d\'utilisateur initialisée');
    
    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/front';
    
    // Charger tous les utilisateurs
    this.users = this.userService.getAllUsers();
    
    console.log('👥 Utilisateurs disponibles:', this.users);
    console.log('🔄 URL de retour:', this.returnUrl);
  }

  /**
   * Sélectionner un utilisateur et se connecter
   */
  selectUser(userId: number): void {
    console.log('🚀 Sélection de l\'utilisateur:', userId);
    
    const user = this.userService.getUserById(userId);
    if (user) {
      // Se connecter en tant que cet utilisateur
      this.userService.loginAsUser(userId);
      
      // Synchroniser le service d'authentification
      this.authSimpleService.syncCurrentUser();
      
      console.log('✅ Connexion réussie en tant que:', user);
      
      // Rediriger selon le rôle de l'utilisateur
      if (user.role === 'admin') {
        console.log('👨‍💼 Utilisateur admin détecté, redirection vers le dashboard');
        this.router.navigate(['/back/dashboard']);
      } else {
        console.log('👤 Utilisateur non-admin, redirection vers:', this.returnUrl);
        this.router.navigate([this.returnUrl]);
      }
    } else {
      console.error('❌ Utilisateur non trouvé:', userId);
    }
  }

  /**
   * Obtenir le rôle en français
   */
  getRoleText(role: string): string {
    switch (role) {
      case 'student': return 'Étudiant';
      case 'tutor': return 'Tuteur';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  }

  /**
   * Obtenir l'avatar par rôle
   */
  getRoleAvatar(role: string): string {
    switch (role) {
      case 'student': return '👩‍🎓';
      case 'tutor': return '👨‍🏫';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  }
}
