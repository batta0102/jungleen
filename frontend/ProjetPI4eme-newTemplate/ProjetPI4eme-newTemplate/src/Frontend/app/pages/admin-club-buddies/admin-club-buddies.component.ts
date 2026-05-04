import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BuddyService } from '../../services/buddy.service';
import { ClubService } from '../../services/club';
import { BuddyPair, BuddyMatchStatus } from '../../models/buddy.models';

// Interface pour les buddies enrichis
interface ClubBuddy extends BuddyPair {
  user1Name?: string;
  user2Name?: string;
  user1Email?: string;
  user2Email?: string;
  user1Avatar?: string;
  user2Avatar?: string;
  sessionCount?: number;
  lastSessionDate?: Date;
  averageSessionDuration?: number;
  participationRate?: number;
}

// Interface pour les informations du club
interface ClubInfo {
  idClub: number;
  nom: string;
  description: string;
  niveau: string;
  capacityMax: number;
  status: string;
  dateCreation: Date;
  clubOwner: number;
  memberCount?: number;
  activeMemberCount?: number;
}

// Interface pour les statistiques du club
interface ClubStats {
  totalBuddies: number;
  activeBuddies: number;
  pendingBuddies: number;
  completedBuddies: number;
  cancelledBuddies: number;
  participationRate: number;
  averageSessionsPerBuddy: number;
  averageSessionDuration: number;
  totalSessions: number;
  activeMemberCount: number;
  totalMemberCount: number;
}

@Component({
  selector: 'app-admin-club-buddies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-club-buddies.component.html',
  styleUrls: ['./admin-club-buddies.component.scss']
})
export class AdminClubBuddiesComponent implements OnInit, OnDestroy {
  clubInfo: ClubInfo | null = null;
  clubBuddies: ClubBuddy[] = [];
  stats: ClubStats = {
    totalBuddies: 0,
    activeBuddies: 0,
    pendingBuddies: 0,
    completedBuddies: 0,
    cancelledBuddies: 0,
    participationRate: 0,
    averageSessionsPerBuddy: 0,
    averageSessionDuration: 0,
    totalSessions: 0,
    activeMemberCount: 0,
    totalMemberCount: 0
  };
  
