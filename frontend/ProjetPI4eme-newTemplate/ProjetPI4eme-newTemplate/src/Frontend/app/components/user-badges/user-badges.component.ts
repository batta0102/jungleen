import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ForumAdvancedService, UserBadge } from '../../services/forum-advanced.service';

@Component({
  selector: 'app-user-badges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-badges.component.html',
  styleUrls: ['./user-badges.component.scss']
})
export class UserBadgesComponent implements OnInit {
  badges: UserBadge[] = [];
  loading = true;
  
  // Propriétés calculées pour le template
  unlockedBadges: UserBadge[] = [];
  lockedBadges: UserBadge[] = [];
  
  private subscriptions = new Subscription();

  constructor(
    private forumAdvancedService: ForumAdvancedService
  ) {}

  ngOnInit(): void {
    this.loadBadges();
  }

  /**
   * Charge les badges de l'utilisateur
   */
  private loadBadges(): void {
    const badgesSub = this.forumAdvancedService.getUserBadges().subscribe({
      next: (badges: UserBadge[]) => {
        this.badges = badges;
        this.unlockedBadges = badges.filter(b => b.unlocked);
        this.lockedBadges = badges.filter(b => !b.unlocked);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des badges:', error);
        this.loading = false;
      }
    });

    this.subscriptions.add(badgesSub);
  }

  /**
   * Retourne la couleur selon le type de badge
   */
  getBadgeColor(type: string): string {
    switch (type) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      case 'diamond': return '#b9f2ff';
      default: return '#64748b';
    }
  }

  /**
   * Retourne la classe CSS selon le type de badge
   */
  getBadgeClass(type: string): string {
    return `badge-${type}`;
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByBadgeId(index: number, badge: UserBadge): number {
    return badge.id;
  }
}
