import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClubService } from '../../services/club';
import { MembershipService, ClubMembership } from '../../services/membership';
import { AuthSimpleService } from '../../services/auth-simple.service';
import { UserService } from '../../services/user.service';
import { MembershipSyncService } from '../../services/membership-sync.service';
import { BuddyService } from '../../services/buddy.service';
import { BuddyPair, BuddyMatchStatus } from '../../models/buddy.models';
import { ClubForumComponent } from '../club-forum/club-forum.component';

@Component({
  selector: 'app-club-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, ClubForumComponent, RouterLink],
  templateUrl: './club-detail-simple.component.html',
  styleUrls: ['./club-detail.component.scss']
})
export class ClubDetailSimpleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clubService = inject(ClubService);
  private membershipService = inject(MembershipService);
  private authSimpleService = inject(AuthSimpleService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(MembershipSyncService);
  private buddyService = inject(BuddyService);

  club: any = null;
  membershipStatus: string | null = null;
  isLoading = true;
  isJoining = false;
  errorMessage: string | null = null;
  
  // Onglets
  activeTab: 'details' | 'buddies' | 'forum' = 'details';
  
  // Données des buddies
  clubBuddies: BuddyPair[] = [];
  isLoadingBuddies = false;
  currentUser: any = null;

  ngOnInit(): void {
    console.log('1. ngOnInit appelé');

    // Récupérer l'utilisateur courant
    this.currentUser = this.userService.getCurrentUser();

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
    this.syncService.getMembershipUpdates().subscribe(update => {
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

  loadClubDetails(id: number): void {
    console.log('5. loadClubDetails appelé avec id:', id);
    this.isLoading = true;

    this.clubService.getClubById(id).subscribe({
      next: (data: any) => {
        console.log('6. Données reçues du backend:', data);
        this.club = data;
        this.isLoading = false;
        console.log('7. Club assigné:', this.club);
        
        // Stocker les données du club dans le localStorage pour le forum
        try {
          const clubDataKey = `club_${data.idClub}`;
          localStorage.setItem(clubDataKey, JSON.stringify(data));
          console.log('💾 Données du club stockées pour le forum:', clubDataKey);
        } catch (error) {
          console.error('❌ Erreur stockage données club:', error);
        }
        
        // Vérifier le statut d'adhésion de l'utilisateur courant
        this.checkMembershipStatus();
        
        // Charger les buddies du club
        this.loadClubBuddies();
        
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
        console.log('📋 Type des données:', typeof memberships);
        console.log('📋 Longueur:', memberships?.length);
        
        if (!Array.isArray(memberships)) {
          console.warn('⚠️ Les données reçues ne sont pas un tableau:', memberships);
          this.membershipStatus = null;
          this.cdr.detectChanges();
          return;
        }
        
        // Chercher l'adhésion de l'utilisateur courant
        const userMembership = memberships.find(m => m.userId === currentUserId);
        
        if (userMembership) {
          console.log('✅ Adhésion trouvée pour l\'utilisateur:', userMembership);
          console.log('✅ Statut actuel:', userMembership.status);
          this.membershipStatus = userMembership.status;
          
          // Afficher un message si le statut a changé
          if (userMembership.status === 'VALIDEE') {
            console.log('🎉 Félicitations ! Vous êtes maintenant membre de ce club.');
          } else if (userMembership.status === 'REFUSEE') {
            console.log('😔 Votre demande d\'adhésion a été refusée.');
          }
        } else {
          console.log('ℹ️ Aucune adhésion trouvée pour cet utilisateur');
          this.membershipStatus = null;
        }
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur vérification adhésion:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        this.membershipStatus = null;
        this.cdr.detectChanges();
      }
    });
  }

  joinClub(): void {
    console.log('🚀 joinClub appelé');
    
    // Vérifier si l'utilisateur est authentifié
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

    if (!this.club || !userId) {
      console.log('❌ Données manquantes - club:', !!this.club, 'userId:', userId);
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
        
        setTimeout(() => {
          this.errorMessage = null;
        }, 3000);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la demande d\'adhésion:', error);
        this.errorMessage = 'Erreur lors de la demande d\'adhésion: ' + (error.message || 'Erreur inconnue');
        this.isJoining = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clubs']);
  }

  // Méthodes utilitaires
  getStatusText(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'Pending';
      case 'VALIDEE': return 'Approved';
      case 'REFUSEE': return 'Rejected';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'bg-[#F6BD60]/20 text-[#3D3D60] border border-[#F6BD60]/40';
      case 'VALIDEE': return 'bg-[#2D5757]/10 text-[#2D5757] border border-[#2D5757]/20';
      case 'REFUSEE': return 'bg-[#C84630]/10 text-[#C84630] border border-[#C84630]/20';
      default: return 'bg-[#F7EDE2] text-[#3D3D60]';
    }
  }

  // Gestion des onglets
  switchTab(tab: 'details' | 'buddies' | 'forum'): void {
    // Vérifier si l'utilisateur tente d'accéder à l'onglet Forum
    if (tab === 'forum' && !this.isClubMember()) {
      console.log('🚫 Accès au forum refusé: utilisateur non membre du club');
      return; // Ne pas changer d'onglet si non membre
    }
    
    this.activeTab = tab;
    console.log(`🔄 Changement d'onglet vers: ${tab}`);
  }

  // Charger les buddies du club
  loadClubBuddies(): void {
    if (!this.club) return;
    
    this.isLoadingBuddies = true;
    console.log(`🔍 Chargement des buddies du club ${this.club.idClub}`);
    
    this.buddyService.getBuddyPairsByClub(this.club.idClub).subscribe({
      next: (buddies: BuddyPair[]) => {
        console.log('✅ Buddies du club reçus:', buddies);
        // Filtrer uniquement les buddies actifs
        this.clubBuddies = buddies.filter(buddy => buddy.status === BuddyMatchStatus.ACTIVE);
        this.isLoadingBuddies = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des buddies:', error);
        this.clubBuddies = [];
        this.isLoadingBuddies = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Navigation methods
  goToHome(): void {
    this.router.navigate(['/front']);
  }

  goToBuddy(): void {
    this.router.navigate(['/buddies']);
  }

  goToEvent(): void {
    this.router.navigate(['/front/events']);
  }

  goToForum(): void {
    if (this.club?.idClub) {
      this.router.navigate(['/clubs', this.club.idClub, 'forum']);
    }
  }

  // Vérifier si l'utilisateur est membre du club
  isClubMember(): boolean {
    return this.membershipStatus === 'VALIDEE';
  }

  // Navigation vers la demande de buddy
  goToBuddyRequest(): void {
    const clubId = this.club?.idClub;
    if (clubId) {
      this.router.navigate(['/buddies/request'], { queryParams: { clubId } });
    } else {
      this.router.navigate(['/buddies/request']);
    }
  }

  // Navigation vers les buddies de l'utilisateur
  goToMyBuddies(): void {
    this.router.navigate(['/buddies']);
  }

  // Obtenir le nom d'un utilisateur (mock data)
  getUserName(userId: number): string {
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

  // Obtenir l'avatar d'un utilisateur (mock data)
  getUserAvatar(userId: number): string {
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

  // Obtenir le partenaire d'un buddy
  getPartnerName(buddy: BuddyPair): string {
    if (!this.currentUser) return 'Inconnu';
    
    if (buddy.userID_1 === this.currentUser.id) {
      return this.getUserName(buddy.userID_2);
    } else if (buddy.userID_2 === this.currentUser.id) {
      return this.getUserName(buddy.userID_1);
    }
    
    return 'Inconnu';
  }

  // Obtenir l'avatar du partenaire
  getPartnerAvatar(buddy: BuddyPair): string {
    if (!this.currentUser) return '👤';
    
    if (buddy.userID_1 === this.currentUser.id) {
      return this.getUserAvatar(buddy.userID_2);
    } else if (buddy.userID_2 === this.currentUser.id) {
      return this.getUserAvatar(buddy.userID_1);
    }
    
    return '👤';
  }

  // Vérifier si l'utilisateur fait partie de ce buddy
  isUserInBuddy(buddy: BuddyPair): boolean {
    if (!this.currentUser) return false;
    return buddy.userID_1 === this.currentUser.id || buddy.userID_2 === this.currentUser.id;
  }
}