  loading = true;
  error: string | null = null;
  selectedView: 'all' | 'active' | 'pending' | 'completed' = 'all';
  
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private buddyService: BuddyService,
    private clubService: ClubService
  ) {}

  ngOnInit(): void {
    this.loadClubData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les données du club
   */
  private loadClubData(): void {
    const clubId = this.route.snapshot.paramMap.get('id');
    if (!clubId) {
      this.error = 'ID de club non spécifié';
      this.loading = false;
      return;
    }

    console.log(`🔍 Chargement des données du club ${clubId}`);
    
    // Charger les informations du club
    this.loadClubInfo(+clubId);
    
    // Charger les buddies du club
    this.loadClubBuddies(+clubId);
  }

  /**
   * Charge les informations du club
   */
  private loadClubInfo(clubId: number): void {
    const clubSub = this.clubService.getClubById(clubId).subscribe({
      next: (club: any) => {
        console.log('✅ Club reçu:', club);
        this.clubInfo = {
          ...club,
          memberCount: this.getMemberCount(clubId),
          activeMemberCount: this.getActiveMemberCount(clubId)
        };
        this.updateStats();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement du club:', error);
        this.error = 'Impossible de charger les informations du club';
        this.loading = false;
      }
    });

    this.subscriptions.add(clubSub);
  }

  /**
   * Charge les buddies du club
   */
  private loadClubBuddies(clubId: number): void {
    const buddySub = this.buddyService.getBuddyPairsByClub(clubId).subscribe({
      next: (buddies: BuddyPair[]) => {
        console.log('✅ Buddies du club reçus:', buddies);
        this.clubBuddies = this.enrichBuddiesWithStats(buddies);
        this.updateStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des buddies du club:', error);
        this.error = 'Impossible de charger les buddies du club';
        this.loading = false;
      }
    });

    this.subscriptions.add(buddySub);
  }

  /**
   * Enrichit les buddies avec les statistiques
   */
  private enrichBuddiesWithStats(buddies: BuddyPair[]): ClubBuddy[] {
    return buddies.map(buddy => {
      const enriched: ClubBuddy = { ...buddy };
      
      // Ajouter les informations des utilisateurs (mock data)
      enriched.user1Name = this.getUserName(buddy.userID_1);
      enriched.user2Name = this.getUserName(buddy.userID_2);
      enriched.user1Email = this.getUserEmail(buddy.userID_1);
      enriched.user2Email = this.getUserEmail(buddy.userID_2);
      enriched.user1Avatar = this.getUserAvatar(buddy.userID_1);
      enriched.user2Avatar = this.getUserAvatar(buddy.userID_2);
      
      // Simuler les statistiques de sessions (adapter selon votre API)
      enriched.sessionCount = this.getSessionCount(buddy.idPair);
      enriched.lastSessionDate = this.getLastSessionDate(buddy.idPair);
      enriched.averageSessionDuration = this.getAverageSessionDuration(buddy.idPair);
      enriched.participationRate = this.getParticipationRate(buddy.idPair);
      
      return enriched;
    });
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    if (!this.clubBuddies.length || !this.clubInfo) return;
    
    this.stats.totalBuddies = this.clubBuddies.length;
    this.stats.activeBuddies = this.clubBuddies.filter(b => b.status === BuddyMatchStatus.ACTIVE).length;
    this.stats.pendingBuddies = this.clubBuddies.filter(b => b.status === BuddyMatchStatus.PENDING).length;
    this.stats.completedBuddies = this.clubBuddies.filter(b => b.status === BuddyMatchStatus.COMPLETED).length;
    this.stats.cancelledBuddies = this.clubBuddies.filter(b => b.status === BuddyMatchStatus.CANCELLED).length;
    
    // Calculer le taux de participation
    const totalMembers = this.clubInfo.memberCount || 0;
    const membersWithBuddies = this.getUniqueMemberCount();
    this.stats.participationRate = totalMembers > 0 ? 
      Math.round((membersWithBuddies / totalMembers) * 100) : 0;
    
    // Calculer les statistiques de sessions
    const activeBuddies = this.clubBuddies.filter(b => b.status === BuddyMatchStatus.ACTIVE);
    this.stats.averageSessionsPerBuddy = activeBuddies.length > 0 ?
      Math.round(activeBuddies.reduce((sum, b) => sum + (b.sessionCount || 0), 0) / activeBuddies.length) : 0;
    
    this.stats.averageSessionDuration = activeBuddies.length > 0 ?
      Math.round(activeBuddies.reduce((sum, b) => sum + (b.averageSessionDuration || 0), 0) / activeBuddies.length) : 0;
    
    this.stats.totalSessions = this.clubBuddies.reduce((sum, b) => sum + (b.sessionCount || 0), 0);
    this.stats.activeMemberCount = this.clubInfo.activeMemberCount || 0;
    this.stats.totalMemberCount = this.clubInfo.memberCount || 0;
  }

  /**
   * Change la vue sélectionnée
   */
  changeView(view: 'all' | 'active' | 'pending' | 'completed'): void {
    this.selectedView = view;
  }

  /**
   * Obtient les buddies filtrés selon la vue
   */
  getFilteredBuddies(): ClubBuddy[] {
    switch (this.selectedView) {
      case 'active':
        return this.clubBuddies.filter(b => b.status === BuddyMatchStatus.ACTIVE);
      case 'pending':
        return this.clubBuddies.filter(b => b.status === BuddyMatchStatus.PENDING);
      case 'completed':
        return this.clubBuddies.filter(b => b.status === BuddyMatchStatus.COMPLETED);
      default:
        return this.clubBuddies;
    }
  }

  /**
   * Retourne à la liste des clubs
   */
  goBack(): void {
    this.router.navigate(['/admin/clubs']);
  }

  /**
   * Exporte les données du club
   */
  exportData(): void {
    console.log('📊 Export des données du club:', {
      clubInfo: this.clubInfo,
      stats: this.stats,
      buddies: this.clubBuddies
    });
  }

  /**
   * Obtient la couleur du statut
   */
  getStatusColor(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case BuddyMatchStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case BuddyMatchStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case BuddyMatchStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Obtient l'icône du statut
   */
  getStatusIcon(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.PENDING:
        return '⏳';
      case BuddyMatchStatus.ACTIVE:
        return '✅';
      case BuddyMatchStatus.COMPLETED:
        return '🏁';
      case BuddyMatchStatus.CANCELLED:
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Obtient le texte du statut
   */
  getStatusText(status: BuddyMatchStatus): string {
    switch (status) {
      case BuddyMatchStatus.PENDING:
        return 'En attente';
      case BuddyMatchStatus.ACTIVE:
        return 'Actif';
      case BuddyMatchStatus.COMPLETED:
        return 'Terminé';
      case BuddyMatchStatus.CANCELLED:
        return 'Annulé';
      default:
        return status;
    }
  }

  /**
   * Obtient la couleur selon le taux de participation
   */
  getParticipationColor(rate: number): string {
    if (rate >= 70) return 'text-green-600 bg-green-100';
    if (rate >= 50) return 'text-blue-600 bg-blue-100';
    if (rate >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }

  /**
   * Obtient le texte selon le taux de participation
   */
  getParticipationText(rate: number): string {
    if (rate >= 70) return 'Excellent';
    if (rate >= 50) return 'Bon';
    if (rate >= 30) return 'Moyen';
    return 'Faible';
  }

  /**
   * Formate la durée pour l'affichage
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    }
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Simule le nombre de membres (adapter selon votre API)
   */
  private getMemberCount(clubId: number): number {
    // Simuler différents nombres de membres selon le club
    return Math.floor(Math.random() * 50) + 20;
  }

  /**
   * Simule le nombre de membres actifs (adapter selon votre API)
   */
  private getActiveMemberCount(clubId: number): number {
    const total = this.getMemberCount(clubId);
    return Math.floor(total * 0.7); // 70% des membres sont actifs
  }

  /**
   * Calcule le nombre de membres uniques dans les buddies
   */
  getUniqueMemberCount(): number {
    const memberIds = new Set<number>();
    this.clubBuddies.forEach(buddy => {
      memberIds.add(buddy.userID_1);
      memberIds.add(buddy.userID_2);
    });
    return memberIds.size;
  }

  /**
   * Simule le nom d'utilisateur (adapter selon votre API)
   */
  private getUserName(userId: number): string {
    const mockUsers = {
      1: 'Alice Martin',
      2: 'Bob Dupont',
      3: 'Claire Bernard',
      4: 'David Petit',
      5: 'Emma Leroy',
      6: 'Frank Moreau',
      7: 'Grace Robert',
      8: 'Henry Dubois'
    };
    return mockUsers[userId as keyof typeof mockUsers] || `Utilisateur ${userId}`;
  }

  /**
   * Simule l'email d'utilisateur (adapter selon votre API)
   */
  private getUserEmail(userId: number): string {
    const mockEmails = {
      1: 'alice@example.com',
      2: 'bob@example.com',
      3: 'claire@example.com',
      4: 'david@example.com',
      5: 'emma@example.com',
      6: 'frank@example.com',
      7: 'grace@example.com',
      8: 'henry@example.com'
    };
    return mockEmails[userId as keyof typeof mockEmails] || `user${userId}@example.com`;
  }

  /**
   * Simule l'avatar d'utilisateur (adapter selon votre API)
   */
  private getUserAvatar(userId: number): string {
    const mockAvatars = {
      1: '👩‍🎓',
      2: '👨‍🏫',
      3: '👩‍💼',
      4: '👨‍💻',
      5: '👩‍🔬',
      6: '👨‍🎨',
      7: '👩‍⚕️',
      8: '👨‍🔧'
    };
    return mockAvatars[userId as keyof typeof mockAvatars] || '👤';
  }

  /**
   * Simule le nombre de sessions (adapter selon votre API)
   */
  private getSessionCount(buddyId: number): number {
    // Simuler différents nombres de sessions
    return Math.floor(Math.random() * 25) + 1;
  }

  /**
   * Simule la date de dernière session (adapter selon votre API)
   */
  private getLastSessionDate(buddyId: number): Date {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  /**
   * Simule la durée moyenne des sessions (adapter selon votre API)
   */
  private getAverageSessionDuration(buddyId: number): number {
    // Simuler des durées entre 30 et 90 minutes
    return Math.floor(Math.random() * 60) + 30;
  }

  /**
   * Simule le taux de participation (adapter selon votre API)
   */
  private getParticipationRate(buddyId: number): number {
    // Simuler différents taux de participation
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  }
}
