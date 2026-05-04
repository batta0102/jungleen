import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BuddyService } from '../../services/buddy.service';
import { ClubService } from '../../services/club';
import { BuddyPair, BuddyMatchStatus } from '../../models/buddy.models';

// Interface pour les demandes de buddy étendues
interface BuddyRequest extends BuddyPair {
  user1Name?: string;
  user2Name?: string;
  user1Email?: string;
  user2Email?: string;
  user1Avatar?: string;
  user2Avatar?: string;
  clubName?: string;
  niveauCible?: string;
}

@Component({
  selector: 'app-admin-buddy-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-buddy-requests.component.html',
  styleUrls: ['./admin-buddy-requests.component.scss']
})
export class AdminBuddyRequestsComponent implements OnInit, OnDestroy {
  buddyRequests: BuddyRequest[] = [];
  filteredRequests: BuddyRequest[] = [];
  clubs: any[] = [];
  loading = true;
  error: string | null = null;
  processing = new Set<number>(); // Suivi des demandes en cours de traitement
  
  // Formulaire de filtres
  filterForm: FormGroup;
  
  // Options de filtre
  statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: BuddyMatchStatus.PENDING, label: 'Pending' },
    { value: BuddyMatchStatus.ACTIVE, label: 'Active' },
    { value: BuddyMatchStatus.COMPLETED, label: 'Completed' },
    { value: BuddyMatchStatus.CANCELLED, label: 'Cancelled' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private buddyService: BuddyService,
    private clubService: ClubService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
    
    // Timeout de sécurité pour forcer l'arrêt du loading
    setTimeout(() => {
      if (this.loading) {
        console.log('⚠️ Timeout - Forçage de l\'arrêt du loading');
        this.loading = false;
        this.cdr.detectChanges(); // Forcer la mise à jour
        console.log('🔄 Change detection forcée par timeout');
      }
    }, 5000); // 5 secondes
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Crée le formulaire de filtres
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      clubId: ['all'],
      status: ['all'], // Changé de BuddyMatchStatus.PENDING à 'all' pour afficher toutes les demandes
      dateRange: ['all'], // all, today, week, month
      searchTerm: ['']
    });
  }

  /**
   * Charge les données initiales
   */
  private loadData(): void {
    this.loading = true;
    
    // Charger les clubs
    this.loadClubs();
    
    // Charger les demandes de buddy
    this.loadBuddyRequests();
  }

  /**
   * Charge la liste des clubs
   */
  private loadClubs(): void {
    console.log('🔄 Début chargement des clubs...');
    const clubsSub = this.clubService.getAllClubs().subscribe({
      next: (clubs: any[]) => {
        console.log('✅ Clubs chargés:', clubs);
        console.log('📊 Nombre de clubs:', clubs.length);
        this.clubs = clubs.filter(club => club.status === 'ACTIVE');
        console.log('✅ Clubs actifs filtrés:', this.clubs.length);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des clubs:', error);
        // Continuer même si les clubs ne chargent pas
        this.clubs = [];
      }
    });

    this.subscriptions.add(clubsSub);
  }

  /**
   * Charge les demandes de buddy
   */
  private loadBuddyRequests(): void {
    console.log('🔄 Début chargement des demandes de buddy...');
    const buddySub = this.buddyService.getBuddyPairs().subscribe({
      next: (requests: BuddyPair[]) => {
        console.log('✅ Demandes de buddy reçues:', requests);
        console.log('📊 Nombre de demandes:', requests.length);
        
        // Enrichir les données avec les informations des utilisateurs et clubs
        this.buddyRequests = this.enrichBuddyRequests(requests);
        this.applyFilters();
        this.loading = false;
        console.log('✅ Loading terminé, isLoading =', this.loading);
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
        console.log('🔄 Change detection forcée');
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des demandes de buddy:', error);
        this.error = 'Impossible de charger les demandes de buddy';
        this.loading = false;
        console.log('❌ Loading arrêté en erreur, isLoading =', this.loading);
        
        // Forcer la détection de changement même en erreur
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(buddySub);
  }

  /**
   * Enrichit les demandes de buddy avec les informations supplémentaires
   */
  private enrichBuddyRequests(requests: BuddyPair[]): BuddyRequest[] {
    return requests.map(request => {
      const enriched: BuddyRequest = { ...request };
      
      // Ajouter les noms des clubs
      if (request.club) {
        enriched.clubName = request.club.nom;
      } else {
        // Chercher le club dans la liste chargée
        const club = this.clubs.find(c => c.idClub === request.clubId);
        enriched.clubName = club?.nom || 'Unknown club';
      }
      
      // Simuler les noms des utilisateurs (adapter selon votre API)
      enriched.user1Name = this.getUserName(request.userID_1);
      enriched.user2Name = this.getUserName(request.userID_2);
      enriched.user1Email = this.getUserEmail(request.userID_1);
      enriched.user2Email = this.getUserEmail(request.userID_2);
      enriched.user1Avatar = this.getUserAvatar(request.userID_1);
      enriched.user2Avatar = this.getUserAvatar(request.userID_2);
      
      // Simuler le niveau cible (adapter selon votre modèle de données)
      enriched.niveauCible = this.getNiveauCible(request);
      
      return enriched;
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
   * Simule le niveau cible (adapter selon votre modèle de données)
   */
  private getNiveauCible(request: BuddyPair): string {
    // Simuler différents niveaux cibles
    const niveaux = ['Beginner', 'Intermediate', 'Advanced'];
    return niveaux[request.idPair % niveaux.length];
  }

  /**
   * Configure les listeners pour les filtres
   */
  private setupFilterListeners(): void {
    const filterSub = this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    this.subscriptions.add(filterSub);
  }

  /**
   * Applique les filtres aux demandes
   */
  private applyFilters(): void {
    console.log('🔍 Application des filtres...');
    console.log('📊 Données brutes:', this.buddyRequests.length);
    
    let filtered = [...this.buddyRequests];
    console.log('📊 Données copiées:', filtered.length);
    
    const filters = this.filterForm.value;
    console.log('🎛️ Filtres actuels:', filters);
    
    // Filtrer par club
    if (filters.clubId && filters.clubId !== 'all') {
      filtered = filtered.filter(request => request.clubId === +filters.clubId);
      console.log('🏢 Après filtre club:', filtered.length);
    }
    
    // Filtrer par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
      console.log('📊 Après filtre statut:', filtered.length);
    }
    
    // Filtrer par plage de dates
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(request => 
        request.dateCreation && new Date(request.dateCreation) >= startDate
      );
      console.log('📅 Après filtre date:', filtered.length);
    }
    
    // Filtrer par terme de recherche
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(request => 
        request.user1Name?.toLowerCase().includes(searchTerm) ||
        request.user2Name?.toLowerCase().includes(searchTerm) ||
        request.clubName?.toLowerCase().includes(searchTerm) ||
        request.niveauCible?.toLowerCase().includes(searchTerm)
      );
      console.log('🔍 Après filtre recherche:', filtered.length);
    }
    
    this.filteredRequests = filtered;
    console.log('✅ Résultat final:', filtered.length, 'demandes affichées');
  }

  /**
   * Accepte une demande de buddy
   */
  acceptRequest(requestId: number): void {
    this.processing.add(requestId);
    
    const acceptSub = this.buddyService.acceptBuddyPair(requestId).subscribe({
      next: () => {
        console.log(`✅ Demande ${requestId} acceptée`);
        this.processing.delete(requestId);
        this.updateRequestStatus(requestId, BuddyMatchStatus.ACTIVE);
      },
      error: (error: any) => {
        console.error(`❌ Erreur lors de l'acceptation de la demande ${requestId}:`, error);
        this.processing.delete(requestId);
        this.error = 'Unable to accept this request';
      }
    });

    this.subscriptions.add(acceptSub);
  }

  /**
   * Refuse une demande de buddy
   */
  rejectRequest(requestId: number): void {
    if (confirm('Are you sure you want to reject this buddy request?')) {
      this.processing.add(requestId);
      
      const rejectSub = this.buddyService.rejectBuddyPair(requestId).subscribe({
        next: () => {
          console.log(`❌ Demande ${requestId} refusée`);
          this.processing.delete(requestId);
          this.updateRequestStatus(requestId, BuddyMatchStatus.CANCELLED);
        },
        error: (error: any) => {
          console.error(`❌ Erreur lors du refus de la demande ${requestId}:`, error);
          this.processing.delete(requestId);
          this.error = 'Unable to reject this request';
        }
      });

      this.subscriptions.add(rejectSub);
    }
  }

  /**
   * Met à jour le statut d'une demande localement
   */
  private updateRequestStatus(requestId: number, status: BuddyMatchStatus): void {
    const requestIndex = this.buddyRequests.findIndex(r => r.idPair === requestId);
    if (requestIndex !== -1) {
      this.buddyRequests[requestIndex].status = status;
      this.applyFilters();
    }
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
        return 'Pending';
      case BuddyMatchStatus.ACTIVE:
        return 'Active';
      case BuddyMatchStatus.COMPLETED:
        return 'Completed';
      case BuddyMatchStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Vérifie si une demande peut être traitée
   */
  canProcessRequest(status: BuddyMatchStatus): boolean {
    return status === BuddyMatchStatus.PENDING;
  }

  /**
   * Vérifie si une demande est en cours de traitement
   */
  isProcessing(requestId: number): boolean {
    return this.processing.has(requestId);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.filterForm.reset({
      clubId: 'all',
      status: BuddyMatchStatus.PENDING,
      dateRange: 'all',
      searchTerm: ''
    });
  }

  /**
   * Exporte les données (placeholder pour fonctionnalité future)
   */
  exportData(): void {
    // Implémenter l'export CSV/Excel si nécessaire
    console.log('📊 Export des données:', this.filteredRequests);
  }

  /**
   * Obtient les statistiques
   */
  getStatistics(): { total: number; pending: number; active: number; completed: number; cancelled: number } {
    return {
      total: this.buddyRequests.length,
      pending: this.buddyRequests.filter(r => r.status === BuddyMatchStatus.PENDING).length,
      active: this.buddyRequests.filter(r => r.status === BuddyMatchStatus.ACTIVE).length,
      completed: this.buddyRequests.filter(r => r.status === BuddyMatchStatus.COMPLETED).length,
      cancelled: this.buddyRequests.filter(r => r.status === BuddyMatchStatus.CANCELLED).length
    };
  }

  /**
   * Navigate back to clubs management page
   */
  goBackToClubs(): void {
    this.router.navigate(['/back/clubs']);
  }
}
