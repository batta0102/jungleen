import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClubService } from '../../services/club';
import { MembershipService, ClubMembership } from '../../services/membership';
import { AuthSimpleService } from '../../services/auth-simple.service';
import { UserService } from '../../services/user.service';
import { MembershipSyncService } from '../../services/membership-sync.service';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './club-detail.component.html',
  styleUrls: ['./club-detail.component.scss']
})
export class ClubDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clubService = inject(ClubService);
  private membershipService = inject(MembershipService);
  private authSimpleService = inject(AuthSimpleService);  // Seule source d'authentification
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(MembershipSyncService);

  club: any = null;
  membershipStatus: string | null = null;
  isAuthenticated = false;
  currentUserId: number | null = null;
  isLoading = true;
  isJoining = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    console.log('1. ngOnInit appelé');

    // Vérifier d'abord le statut d'authentification
    this.checkAuthStatus();

    const clubId = this.route.snapshot.paramMap.get('id');
    console.log('2. ID du club:', clubId);

    if (clubId) {
      console.log('3. Chargement du club avec ID:', clubId);
      this.loadClubDetails(parseInt(clubId));
    } else {
      console.log('4. Pas d\'ID, redirection');
      this.router.navigate(['/clubs']);
    }

    // Écouter les mises à jour de statut depuis l'admin
    this.syncService.getMembershipUpdates().subscribe((update: any) => {
      if (update && this.club) {
        console.log(`🔄 Mise à jour reçue dans le front: Membership ${update.id} -> ${update.status}`);
        
        const currentUserId = this.authSimpleService.getCurrentUserId();
        if (currentUserId) {
          // Simplement revérifier le statut pour cet utilisateur et ce club
          console.log('🔄 Re-vérification du statut pour utilisateur:', currentUserId, 'club:', this.club.idClub);
          this.checkMembershipStatus();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkAuthStatus();
    }, 1000);
  }

  checkAuthStatus(): void {
    console.log('🔍 Vérification du statut d\'authentification...');
    
    if (this.authSimpleService.isAuthenticated()) {
      console.log('✅ Utilisateur déjà authentifié');
      this.isAuthenticated = true;
      this.currentUserId = this.authSimpleService.getCurrentUserId();
      
      const currentUser = this.authSimpleService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Utilisateur connecté:', currentUser);
      }
    } else {
      console.log('❌ Utilisateur non authentifié');
      this.membershipStatus = null;
      this.isAuthenticated = false;
      this.currentUserId = null;
    }
  }

  loadClubDetails(id: number): void {
    console.log('5. loadClubDetails appelé avec id:', id);
    this.isLoading = true;

    this.clubService.getClubById(id).subscribe({
      next: (data: any) => {
        console.log('6. Données reçues du backend:', data);
        this.club = data;
        this.isLoading = false;
        console.log('7. Club assigné:', this.club);
        
        // Vérifier le statut d'adhésion de l'utilisateur courant
        this.checkMembershipStatus();
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('11. ERREUR:', error);
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger les détails du club';
        this.cdr.detectChanges();
      }
    });
  }

  checkMembershipStatus(): void {
    const currentUserId = this.authSimpleService.getCurrentUserId();
    if (!currentUserId || !this.club) {
      console.log('🔍 Pas d\'utilisateur ou de club, pas de vérification d\'adhésion');
      return;
    }

    console.log('🔍 Vérification du statut d\'adhésion pour utilisateur:', currentUserId, 'club:', this.club.idClub);
    
    // Appeler l'API pour récupérer les adhésions de cet utilisateur pour ce club
    this.membershipService.getMembershipsByClub(this.club.idClub).subscribe({
      next: (memberships: ClubMembership[]) => {
        console.log('📋 Adhésions trouvées pour ce club:', memberships);
        
        // Chercher l'adhésion de l'utilisateur courant
        const userMembership = memberships.find(m => m.userId === currentUserId);
        
        if (userMembership) {
          console.log('✅ Adhésion trouvée pour l\'utilisateur:', userMembership);
          this.membershipStatus = userMembership.status;
        } else {
          console.log('ℹ️ Aucune adhésion trouvée pour cet utilisateur');
          this.membershipStatus = null;
        }
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur vérification adhésion:', error);
        this.membershipStatus = null;
        this.cdr.detectChanges();
      }
    });
  }

  joinClub(): void {
    console.log('🚀 joinClub appelé');
    
    // Vérifier si l'utilisateur est authentifié avec authSimpleService
    if (!this.authSimpleService.isAuthenticated()) {
      console.log('❌ Utilisateur non authentifié, redirection vers login');
      const returnUrl = this.router.url;
      this.router.navigate(['/front/user-selection'], { 
        queryParams: { returnUrl } 
      });
      return;
    }

    // Récupérer le vrai userId de l'utilisateur connecté
    const userId = this.authSimpleService.getCurrentUserId();
    const currentUser = this.authSimpleService.getCurrentUser();
    
    if (!currentUser || !userId) {
      console.log('❌ Impossible de récupérer l\'utilisateur connecté');
      this.errorMessage = 'Erreur: utilisateur non disponible';
      return;
    }
    
    console.log('✅ Utilisateur authentifié:', currentUser);
    console.log('✅ ID utilisateur:', userId);

    if (!this.club) {
      console.log('❌ Données manquantes - club:', !!this.club);
      this.errorMessage = 'Données manquantes pour rejoindre le club';
      return;
    }
    
    console.log('✅ Début de la demande d\'adhésion pour le club:', this.club.idClub, 'utilisateur:', userId);

    this.isJoining = true;
    this.errorMessage = null;

    // Créer la demande d'adhésion avec le vrai userId
    const membership: ClubMembership = {
      userId: userId,
      dateInscription: new Date(),
      status: 'EN_ATTENTE',
      club: {
        idClub: this.club.idClub
      }
    };

    // Convertir pour le backend Spring Boot qui attend clubId au lieu de club.idClub
    const payload = {
      userId: membership.userId,
      dateInscription: membership.dateInscription,
      status: membership.status,
      clubId: membership.club?.idClub || this.club.idClub
    };

    console.log('📤 Envoi de la demande:', payload);

    this.membershipService.createMembership(membership).subscribe({
      next: (response: any) => {
        console.log('✅ Demande d\'adhésion envoyée avec succès:', response);
        this.membershipStatus = 'EN_ATTENTE';
        this.isJoining = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.errorMessage = null;
        }, 3000);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la demande d\'adhésion:', error);
        this.errorMessage = 'Erreur lors de la demande d\'adhésion: ' + (error.error?.message || error.message || 'Erreur serveur');
        this.isJoining = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clubs']);
  }

  goToLogin(): void {
    console.log('🔐 Redirection vers sélection utilisateur');
    this.router.navigate(['/front/user-selection']);
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'Demande en attente';
      case 'VALIDEE': return 'Membre actif';
      case 'REFUSEE': return 'Demande refusée';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'VALIDEE': return 'status-approved';
      case 'REFUSEE': return 'status-rejected';
      default: return '';
    }
  }

  protected debugForceData() {
    this.club = {
      nom: "CLUB DE TEST",
      description: "Ceci est un test",
      niveau: "Débutant",
      capacityMax: 20,
      status: "Actif",
      clubOwner: 1
    };
    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('Debug: Données de test forcées');
  }
}