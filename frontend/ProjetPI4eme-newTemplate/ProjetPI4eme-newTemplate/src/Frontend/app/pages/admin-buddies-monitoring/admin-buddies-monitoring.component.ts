import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BuddyService } from '../../services/buddy.service';
import { BuddySessionService } from '../../services/buddy-session.service';
import { ClubService } from '../../services/club';
import { BuddyPair, BuddyMatchStatus, SessionStatus } from '../../models/buddy.models';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Interface pour les buddies enrichis
interface BuddyWithStats extends BuddyPair {
  user1Name?: string;
  user2Name?: string;
  user1Email?: string;
  user2Email?: string;
  user1Avatar?: string;
  user2Avatar?: string;
  clubName?: string;
  sessionCount?: number;
  lastSessionDate?: Date;
  averageSessionDuration?: number;
}

// Interface pour les statistiques
interface MonitoringStats {
  totalBuddies: number;
  activeBuddies: number;
  pendingRequests: number;
  completedBuddies: number;
  cancelledBuddies: number;
  sessionsThisMonth: number;
  totalSessions: number;
  averageSessionsPerBuddy: number;
  averageSessionDuration: number;
}

@Component({
  selector: 'app-admin-buddies-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-buddies-monitoring.component.html',
  styleUrls: ['./admin-buddies-monitoring.component.scss']
})
export class AdminBuddiesMonitoringComponent implements OnInit, OnDestroy {
  stats: MonitoringStats = {
    totalBuddies: 0,
    activeBuddies: 0,
    pendingRequests: 0,
    completedBuddies: 0,
    cancelledBuddies: 0,
    sessionsThisMonth: 0,
    totalSessions: 0,
    averageSessionsPerBuddy: 0,
    averageSessionDuration: 0
  };
  
  activeBuddies: BuddyWithStats[] = [];
  loading = true;
  error: string | null = null;
  
  // Graphiques Chart.js
  statusChart: Chart | null = null;
  sessionsChart: Chart | null = null;
  clubsChart: Chart | null = null;
  
  // Périodes pour les filtres
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';
  
  private subscriptions = new Subscription();

  constructor(
    private buddyService: BuddyService,
    private sessionService: BuddySessionService,
    private clubService: ClubService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    // Enregistrer Chart.js
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadMonitoringData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  /**
   * Détruit les graphiques Chart.js
   */
  private destroyCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
    if (this.sessionsChart) {
      this.sessionsChart.destroy();
      this.sessionsChart = null;
    }
    if (this.clubsChart) {
      this.clubsChart.destroy();
      this.clubsChart = null;
    }
  }

