import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Enums pour les statuts (copiés temporairement pour éviter les erreurs d'import)
enum BuddyStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  ACTIF = 'ACTIF',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

interface BuddyActivity {
  id: number;
  type: 'request' | 'accept' | 'session' | 'complete';
  title: string;
  description: string;
  timestamp: Date;
  userName?: string;
  clubName?: string;
}

interface BuddyStats {
  pendingRequests: number;
  activeBuddies: number;
  totalSessions: number;
  completedBuddies: number;
}

@Component({
  selector: 'app-buddy-system-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buddy-system-card.component.html',
  styleUrls: ['./buddy-system-card.component.scss']
})
export class BuddySystemCardComponent implements OnInit, OnDestroy {
  stats: BuddyStats = {
    pendingRequests: 0,
    activeBuddies: 0,
    totalSessions: 0,
    completedBuddies: 0
  };
  
  recentActivities: BuddyActivity[] = [];
  isLoading = true;
  error: string | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBuddyData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les données du système buddy
   */
  private loadBuddyData(): void {
    this.isLoading = true;
    this.error = null;

    // Simuler le chargement des données pour la démo
    setTimeout(() => {
      // Simuler des données buddies
      const mockBuddies = [
        { status: BuddyStatus.EN_ATTENTE },
        { status: BuddyStatus.ACTIF },
        { status: BuddyStatus.ACTIF },
        { status: BuddyStatus.TERMINE },
        { status: BuddyStatus.EN_ATTENTE },
        { status: BuddyStatus.ACTIF },
        { status: BuddyStatus.EN_ATTENTE },
        { status: BuddyStatus.ACTIF }
      ];
      
      this.calculateStats(mockBuddies);
      this.generateRecentActivities(mockBuddies);
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Calcule les statistiques à partir des données buddies
   */
  private calculateStats(buddies: any[]): void {
    this.stats.pendingRequests = buddies.filter(b => b.status === BuddyStatus.EN_ATTENTE).length;
    this.stats.activeBuddies = buddies.filter(b => b.status === BuddyStatus.ACTIF).length;
    this.stats.completedBuddies = buddies.filter(b => b.status === BuddyStatus.TERMINE).length;
    
    // Simuler le nombre total de sessions (adapter selon votre API)
    this.stats.totalSessions = this.calculateTotalSessions(buddies);
  }

  /**
   * Génère les activités récentes (simulées pour la démo)
   */
  private generateRecentActivities(buddies: any[]): void {
    // Simuler des activités récentes
    this.recentActivities = [
      {
        id: 1,
        type: 'request',
        title: 'Nouvelle demande de buddy',
        description: 'Alice Martin demande à être buddy avec Bob Dupont',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // Il y a 15 minutes
        userName: 'Alice Martin',
        clubName: 'English Club'
      },
      {
        id: 2,
        type: 'accept',
        title: 'Demande acceptée',
        description: 'Claire Bernard a accepté la demande de David Petit',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Il y a 2 heures
        userName: 'Claire Bernard',
        clubName: 'Business Club'
      },
      {
        id: 3,
        type: 'session',
        title: 'Session planifiée',
        description: 'Emma Leroy et Frank Moreau ont planifié une session',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // Il y a 4 heures
        userName: 'Emma Leroy',
        clubName: 'Conversation Club'
      },
      {
        id: 4,
        type: 'complete',
        title: 'Buddy terminé',
        description: 'Grace Robert et Henry Dubois ont terminé leur buddy',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Il y a 1 jour
        userName: 'Grace Robert',
        clubName: 'Grammar Club'
      }
    ];
  }

  /**
   * Calcule le nombre total de sessions (simulé)
   */
  private calculateTotalSessions(buddies: any[]): number {
    return buddies
      .filter(b => b.status === BuddyStatus.ACTIF)
      .reduce((total, buddy) => total + Math.floor(Math.random() * 10) + 1, 0);
  }

  /**
   * Navigation vers la page de gestion des demandes
   */
  goToBuddyRequests(): void {
    this.router.navigate(['/admin/buddies/requests']);
  }

  /**
   * Navigation vers le monitoring
   */
  goToMonitoring(): void {
    this.router.navigate(['/admin/buddies/monitoring']);
  }

  /**
   * Obtient l'icône selon le type d'activité
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'request':
        return '📝';
      case 'accept':
        return '✅';
      case 'session':
        return '📅';
      case 'complete':
        return '🏁';
      default:
        return '📊';
    }
  }

  /**
   * Obtient la couleur selon le type d'activité
   */
  getActivityColor(type: string): string {
    switch (type) {
      case 'request':
        return 'text-yellow-600 bg-yellow-100';
      case 'accept':
        return 'text-green-600 bg-green-100';
      case 'session':
        return 'text-blue-600 bg-blue-100';
      case 'complete':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Formate la date relative
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Moins d'une minute
      return 'À l\'instant';
    } else if (diff < 3600000) { // Moins d'une heure
      return `Il y a ${Math.floor(diff / 60000)} min`;
    } else if (diff < 86400000) { // Moins d'un jour
      return `Il y a ${Math.floor(diff / 3600000)} h`;
    } else {
      return `Il y a ${Math.floor(diff / 86400000)} j`;
    }
  }

  /**
   * Vérifie s'il y a des demandes en attente
   */
  hasPendingRequests(): boolean {
    return this.stats.pendingRequests > 0;
  }

  /**
   * Obtient la couleur du compteur de demandes
   */
  getPendingRequestsColor(): string {
    if (this.stats.pendingRequests === 0) return 'text-gray-600';
    if (this.stats.pendingRequests <= 5) return 'text-yellow-600';
    if (this.stats.pendingRequests <= 10) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Obtient le texte d'alerte pour les demandes
   */
  getPendingRequestsAlert(): string {
    if (this.stats.pendingRequests === 0) return 'Aucune demande en attente';
    if (this.stats.pendingRequests <= 5) return 'Quelques demandes à traiter';
    if (this.stats.pendingRequests <= 10) return 'Plusieurs demandes en attente';
    return 'Nombreuses demandes en attente';
  }
}
