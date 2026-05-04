import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BuddyService } from '../../services/buddy.service';
import { BuddySessionService } from '../../services/buddy-session.service';
import { UserService } from '../../services/user.service';
import { BuddyPair, BuddySession, SessionStatus, SatisfactionLevel } from '../../models/buddy.models';

@Component({
  selector: 'app-user-buddy-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-buddy-sessions.component.html',
  styleUrls: ['./user-buddy-sessions.component.scss']
})
export class UserBuddySessionsComponent implements OnInit, OnDestroy {
  buddy: BuddyPair | null = null;
  sessions: BuddySession[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  
  // Make enums available to template
  SessionStatus = SessionStatus;
  SatisfactionLevel = SatisfactionLevel;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private buddyService: BuddyService,
    private sessionService: BuddySessionService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('🚀 UserBuddySessionsComponent ngOnInit called');
    
    this.currentUser = this.userService.getCurrentUser();
    console.log('👤 Current user:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('❌ No current user');
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    const buddyId = this.route.snapshot.paramMap.get('id');
    console.log('🆔 Buddy ID from route:', buddyId);
    
    if (!buddyId) {
      console.log('❌ No buddy ID in route');
      this.error = 'ID de buddy non spécifié';
      this.loading = false;
      return;
    }

    console.log(`🔍 Initialisation du composant pour buddy ${buddyId}`);
    
    // Force loading to false after 2 seconds for debugging
    setTimeout(() => {
      console.log('🔧 DEBUG: Forcing loading = false');
      this.loading = false;
    }, 2000);

    this.loadBuddySessions(+buddyId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les détails du buddy et ses sessions
   */
  private loadBuddySessions(buddyId: number): void {
    console.log(`🔍 Chargement des sessions pour le buddy ${buddyId}`);
    
    // Charger les détails du buddy
    const buddySub = this.buddyService.getBuddyPairById(buddyId).subscribe({
      next: (buddy: BuddyPair) => {
        console.log('✅ Buddy reçu:', buddy);
        this.buddy = buddy;
        this.loadSessions(buddyId);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement du buddy:', error);
        this.error = 'Impossible de charger les détails de ce buddy';
        this.loading = false;
      }
    });

    this.subscriptions.add(buddySub);
  }

  /**
   * Charge les sessions du buddy
   */
  private loadSessions(buddyId: number): void {
    console.log(`🔍 Chargement des sessions pour le buddy ${buddyId}`);
    
    // Pour le moment, charger directement toutes les sessions sans séparer upcoming/historical
    const allSessionsSub = this.sessionService.getSessionsByBuddyPair(buddyId).subscribe({
      next: (allSessions: BuddySession[]) => {
        console.log('✅ Toutes les sessions reçues:', allSessions);
        
        // Combiner et trier toutes les sessions par date (plus récentes d'abord)
        this.sessions = allSessions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des sessions:', error);
        // En cas d'erreur, afficher quand même la page avec une liste vide
        this.sessions = [];
        this.loading = false;
      }
    });

    this.subscriptions.add(allSessionsSub);
  }

  /**
   * Obtient le nom du partenaire
   */
  getPartnerName(): string {
    if (!this.buddy || !this.currentUser) return 'Inconnu';
    
    if (this.buddy.userID_1 === this.currentUser.id && this.buddy.user2) {
      return this.buddy.user2.nom;
    } else if (this.buddy.userID_2 === this.currentUser.id && this.buddy.user1) {
      return this.buddy.user1.nom;
    }
    
    return 'Inconnu';
  }

  /**
   * Obtient l'avatar du partenaire
   */
  getPartnerAvatar(): string {
    if (!this.buddy || !this.currentUser) return '👤';
    
    if (this.buddy.userID_1 === this.currentUser.id && this.buddy.user2?.avatar) {
      return this.buddy.user2.avatar;
    } else if (this.buddy.userID_2 === this.currentUser.id && this.buddy.user1?.avatar) {
      return this.buddy.user1.avatar;
    }
    
    return '👤';
  }

  /**
   * Obtient la couleur du statut de session
   */
  getSessionStatusColor(status: string): string {
    switch (status) {
      case 'PLANIFIEE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONFIRMEE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TERMINEE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtient le texte du statut de session
   */
  getSessionStatusText(status: string): string {
    switch (status) {
      case 'PLANIFIEE':
        return 'Planifiée';
      case 'CONFIRMEE':
        return 'Confirmée';
      case 'ANNULEE':
        return 'Annulée';
      case 'TERMINEE':
        return 'Terminée';
      default:
        return status;
    }
  }

  /**
   * Obtient l'icône du statut de session
   */
  getSessionStatusIcon(status: string): string {
    switch (status) {
      case 'PLANIFIEE':
        return '📅';
      case 'CONFIRMEE':
        return '✅';
      case 'ANNULEE':
        return '❌';
      case 'TERMINEE':
        return '🏁';
      default:
        return '❓';
    }
  }

  /**
   * Retourne à la liste des buddies
   */
  goBack(): void {
    this.router.navigate(['/buddies']);
  }

  /**
   * Planifie une nouvelle session
   */
  planSession(): void {
    if (this.buddy) {
      this.router.navigate(['/buddies', this.buddy.idPair, 'plan-session']);
    }
  }
}
