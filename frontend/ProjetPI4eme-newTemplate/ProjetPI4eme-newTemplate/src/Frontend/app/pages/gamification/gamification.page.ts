import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { GamesService, Game } from '../../core/games/games.service';
import { DataService } from '../../core/data/data.service';
import { GamificationService } from '../../core/gamification/gamification.service';
import { AchievementModel } from '../../core/gamification/models';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AvatarSelectorComponent } from '../../shared/avatar-selector/avatar-selector.component';
import { AvatarsService, AvatarDto } from '../../core/avatars/avatars.service';
import { BadgesApiService, ApiBadge } from '../../core/gamification/badges-api.service';
import { StatsTrackerService } from '../../core/gamification/stats-tracker.service';
import { LeaderboardService } from '../../core/gamification/leaderboard.service';

/**
 * Main gamification page component displaying dashboard, courses, challenges, and leaderboard
 */
@Component({
  selector: 'app-gamification-page',
  imports: [RouterLink, ModalComponent, CommonModule, AvatarSelectorComponent],
  templateUrl: './gamification.page.html',
  styleUrl: './gamification.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamificationPage {
  // Injected services
  private readonly data = inject(DataService);
  readonly gami = inject(GamificationService);
  private readonly gamesService = inject(GamesService);
  private readonly avatarsService = inject(AvatarsService);
  private readonly badgesApiService = inject(BadgesApiService);
  private readonly router = inject(Router);
  readonly statsTracker = inject(StatsTrackerService);
  readonly lb = inject(LeaderboardService);
  private readonly auth = inject(AuthService);

  /** Current user ID for highlighting the leaderboard row */
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? '');

  // Math reference for template
  readonly Math = Math;

  // Games list loaded from API
  readonly gamesList = signal<Game[]>([]);

  // Backend API badges
  readonly apiBadges = signal<ApiBadge[]>([]);

  // UI state management
  readonly tab = signal<'dashboard' | 'ai-practice' | 'statistics'>('dashboard');
  readonly mobileMenuOpen = signal(false);

  // Modal state
  readonly selectedAchievementId = signal<string | null>(null);

  // Notification state
  readonly toasts = signal<Array<{ id: string; title: string; body: string }>>([]);
  readonly confetti = signal(false);

  // Profile and avatar state
  readonly displayName = signal<string>(this.readDisplayName());
  readonly avatars = signal<AvatarDto[]>([]);
  readonly selectedAvatarId = signal<number | null>(this.loadSelectedAvatar());
  readonly avatarModalOpen = signal(false);
  
  readonly selectedAvatarImage = computed(() => {
    const id = this.selectedAvatarId();
    const list = this.avatars();
    const found = list.find((a) => a.id === id);
    return (found && found.imageUrl) || '/logojungle.png';
  });

  // Error handling
  readonly errorMessage = signal<string | null>(null);

  // Gamification data
  readonly badges = this.gami.badges;
  readonly achievements = computed<AchievementModel[]>(() => this.gami.getAchievements());
  readonly trainings = this.data.trainings;

  constructor() {
    // Load games data on initialization
    this.loadGames();

    // Load avatars for profile display
    this.loadAvatars();

    // Load badges from API
    this.loadApiBadges();

    // Sync leaderboard on page load
    this.lb.refresh();
    this.lb.sync();
  }

  /**
   * Loads games from the backend service
   */
  private loadGames(): void {
    this.gamesService.getAll().subscribe({
      next: (list) => {
        console.log('Games loaded:', list.length);
        this.gamesList.set(list || []);
      },
      error: (error) => {
        console.error('Failed to load games:', error);
        this.errorMessage.set('Failed to load games from server');
      }
    });
  }

  /**
   * Loads avatars for the user profile
   */
  private loadAvatars(): void {
    this.avatarsService.getAvatars().subscribe({
      next: (avatarList) => {
        this.avatars.set(avatarList || []);
      },
      error: (error) => {
        console.error('Failed to load avatars:', error);
      }
    });
  }

  /**
   * Loads badges from the backend API
   */
  private loadApiBadges(): void {
    this.badgesApiService.getAll().subscribe({
      next: (list) => this.apiBadges.set(list || []),
      error: (err) => console.error('Failed to load API badges:', err)
    });
  }

  /**
   * Returns a color based on badge unlock level
   */
  badgeLevelColor(level: number): string {
    if (level <= 3) return '#27ae60';
    if (level <= 6) return '#f59e0b';
    if (level <= 10) return '#ef4444';
    return '#8b5cf6';
  }

  /**
   * Navigates to the game playing interface
   * @param game - The game to play
   */
  playGame(game: Game): void {
    if (game.category === 'Crossword') {
      void this.router.navigate(['/front/games/crossword'], {
        queryParams: {
          timerDuration: game.timerDuration || 0,
          xpReward: game.xpReward || 0,
          gameTitle: game.title
        }
      });
    } else {
      console.log('Playing game:', game.title);
    }
  }

  /** Full stats snapshot for the leaderboard/stats tab */
  readonly stats = this.statsTracker.stats;

  /**
   * Gets the currently selected achievement
   */
  readonly selectedAchievement = computed<AchievementModel | null>(() => {
    const id = this.selectedAchievementId();
    if (!id) return null;
    return this.achievements().find((a) => a.id === id) ?? null;
  });

  /**
   * Sets the active tab
   * @param tab - The tab to activate
   */
  setTab(tab: 'dashboard' | 'ai-practice' | 'statistics'): void {
    this.tab.set(tab);
    this.mobileMenuOpen.set(false);
    if (tab === 'statistics') {
      this.lb.refresh();
      this.lb.sync();
    }
  }

  /**
   * Toggles the mobile menu visibility
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  /**
   * Opens an achievement modal
   * @param achievementId - The ID of the achievement to open
   */
  openAchievement(achievementId: string): void {
    this.selectedAchievementId.set(achievementId);
  }

  /**
   * Closes the achievement modal
   */
  closeAchievement(): void {
    this.selectedAchievementId.set(null);
  }

  /**
   * TrackBy function for ngFor optimization
   * @param _ - Index (unused)
   * @param item - Item with id property
   * @returns Unique identifier for the item
   */
  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  /**
   * Shows a toast notification
   * @param title - Toast title
   * @param body - Toast body text
   */
  private toast(title: string, body: string): void {
    const id = this.makeId();
    this.toasts.update((all) => [{ id, title, body }, ...all].slice(0, 4));
    
    // Auto-remove toast after 2.8 seconds
    window.setTimeout(() => {
      this.toasts.update((all) => all.filter((t) => t.id !== id));
    }, 2800);
  }

  /**
   * Triggers confetti animation
   */
  private burstConfetti(): void {
    this.confetti.set(true);
    window.setTimeout(() => this.confetti.set(false), 900);
  }

  /**
   * Plays a sound effect using Web Audio API
   * @param kind - Type of sound effect to play
   */
  private playSound(kind: 'level' | 'badge' | 'complete'): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const now = ctx.currentTime;
      const freq = kind === 'level' ? 660 : kind === 'badge' ? 880 : 520;
      
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      
      oscillator.onended = () => {
        void ctx.close();
      };
    } catch (error) {
      // Silently ignore audio errors (e.g., browser doesn't support Web Audio API)
      console.debug('Unable to play sound:', error);
    }
  }

  /**
   * Generates a unique ID
   * @returns Unique identifier string
   */
  private makeId(): string {
    try {
      const crypto = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
      if (crypto?.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (error) {
      console.debug('crypto.randomUUID not available:', error);
    }
    
    // Fallback to timestamp + random
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Reads display name from localStorage
   * @returns User's display name or 'Player' as default
   */
  private readDisplayName(): string {
    try {
      const raw = localStorage.getItem('jie-display-name-v1');
      return raw && raw.trim().length > 0 ? raw.trim() : 'Player';
    } catch {
      return 'Player';
    }
  }

  /**
   * Opens the avatar selection modal
   */
  openAvatarModal(): void {
    console.log('Opening avatar modal');
    this.avatarModalOpen.set(true);
  }

  /**
   * Closes the avatar selection modal
   */
  closeAvatarModal(): void {
    console.log('Closing avatar modal');
    this.avatarModalOpen.set(false);
    // Refresh selection after user picks a new avatar
    this.syncSelectedAvatar();
    this.loadAvatars();
  }

  /**
   * Loads the selected avatar ID from localStorage
   * @returns Selected avatar ID or null
   */
  private loadSelectedAvatar(): number | null {
    try {
      const value = localStorage.getItem('selectedAvatarId');
      if (value) {
        return Number(value);
      }
    } catch (error) {
      console.debug('Failed to load selected avatar:', error);
    }
    return null;
  }

  private syncSelectedAvatar(): void {
    this.selectedAvatarId.set(this.loadSelectedAvatar());
  }
}

