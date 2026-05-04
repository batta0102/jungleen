import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BuddyService } from '../../services/buddy.service';
import { BuddySessionService } from '../../services/buddy-session.service';
import { UserService } from '../../services/user.service';
import { BuddyPair, BuddyMatchStatus } from '../../models/buddy.models';

@Component({
  selector: 'app-user-buddies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-buddies.component.html',
  styleUrls: ['./user-buddies.component.scss']
})
export class UserBuddiesComponent implements OnInit, OnDestroy {
  buddies: BuddyPair[] = [];
  terminatedBuddies: BuddyPair[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  BuddyMatchStatus = BuddyMatchStatus; // Make enum available in template
  userClubs: any[] = [];
  selectedClubId: number | null = null;

  private subscriptions = new Subscription();

  constructor(
    private buddyService: BuddyService,
    private sessionService: BuddySessionService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Auto-login pour le développement si aucun utilisateur n'est connecté
    if (!this.userService.isAuthenticated()) {
      console.log('🚀 Auto-login as user 1 for development');
      this.userService.loginAsUser(1);
    }
    
    this.loadUserBuddies();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les buddies de l'utilisateur connecté
   */
  private loadUserBuddies(): void {
    this.currentUser = this.userService.getCurrentUser();
    
    console.log('🔍 Current user:', this.currentUser);
    
    if (!this.currentUser) {
      console.error('❌ No current user found');
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    console.log('🔍 Chargement des buddies pour l\'utilisateur:', this.currentUser.id);
    
    // Timeout de sécurité pour éviter un chargement infini
    const timeout = setTimeout(() => {
      if (this.loading) {
        console.warn('⏰ Timeout: Le chargement des buddies prend trop de temps');
        this.loading = false;
        this.error = 'Le chargement des buddies a pris trop de temps. Veuillez réessayer.';
      }
    }, 10000); // 10 secondes
    
    const buddySub = this.buddyService.getBuddyPairsByUser(this.currentUser.id).subscribe({
      next: (buddies: BuddyPair[]) => {
        clearTimeout(timeout);
        console.log('✅ Buddies reçus:', buddies);
        
        // Séparer les buddies actifs et terminés
        this.buddies = buddies.filter(buddy => buddy.status !== BuddyMatchStatus.COMPLETED);
        this.terminatedBuddies = buddies.filter(buddy => buddy.status === BuddyMatchStatus.COMPLETED);
        
        console.log('📊 Buddies actifs:', this.buddies.length);
        console.log('📊 Buddies terminés:', this.terminatedBuddies.length);
        
        this.loading = false;
        console.log('🔄 Forcing change detection');
        this.cdr.detectChanges(); // Force Angular to update the view
      },
      error: (error: any) => {
        clearTimeout(timeout);
        console.error('❌ Erreur lors du chargement des buddies:', error);
        this.error = 'Impossible de charger vos buddies';
        this.loading = false;
      }
    });

    this.subscriptions.add(buddySub);
  }

  /**
   * Obtient le nom du partenaire (l'autre utilisateur dans le buddy pair)
   */
  getPartnerName(buddy: BuddyPair): string {
    if (!this.currentUser) {
      return 'Inconnu';
    }
    
    let partnerUser = null;
    if (buddy.userID_1 === this.currentUser.id && buddy.user2) {
      partnerUser = buddy.user2;
    } else if (buddy.userID_2 === this.currentUser.id && buddy.user1) {
      partnerUser = buddy.user1;
    }
    
    if (partnerUser) {
      const prenom = partnerUser.prenom || '';
      const nom = partnerUser.nom || '';
      const fullName = `${prenom} ${nom}`.trim();
      if (fullName) {
        return fullName;
      }
    }
    
    const otherUserId = buddy.userID_1 === this.currentUser.id ? buddy.userID_2 : buddy.userID_1;
    return `User #${otherUserId}`;
  }

  /**
   * Obtient l'email du partenaire
   */
  getPartnerEmail(buddy: BuddyPair): string {
    if (!this.currentUser) return '';
    
    let partnerUser = null;
    if (buddy.userID_1 === this.currentUser.id && buddy.user2) {
      partnerUser = buddy.user2;
    } else if (buddy.userID_2 === this.currentUser.id && buddy.user1) {
      partnerUser = buddy.user1;
    }
    
    if (partnerUser?.email) {
      return partnerUser.email;
    }
    
    return '';
  }

  /**
   * Obtient l'avatar du partenaire
   */
  getPartnerAvatar(buddy: BuddyPair): string {
    if (!this.currentUser) return '👤';
    
    if (buddy.userID_1 === this.currentUser.id && buddy.user2?.avatar) {
      return buddy.user2.avatar;
    } else if (buddy.userID_2 === this.currentUser.id && buddy.user1?.avatar) {
      return buddy.user1.avatar;
    }
    
    // Avatar par défaut basé sur le nom si disponible
    const partnerName = this.getPartnerName(buddy);
    if (partnerName && !partnerName.startsWith('User #')) {
      return partnerName.charAt(0).toUpperCase();
    }
    
    return '👤';
  }

  /**
   * Obtient le nom du club
   */
  getClubName(buddy: BuddyPair): string {
    return buddy.club?.nom || 'Club not specified';
  }

  /**
   * Obtient la couleur du statut
   */
  getStatusColor(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case BuddyMatchStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case BuddyMatchStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case BuddyMatchStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtient le texte du statut
   */
  getStatusText(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.ACTIVE:
        return 'Active';
      case BuddyMatchStatus.PENDING:
        return 'Pending';
      case BuddyMatchStatus.COMPLETED:
        return 'Terminated';
      case BuddyMatchStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Obtient l'icône du statut
   */
  getStatusIcon(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.ACTIVE:
        return '✅';
      case BuddyMatchStatus.PENDING:
        return '⏳';
      case BuddyMatchStatus.COMPLETED:
        return '🏁';
      case BuddyMatchStatus.CANCELLED:
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Vérifie si le buddy est actif (peut planifier des sessions)
   */
  isBuddyActive(buddy: BuddyPair): boolean {
    return buddy.status === BuddyMatchStatus.ACTIVE;
  }

  /**
   * Obtient l'URL pour voir les sessions
   */
  getSessionsUrl(buddy: BuddyPair): string {
    return `/buddies/${buddy.idPair}/sessions`;
  }

  /**
   * Obtient l'URL pour planifier une session
   */
  getPlanSessionUrl(buddy: BuddyPair): string {
    return `/buddies/${buddy.idPair}/plan-session`;
  }

  /**
   * Recharge la liste des buddies
   */
  refreshBuddies(): void {
    this.loading = true;
    this.error = null;
    this.loadUserBuddies();
  }

  /**
   * Compte les buddies par statut
   */
  getBuddiesByStatus(status: BuddyMatchStatus): number {
    if (!this.buddies) return 0;
    return this.buddies.filter(b => b.status === status).length;
  }

  /**
   * Accepte un buddy pair
   */
  acceptBuddy(buddy: BuddyPair): void {
    const acceptSub = this.buddyService.acceptBuddyPair(buddy.idPair).subscribe({
      next: () => {
        console.log(`✅ Buddy ${buddy.idPair} accepté`);
        this.refreshBuddies();
      },
      error: (error: any) => {
        console.error(`❌ Erreur lors de l'acceptation du buddy ${buddy.idPair}:`, error);
        this.error = 'Unable to accept this buddy';
      }
    });

    this.subscriptions.add(acceptSub);
  }

  /**
   * Refuse un buddy pair
   */
  rejectBuddy(buddy: BuddyPair): void {
    if (confirm(`Are you sure you want to reject this buddy with ${this.getPartnerName(buddy)} ?`)) {
      const rejectSub = this.buddyService.rejectBuddyPair(buddy.idPair).subscribe({
        next: () => {
          console.log(`❌ Buddy ${buddy.idPair} refusé`);
          this.refreshBuddies();
        },
        error: (error: any) => {
          console.error(`❌ Erreur lors du refus du buddy ${buddy.idPair}:`, error);
          this.error = 'Unable to reject this buddy';
        }
      });

      this.subscriptions.add(rejectSub);
    }
  }

  /**
   * Termine un buddy pair
   */
  terminateBuddy(buddy: BuddyPair): void {
    if (confirm(`Are you sure you want to terminate this buddy with ${this.getPartnerName(buddy)} ?`)) {
      const terminateSub = this.buddyService.terminateBuddyPair(buddy.idPair).subscribe({
        next: () => {
          console.log(`🏁 Buddy ${buddy.idPair} terminé`);
          
          // Mettre à jour localement le statut du buddy
          const buddyIndex = this.buddies.findIndex(b => b.idPair === buddy.idPair);
          if (buddyIndex !== -1) {
            // Déplacer le buddy vers la liste des terminés
            const terminatedBuddy = this.buddies[buddyIndex];
            terminatedBuddy.status = BuddyMatchStatus.COMPLETED;
            
            // Retirer de la liste des actifs et ajouter aux terminés
            this.buddies.splice(buddyIndex, 1);
            this.terminatedBuddies.push(terminatedBuddy);
            
            console.log(`🔄 Mise à jour locale - Buddies actifs:`, this.buddies.length);
            console.log(`🔄 Mise à jour locale - Buddies terminés:`, this.terminatedBuddies.length);
            
            this.cdr.detectChanges(); // Forcer la mise à jour immédiate
          }
          
          // Optionnel: rafraîchir pour synchroniser avec le backend
          // this.refreshBuddies();
        },
        error: (error: any) => {
          console.error(`❌ Erreur lors de la terminaison du buddy ${buddy.idPair}:`, error);
          this.error = 'Unable to terminate this buddy';
        }
      });

      this.subscriptions.add(terminateSub);
    }
  }

  /**
   * Retourne les buddies du club actuel (English club - ID 4)
   */
  getCurrentClubBuddies(): BuddyPair[] {
    return this.buddies.filter(buddy => buddy.clubId === 4);
  }

  /**
   * Retourne les buddies des autres clubs
   */
  getOtherClubBuddies(): BuddyPair[] {
    return this.buddies.filter(buddy => buddy.clubId !== 4);
  }
}
