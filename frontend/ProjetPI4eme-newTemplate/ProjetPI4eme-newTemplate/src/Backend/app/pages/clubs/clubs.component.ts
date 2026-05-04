import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // ← Ajout de ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { AppEmptyStateComponent } from '../../components/ui/empty-state.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppEmptyStateComponent  // ← Ajout du composant manquant
  ],
  templateUrl: './clubs.component.html',
  styleUrls: ['./clubs.component.scss']
})
export class ClubsComponent implements OnInit {
  clubs: any[] = [];
  filteredClubs: any[] = [];
  searchTerm: string = '';
  isLoading = true;
  errorMessage: string | null = null;

  upcomingEvents = [
    { title: 'Polyglot Circle', time: 'Thursday 6pm' },
    { title: 'Debate Club', time: 'Tuesday 7pm' },
    { title: 'Writing Workshop', time: 'Monday 5pm' }
  ];

  recentActivities = [
    { title: 'Latin Roots', desc: 'Completed lesson 4.2', time: '2h ago' },
    { title: 'Phoneme Master', desc: 'Finished pronunciation drills', time: '5h ago' }
  ];

  constructor(
    private router: Router,
    private clubService: ClubService,
    private cdr: ChangeDetectorRef  // ← Ajout pour forcer la détection de changement
  ) {
    console.log('🔧 ClubsComponent constructor - service existe:', !!this.clubService);
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit appelé');
    this.loadClubs();
  }

  private getDemoClubs(): any[] {
    return [
      {
        idClub: 1001,
        nom: 'English Conversation Circle',
        description: 'Weekly speaking practice focused on fluency, confidence, and real-life communication.',
        niveau: 'INTERMEDIATE',
        capacityMax: 25,
        status: 'ACTIVE'
      },
      {
        idClub: 1002,
        nom: 'Grammar Boost Lab',
        description: 'Hands-on grammar challenges and mini-workshops to improve writing and speaking accuracy.',
        niveau: 'BEGINNER',
        capacityMax: 20,
        status: 'ACTIVE'
      },
      {
        idClub: 1003,
        nom: 'Debate and Critical Thinking',
        description: 'Structured debates around current topics to strengthen vocabulary, argumentation, and listening.',
        niveau: 'ADVANCED',
        capacityMax: 18,
        status: 'ACTIVE'
      }
    ];
  }

  loadClubs(): void {
    console.log('📥 ===== CHARGEMENT DES CLUBS =====');
    console.log('1. isLoading avant:', this.isLoading);
    this.isLoading = true;

    this.clubService.getAllClubs().subscribe({
      next: (data: any) => {
        console.log('2. ✅ Données brutes reçues:', data);
        console.log('3. Type de données:', typeof data);
        console.log('4. Est un tableau?', Array.isArray(data));
        console.log('5. Longueur:', data?.length);

        if (Array.isArray(data)) {
          console.log('6. Contenu du tableau:', data);
          if (data.length > 0) {
            console.log('7. Premier élément:', data[0]);
            this.clubs = data;
          } else {
            console.log('8. ⚠️ Le tableau est vide !');
            this.errorMessage = 'No clubs returned by backend. Demo clubs are displayed for testing.';
            this.clubs = this.getDemoClubs();
          }
          this.applySearchFilter();
        } else {
          console.log('9. ❌ Ce n\'est pas un tableau:', data);
          this.errorMessage = 'Unexpected backend format. Demo clubs are displayed for testing.';
          this.clubs = this.getDemoClubs();
          this.applySearchFilter();
        }

        console.log('10. clubs après assignation:', this.clubs);
        this.isLoading = false;
        console.log('11. isLoading après:', this.isLoading);

        // ✅ Force la mise à jour du template pour éviter le problème du double-clic
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ ERREUR API:', error);
        this.errorMessage = 'Backend unavailable. Demo clubs are displayed for testing.';
        this.clubs = this.getDemoClubs();
        this.applySearchFilter();
        this.isLoading = false;
        this.cdr.detectChanges(); // ← Force aussi en cas d'erreur
      }
    });
  }

  // Méthodes publiques pour le template
  getIconForLevel(niveau: string): string {
    if (!niveau) return '👥';

    switch(niveau.toUpperCase()) {
      case 'BEGINNER': return '🌱';
      case 'INTERMEDIATE': return '📚';
      case 'ADVANCED': return '🎯';
      default: return '👥';
    }
  }

  getLocationForLevel(niveau: string): string {
    if (!niveau) return 'Campus';

    switch(niveau.toUpperCase()) {
      case 'BEGINNER': return 'Salle 101';
      case 'INTERMEDIATE': return 'Salle 202';
      case 'ADVANCED': return 'Amphithéâtre';
      default: return 'Campus';
    }
  }

  getColorForIndex(id: number): 'blue' | 'green' | 'purple' | 'yellow' {
    const colors = ['blue', 'green', 'purple', 'yellow'];
    return colors[(id || 0) % colors.length] as any;
  }

  getColorHex(color: string): string {
    const colors = {
      'blue': '#3B82F6',
      'green': '#10B981',
      'purple': '#8B5CF6',
      'yellow': '#F59E0B'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }

  navigateToCreateClub(): void {
    this.router.navigate(['/admin/clubs/create']);
  }

  deleteClub(clubId: number): void {
    if (confirm('Are you sure you want to delete this club?')) {
      this.clubService.deleteClub(clubId).subscribe({
        next: () => {
          console.log('Club deleted successfully');
          this.loadClubs();
        }
      });
    }
  }
  

  updateClub(clubId: number): void {
    console.log('🔄 Update button clicked for club:', clubId);
    if (!clubId) {
      console.error('❌ No clubId provided for update');
      alert('Error: Cannot update club - ID is missing');
      return;
    }
    this.router.navigate(['/admin/clubs/edit', clubId]);
  }

  viewForum(clubId: number): void {
    if (!clubId) {
      console.error('No clubId provided for forum');
      alert('Error: Cannot access forum - ID is missing');
      return;
    }
    console.log(`? Navigation vers le forum du club ${clubId}`);
    this.router.navigate(['/admin/clubs', clubId, 'forum']);
  }

  trackByClub(index: number, club: any): number {
    return club.idClub?.toString() || index;
  }

  // Méthode pour debugguer la navigation
  logNavigation(route: string): void {
    console.log(`🔄 Clic sur bouton admin → route cible: ${route}`);
  }

  retryLoading(): void {
    console.log('🔄 Nouvelle tentative de chargement');
    this.loadClubs();
  }

  /**
   * Filtre les clubs en fonction du terme de recherche
   */
  applySearchFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredClubs = [...this.clubs];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredClubs = this.clubs.filter(club => 
        (club.nom && club.nom.toLowerCase().includes(term)) ||
        (club.description && club.description.toLowerCase().includes(term)) ||
        (club.niveau && club.niveau.toLowerCase().includes(term))
      );
    }
  }

  /**
   * Appelé lors du changement dans le champ de recherche
   */
  onSearchChange(): void {
    this.applySearchFilter();
  }
}