  /**
   * Charge toutes les données de monitoring
   */
  loadMonitoringData(): void {
    this.loading = true;
    
    // Charger les données en parallèle
    const buddiesSub = this.buddyService.getBuddyPairs().subscribe({
      next: (buddies: BuddyPair[]) => {
        console.log('✅ Buddies chargés:', buddies);
        this.processBuddiesData(buddies);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des buddies:', error);
        this.error = 'Impossible de charger les données de buddies';
        this.loading = false;
        console.log('❌ Loading arrêté en erreur, isLoading =', this.loading);
        
        // Forcer la détection de changement même en erreur
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(buddiesSub);
  }

  /**
   * Traite les données des buddies et calcule les statistiques
   */
  private processBuddiesData(buddies: BuddyPair[]): void {
    console.log('🔄 Traitement des données buddies...');
    
    // Enrichir les données des buddies
    this.activeBuddies = this.enrichBuddiesWithStats(buddies);
    console.log('✅ Buddies enrichis:', this.activeBuddies.length);
    
    // Calculer les statistiques
    this.calculateStatistics(buddies);
    console.log('✅ Statistiques calculées');
    
    // Créer les graphiques
    setTimeout(() => {
      this.createCharts();
      console.log('✅ Graphiques créés');
    }, 100);
    
    this.loading = false;
    console.log('✅ Loading terminé, isLoading =', this.loading);
    
    // Forcer la détection de changement
    this.cdr.detectChanges();
    console.log('🔄 Change detection forcée');
  }

  /**
   * Enrichit les buddies avec les statistiques des sessions
   */
  private enrichBuddiesWithStats(buddies: BuddyPair[]): BuddyWithStats[] {
    return buddies
      .filter(buddy => buddy.status === BuddyMatchStatus.ACTIVE)
      .map(buddy => {
        const enriched: BuddyWithStats = { ...buddy };
        
        // Ajouter les informations des utilisateurs (mock data)
        enriched.user1Name = this.getUserName(buddy.userID_1);
        enriched.user2Name = this.getUserName(buddy.userID_2);
        enriched.user1Email = this.getUserEmail(buddy.userID_1);
        enriched.user2Email = this.getUserEmail(buddy.userID_2);
        enriched.user1Avatar = this.getUserAvatar(buddy.userID_1);
        enriched.user2Avatar = this.getUserAvatar(buddy.userID_2);
        
        // Ajouter le nom du club
        enriched.clubName = buddy.club?.nom || 'Club inconnu';
        
        // Simuler les statistiques de sessions (adapter selon votre API)
        enriched.sessionCount = this.getSessionCount(buddy.idPair);
        enriched.lastSessionDate = this.getLastSessionDate(buddy.idPair);
        enriched.averageSessionDuration = this.getAverageSessionDuration(buddy.idPair);
        
        return enriched;
      });
  }

  /**
   * Calcule les statistiques globales
   */
  private calculateStatistics(buddies: BuddyPair[]): void {
    this.stats.totalBuddies = buddies.length;
    this.stats.activeBuddies = buddies.filter(b => b.status === BuddyMatchStatus.ACTIVE).length;
    this.stats.pendingRequests = buddies.filter(b => b.status === BuddyMatchStatus.PENDING).length;
    this.stats.completedBuddies = buddies.filter(b => b.status === BuddyMatchStatus.COMPLETED).length;
    this.stats.cancelledBuddies = buddies.filter(b => b.status === BuddyMatchStatus.CANCELLED).length;
    
    // Simuler les statistiques de sessions (adapter selon votre API)
    this.stats.sessionsThisMonth = this.getMonthlySessionCount();
    this.stats.totalSessions = this.getTotalSessionCount();
    this.stats.averageSessionsPerBuddy = this.stats.activeBuddies > 0 ? 
      Math.round(this.stats.totalSessions / this.stats.activeBuddies) : 0;
    this.stats.averageSessionDuration = this.getGlobalAverageDuration();
  }

  /**
   * Crée les graphiques Chart.js
   */
  private createCharts(): void {
    this.createStatusChart();
    this.createSessionsChart();
    this.createClubsChart();
  }

  /**
   * Crée le graphique des statuts
   */
  private createStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data = {
      labels: ['En attente', 'Actifs', 'Terminés', 'Annulés'],
      datasets: [{
        label: 'Nombre de buddies',
        data: [
          this.stats.pendingRequests,
          this.stats.activeBuddies,
          this.stats.completedBuddies,
          this.stats.cancelledBuddies
        ],
        backgroundColor: [
          'rgba(250, 204, 21, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(250, 204, 21, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2
      }]
    };

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.statusChart = new Chart(ctx, config);
  }

  /**
   * Crée le graphique des sessions
   */
  private createSessionsChart(): void {
    const ctx = document.getElementById('sessionsChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Simuler les données de sessions par mois (adapter selon votre API)
    const monthlyData = this.getMonthlySessionsData();

    const data = {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Sessions réalisées',
        data: monthlyData.values,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.sessionsChart = new Chart(ctx, config);
  }

  /**
   * Crée le graphique des clubs
   */
  private createClubsChart(): void {
    const ctx = document.getElementById('clubsChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Simuler les données par club (adapter selon votre API)
    const clubData = this.getClubsSessionsData();

    const data = {
      labels: clubData.labels,
      datasets: [{
        label: 'Sessions par club',
        data: clubData.values,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 2
      }]
    };

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.clubsChart = new Chart(ctx, config);
  }

  /**
   * Change la période sélectionnée
   */
  changePeriod(period: 'week' | 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod = period;
    // Recalculer les données selon la période
    this.loadMonitoringData();
  }

  /**
   * Exporte les données (placeholder)
   */
  exportData(): void {
    console.log('📊 Export des données de monitoring:', {
      stats: this.stats,
      activeBuddies: this.activeBuddies
    });
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
      6: 'Frank Moreau'
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
      6: 'frank@example.com'
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
      6: '👨‍🎨'
    };
    return mockAvatars[userId as keyof typeof mockAvatars] || '👤';
  }

  /**
   * Simule le nombre de sessions (adapter selon votre API)
   */
  private getSessionCount(buddyId: number): number {
    // Simuler différents nombres de sessions
    return Math.floor(Math.random() * 20) + 1;
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
   * Simule le nombre de sessions ce mois (adapter selon votre API)
   */
  private getMonthlySessionCount(): number {
    return Math.floor(Math.random() * 50) + 20;
  }

  /**
   * Simule le nombre total de sessions (adapter selon votre API)
   */
  private getTotalSessionCount(): number {
    return Math.floor(Math.random() * 200) + 100;
  }

  /**
   * Simule la durée moyenne globale (adapter selon votre API)
   */
  private getGlobalAverageDuration(): number {
    return Math.floor(Math.random() * 30) + 45; // 45-75 minutes
  }

  /**
   * Simule les données mensuelles pour le graphique (adapter selon votre API)
   */
  private getMonthlySessionsData(): { labels: string[], values: number[] } {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const values = months.map(() => Math.floor(Math.random() * 30) + 10);
    
    return { labels: months, values };
  }

  /**
   * Get real club data from user's buddies for the chart
   */
  private getClubsSessionsData(): { labels: string[], values: number[] } {
    // Get unique clubs from user's active buddies
    const clubMap = new Map<string, number>();
    
    this.activeBuddies.forEach(buddy => {
      if (buddy.clubName) {
        const currentCount = clubMap.get(buddy.clubName) || 0;
        clubMap.set(buddy.clubName, currentCount + (buddy.sessionCount || 1));
      }
    });
    
    // Convert Map to arrays
    const labels = Array.from(clubMap.keys());
    const values = Array.from(clubMap.values());
    
    return { labels, values };
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
   * Obtient la couleur selon le nombre de sessions
   */
  getSessionCountColor(count: number): string {
    if (count >= 15) return 'text-green-600 bg-green-100';
    if (count >= 10) return 'text-blue-600 bg-blue-100';
    if (count >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  }

  /**
   * Obtient le texte selon le nombre de sessions
   */
  getSessionCountText(count: number): string {
    if (count >= 15) return 'Très actif';
    if (count >= 10) return 'Actif';
    if (count >= 5) return 'Modéré';
    return 'Peu actif';
  }

  /**
   * Navigate back to clubs management page
   */
  goBackToClubs(): void {
    this.router.navigate(['/back/clubs']);
  }
}
