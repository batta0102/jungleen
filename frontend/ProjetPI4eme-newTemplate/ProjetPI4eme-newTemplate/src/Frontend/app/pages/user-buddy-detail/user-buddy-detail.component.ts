import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BuddyService } from '../../services/buddy.service';
import { BuddySessionService } from '../../services/buddy-session.service';
import { UserService } from '../../services/user.service';
import { SharedCalendarComponent } from '../../components/shared-calendar/shared-calendar.component';
import { BuddyPair, BuddySession, SessionStatus, SatisfactionLevel, ConfirmSessionDTO, BuddyMatchStatus } from '../../models/buddy.models';

@Component({
  selector: 'app-user-buddy-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedCalendarComponent],
  templateUrl: './user-buddy-detail.component.html',
  styleUrls: ['./user-buddy-detail.component.scss']
})
export class UserBuddyDetailComponent implements OnInit, OnDestroy {
  buddy: BuddyPair | null = null;
  upcomingSessions: BuddySession[] = [];
  historicalSessions: BuddySession[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any = null;
  
  // Make enums available to template
  BuddyMatchStatus = BuddyMatchStatus;
  SessionStatus = SessionStatus;
  SatisfactionLevel = SatisfactionLevel;
  
  // Gestion des onglets
  activeTab: 'upcoming' | 'history' | 'calendrier' = 'upcoming';
  
  // Reference to calendar component for refresh
  @ViewChild(SharedCalendarComponent) calendarComponent?: SharedCalendarComponent;
  
  // Gestion de la confirmation de session
  selectedSession: BuddySession | null = null;
  satisfactionOptions = Object.values(SatisfactionLevel);
  selectedSatisfaction: SatisfactionLevel = SatisfactionLevel.SATISFAIT;
  selectedComment: string = '';
  confirmingSession = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private buddyService: BuddyService,
    private sessionService: BuddySessionService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    
    const routeSub = this.route.params.subscribe(params => {
      const buddyId = +params['id'];
      if (buddyId) {
        this.loadBuddy(buddyId);
      }
    });

    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les informations du buddy
   */
  private loadBuddy(buddyId: number): void {
    this.loading = true;
    
    const buddySub = this.buddyService.getBuddyPairById(buddyId).subscribe({
      next: (buddy: BuddyPair) => {
        console.log('✅ Buddy chargé:', buddy);
        this.buddy = buddy;
        this.loadBuddySessions(buddyId);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement du buddy:', error);
        this.error = 'Impossible de charger les informations du buddy';
        this.loading = false;
        // Utiliser un buddy mock pour le développement
        this.buddy = this.createMockBuddy(buddyId);
        this.loadBuddySessions(buddyId);
      }
    });

    this.subscriptions.add(buddySub);
  }

  /**
   * Charge les sessions du buddy
   */
  private loadBuddySessions(buddyId: number): void {
    // Charger les sessions à venir
    const upcomingSub = this.sessionService.getSessionsAVenir(buddyId).subscribe({
      next: (sessions: BuddySession[]) => {
        console.log('✅ Sessions à venir reçues:', sessions);
        this.upcomingSessions = sessions.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des sessions à venir:', error);
        // Utiliser des données mock pour le développement
        this.upcomingSessions = this.createMockSessions(buddyId, 'upcoming');
        this.cdr.detectChanges();
      }
    });

    // Charger l'historique des sessions
    const historySub = this.sessionService.getHistoriqueSessions(buddyId).subscribe({
      next: (sessions: BuddySession[]) => {
        console.log('✅ Historique des sessions reçu:', sessions);
        this.historicalSessions = sessions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement de l\'historique:', error);
        // Utiliser des données mock pour le développement
        this.historicalSessions = this.createMockSessions(buddyId, 'history');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(upcomingSub);
    this.subscriptions.add(historySub);
  }

  /**
   * Change d'onglet
   */
  switchTab(tab: 'upcoming' | 'history' | 'calendrier'): void {
    this.activeTab = tab;
    
    // Si on bascule vers l'onglet calendrier, forcer le rafraîchissement
    if (tab === 'calendrier' && this.calendarComponent) {
      setTimeout(() => {
        this.calendarComponent?.refreshCalendar();
      }, 100); // Petit délai pour s'assurer que le composant est bien initialisé
    }
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
   * Obtient l'email du partenaire
   */
  getPartnerEmail(): string {
    if (!this.buddy || !this.currentUser) return 'inconnu@example.com';
    
    if (this.buddy.userID_1 === this.currentUser.id && this.buddy.user2) {
      return this.buddy.user2.email;
    } else if (this.buddy.userID_2 === this.currentUser.id && this.buddy.user1) {
      return this.buddy.user1.email;
    }
    
    return 'inconnu@example.com';
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
      case 'EN_COURS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'TERMINEE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800 border-red-200';
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
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINEE':
        return 'Terminée';
      case 'ANNULEE':
        return 'Annulée';
      default:
        return 'Inconnue';
    }
  }

  /**
   * Obtient l'icône du statut de session
   */
  getSessionStatusIcon(status: string): string {
    switch (status) {
      case 'PLANIFIEE':
        return '📅';
      case 'EN_COURS':
        return '⏳';
      case 'TERMINEE':
        return '✅';
      case 'ANNULEE':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Obtient la couleur de satisfaction
   */
  getSatisfactionColor(satisfaction: SatisfactionLevel): string {
    switch (satisfaction) {
      case SatisfactionLevel.TRES_SATISFAIT:
        return 'bg-green-100 text-green-800 border-green-200';
      case SatisfactionLevel.SATISFAIT:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case SatisfactionLevel.NEUTRE:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case SatisfactionLevel.PEU_SATISFAIT:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case SatisfactionLevel.PAS_SATISFAIT:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtient le texte de satisfaction
   */
  getSatisfactionText(satisfaction: SatisfactionLevel): string {
    switch (satisfaction) {
      case SatisfactionLevel.TRES_SATISFAIT:
        return 'Très satisfait';
      case SatisfactionLevel.SATISFAIT:
        return 'Satisfait';
      case SatisfactionLevel.NEUTRE:
        return 'Neutre';
      case SatisfactionLevel.PEU_SATISFAIT:
        return 'Peu satisfait';
      case SatisfactionLevel.PAS_SATISFAIT:
        return 'Pas satisfait';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Vérifie si l'utilisateur peut confirmer une session
   */
  canConfirmSession(session: BuddySession): boolean {
    if (!this.currentUser || !this.buddy) return false;
    
    // Vérifier si la session est planifiée
    if (session.status !== 'PLANIFIEE') return false;
    
    // Vérifier si l'utilisateur fait partie du buddy pair
    return this.buddy.userID_1 === this.currentUser.id || this.buddy.userID_2 === this.currentUser.id;
  }

  /**
   * Vérifie si l'utilisateur a déjà confirmé la session
   */
  hasUserConfirmedSession(session: BuddySession): boolean {
    if (!this.currentUser) return false;
    
    if (this.buddy?.userID_1 === this.currentUser.id) {
      return session.confirmeParUtilisateur1 || false;
    } else if (this.buddy?.userID_2 === this.currentUser.id) {
      return session.confirmeParUtilisateur2 || false;
    }
    
    return false;
  }

  /**
   * Obtient la satisfaction de l'utilisateur pour une session
   */
  getUserSatisfaction(session: BuddySession): SatisfactionLevel | null {
    if (!this.currentUser) return null;
    
    if (this.buddy?.userID_1 === this.currentUser.id) {
      const satisfaction = session.satisfactionUtilisateur1;
      return satisfaction ? satisfaction as SatisfactionLevel : null;
    } else if (this.buddy?.userID_2 === this.currentUser.id) {
      const satisfaction = session.satisfactionUtilisateur2;
      return satisfaction ? satisfaction as SatisfactionLevel : null;
    }
    
    return null;
  }

  /**
   * Ouvre la modal de confirmation
   */
  openConfirmModal(session: BuddySession): void {
    this.selectedSession = session;
    this.selectedSatisfaction = SatisfactionLevel.SATISFAIT;
    this.selectedComment = '';
  }

  /**
   * Ferme la modal de confirmation
   */
  closeConfirmModal(): void {
    this.selectedSession = null;
    this.selectedSatisfaction = SatisfactionLevel.SATISFAIT;
    this.selectedComment = '';
  }

  /**
   * Confirme la session
   */
  confirmSession(): void {
    if (!this.selectedSession || !this.currentUser) return;

    // Mapper d'éventuelles anciennes valeurs de satisfaction vers les valeurs backend exactes
    const mapSatisfaction = (s: SatisfactionLevel): SatisfactionLevel => {
      switch (s) {
        case SatisfactionLevel.PEU_SATISFAIT as any:
          return 'INSATISFAIT' as any;
        case SatisfactionLevel.PAS_SATISFAIT as any:
          return 'TRES_INSATISFAIT' as any;
        default:
          return s;
      }
    };

    const payload: ConfirmSessionDTO & { status: string } = {
      satisfaction: mapSatisfaction(this.selectedSatisfaction),
      commentaire: this.selectedComment || undefined,
      status: 'COMPLETEE'
    };

    this.confirmingSession = true;

    this.sessionService
      .confirmSession(this.selectedSession.idSession, this.currentUser.id, payload)
      .subscribe({
        next: (updated: BuddySession) => {
          // Mettre à jour localement à partir de la réponse
          const idxUpcoming = this.upcomingSessions.findIndex(s => s.idSession === updated.idSession);
          const idxHistory = this.historicalSessions.findIndex(s => s.idSession === updated.idSession);

          const applyUpdate = (target: BuddySession) => {
            target.status = updated.status || 'COMPLETEE';
            // Appliquer satisfaction pour l'utilisateur courant
            if (this.buddy?.userID_1 === this.currentUser.id) {
              target.confirmeParUtilisateur1 = true;
              (target as any).satisfactionUtilisateur1 = payload.satisfaction as any;
            } else if (this.buddy?.userID_2 === this.currentUser.id) {
              target.confirmeParUtilisateur2 = true;
              (target as any).satisfactionUtilisateur2 = payload.satisfaction as any;
            }
          };

          if (idxUpcoming !== -1) applyUpdate(this.upcomingSessions[idxUpcoming]);
          if (idxHistory !== -1) applyUpdate(this.historicalSessions[idxHistory]);

          // Fermer la modal et rafraîchir
          this.closeConfirmModal();
          this.confirmingSession = false;
          this.cdr.detectChanges();
          this.refreshSessions();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la confirmation:', error);
          this.confirmingSession = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Annule une session
   */
  cancelSession(session: BuddySession): void {
    if (!this.currentUser) return;

    if (confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      // Appeler l'endpoint DELETE exposé par le backend et retirer la session de l'UI
      this.sessionService.deleteSession(session.idSession, this.currentUser.id).subscribe({
        next: () => {
          // Retirer la session des listes locales
          this.upcomingSessions = this.upcomingSessions.filter(s => s.idSession !== session.idSession);
          this.historicalSessions = this.historicalSessions.filter(s => s.idSession !== session.idSession);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la suppression de la session:', err);
          // En cas d'erreur, recharger depuis le backend
          this.refreshSessions();
        }
      });
    }
  }

  /**
   * Crée un buddy mock pour le développement
   */
  private createMockBuddy(buddyId: number): BuddyPair {
    const currentUser = this.userService.getCurrentUser();
    return {
      idPair: buddyId,
      userID_1: currentUser?.id || 1,
      userID_2: currentUser?.id === 1 ? 2 : 1,
      clubId: 1,
      status: BuddyMatchStatus.ACTIVE,
      dateCreation: new Date(),
      dateActivation: new Date(),
      user1: {
        id: currentUser?.id || 1,
        nom: currentUser?.nom || 'Utilisateur 1',
        email: currentUser?.email || 'user1@example.com',
        avatar: currentUser?.avatar || '👤'
      },
      user2: {
        id: currentUser?.id === 1 ? 2 : 1,
        nom: 'Alice Martin',
        email: 'alice@example.com',
        avatar: '👩‍🎓'
      },
      club: {
        idClub: 1,
        nom: 'English Club'
      }
    };
  }

  /**
   * Crée des sessions mock pour le développement
   */
  private createMockSessions(buddyId: number, type: 'upcoming' | 'history'): BuddySession[] {
    const sessions: BuddySession[] = [];
    const now = new Date();
    
    if (type === 'upcoming') {
      // Sessions à venir
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i * 2);
        sessions.push({
          idSession: buddyId * 100 + i,
          buddyPair: { idPair: buddyId } as any,
          userIdCreateur: this.userService.getCurrentUser()?.id || 1,
          date: date.toISOString(),
          duree: 60,
          sujet: `Session ${i} - Conversation libre`,
          notes: `Session ${i} - Conversation libre`,
          status: "PLANIFIEE",
          confirmeParUtilisateur1: true,
          confirmeParUtilisateur2: true
        });
      }
    } else {
      // Sessions historiques
      for (let i = 1; i <= 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 3);
        sessions.push({
          idSession: buddyId * 200 + i,
          buddyPair: { idPair: buddyId } as any,
          userIdCreateur: this.userService.getCurrentUser()?.id || 1,
          date: date.toISOString(),
          duree: 45 + (i * 15),
          sujet: `Session passée ${i} - ${['Pratique', 'Grammaire', 'Vocabulaire', 'Culture', 'Prononciation'][i - 1]}`,
          notes: `Session passée ${i} - ${['Pratique', 'Grammaire', 'Vocabulaire', 'Culture', 'Prononciation'][i - 1]}`,
          status: "TERMINEE",
          confirmeParUtilisateur1: true,
          confirmeParUtilisateur2: true,
          satisfactionUtilisateur1: [SatisfactionLevel.SATISFAIT, SatisfactionLevel.TRES_SATISFAIT, SatisfactionLevel.SATISFAIT, SatisfactionLevel.TRES_SATISFAIT, SatisfactionLevel.SATISFAIT][i - 1],
          satisfactionUtilisateur2: [SatisfactionLevel.SATISFAIT, SatisfactionLevel.TRES_SATISFAIT, SatisfactionLevel.SATISFAIT, SatisfactionLevel.TRES_SATISFAIT, SatisfactionLevel.SATISFAIT][i - 1]
        });
      }
    }
    
    return sessions;
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

  /**
   * Rafraîchit les sessions
   */
  refreshSessions(): void {
    if (this.buddy) {
      console.log('🔄 Rafraîchissement des sessions du buddy', this.buddy.idPair);
      this.upcomingSessions = [];
      this.historicalSessions = [];
      this.loading = true;
      this.cdr.detectChanges();
      this.loadBuddySessions(this.buddy.idPair);
    }
  }
}
