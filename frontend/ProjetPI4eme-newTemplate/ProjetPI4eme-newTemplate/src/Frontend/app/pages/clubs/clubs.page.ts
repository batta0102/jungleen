import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ClubService } from '../../services/club';
import { MembershipService } from '../../services/membership';
import { AuthSimpleService } from '../../services/auth-simple.service';

@Component({
  selector: 'app-clubs-page',
  imports: [RouterLink, RouterModule, NgOptimizedImage],
  templateUrl: './clubs.page.html',
  styleUrl: './clubs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClubsPage implements OnInit {
  private readonly clubService = inject(ClubService);
  private readonly membershipService = inject(MembershipService);
  private readonly authService = inject(AuthSimpleService);

  clubs = signal<any[]>([]);
  userMemberships = signal<any[]>([]); // Memberships de l'utilisateur connecté

  readonly page = signal(1);
  readonly pageSize = 4;

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sortedClubs().length / this.pageSize)));

  // Clubs triés: membres d'abord, puis non-membres
  readonly sortedClubs = computed(() => {
    const clubs = this.clubs();
    const memberships = this.userMemberships();
    const memberClubIds = new Set(memberships.filter(m => m.status === 'VALIDEE').map(m => m.club?.idClub || m.clubId));
    
    return [...clubs].sort((a, b) => {
      const aIsMember = memberClubIds.has(a.idClub);
      const bIsMember = memberClubIds.has(b.idClub);
      if (aIsMember && !bIsMember) return -1;
      if (!aIsMember && bIsMember) return 1;
      return 0;
    });
  });

  readonly sortedPagedClubs = computed(() => {
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.sortedClubs().slice(start, start + this.pageSize);
  });

  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  ngOnInit(): void {
    console.log('🚀 ClubsPage initialisée');
    this.loadClubs();
    this.loadUserMemberships();
  }

  loadUserMemberships(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;
    
    this.membershipService.getMembershipsByUser(userId).subscribe({
      next: (memberships: any[]) => {
        console.log('📋 Memberships chargés:', memberships);
        this.userMemberships.set(memberships);
      },
      error: (error) => {
        console.error('Erreur chargement memberships:', error);
      }
    });
  }

  isClubMember(clubId: number): boolean {
    return this.userMemberships().some(m => 
      (m.club?.idClub === clubId || m.clubId === clubId) && m.status === 'VALIDEE'
    );
  }

  isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin';
  }

  loadClubs(): void {
    this.clubService.getAllClubs().subscribe({
      next: (data: any) => {
        console.log('Clubs reçus:', data);
        this.clubs.set(data); // Mettre à jour le signal avec les données
      },
      error: (error) => {
        console.error('Erreur:', error);
      }
    });
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  trackClubId(index: number, club: any): string {
    return club.idClub?.toString() || index.toString();
  }

  clubImageSrc(club: any): string {
    const images = ['/englishimg2.png', '/jungleabout.png', '/contactusjungle.png', '/englishimg1.jpg'];
    const seed = club.idClub?.toString()?.split('')?.reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0) || 0;
    return images[seed % images.length];
  }

  getRemainingPlaces(club: any): number {
    const membersCount = club.membersCount || club.members?.length || 0;
    return Math.max(0, club.capacityMax - membersCount);
  }
}
