import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AvatarsComponent } from '../avatars/avatars.component';
import { SkinsComponent } from '../skins/skins.component';
// BadgesComponent kept for route only – badges rendered inline in this page
import { GameService, Game } from './games.service';
import { BadgesService, Badge } from '../badges/badges.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

/**
 * Component for managing games in the backend admin panel
 */
@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarsComponent, SkinsComponent, PaginationComponent],
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamesComponent implements OnInit {
  readonly games = signal<Game[]>([]);
  readonly newGame = signal<Game>({ title: '', description: '', category: '', xpReward: 0, timerDuration: 0 });
  readonly editGame = signal<Game | null>(null);
  readonly showPopup = signal(false);
  readonly loading = signal(false);
  readonly activeTab = signal<'games' | 'avatars' | 'skins' | 'badges'>('games');

  // Badge signals
  readonly badgesList = signal<Badge[]>([]);
  readonly newBadge = signal<Badge>({ name: '', description: '', unlockLevel: 1 });
  readonly editBadgeData = signal<Badge | null>(null);
  readonly showBadgePopup = signal(false);
  readonly badgePreviewUrl = signal<string | null>(null);
  readonly editBadgePreviewUrl = signal<string | null>(null);

  badgeSelectedFile: File | null = null;
  editBadgeSelectedFile: File | null = null;

  readonly crosswordCount = computed(() => this.games().filter(g => g.category === 'Crossword').length);
  readonly totalXpReward = computed(() => this.games().reduce((sum, g) => sum + (g.xpReward || 0), 0));
  readonly badgeCount = computed(() => this.badgesList().length);

  // Badge tier counts (arrow functions not allowed in templates)
  readonly easyBadgeCount = computed(() => this.badgesList().filter(b => b.unlockLevel <= 3).length);
  readonly midBadgeCount = computed(() => this.badgesList().filter(b => b.unlockLevel > 3 && b.unlockLevel <= 6).length);
  readonly hardBadgeCount = computed(() => this.badgesList().filter(b => b.unlockLevel > 6).length);
  readonly hardMidBadgeCount = computed(() => this.badgesList().filter(b => b.unlockLevel > 6 && b.unlockLevel <= 10).length);
  readonly hardHighBadgeCount = computed(() => this.badgesList().filter(b => b.unlockLevel > 10).length);

  // Pagination for games
  readonly gamesPage = signal(1);
  readonly gamesPageSize = 10;
  readonly gamesPageCount = computed(() => Math.max(1, Math.ceil(this.games().length / this.gamesPageSize)));
  readonly pagedGames = computed(() => {
    const start = (this.gamesPage() - 1) * this.gamesPageSize;
    return this.games().slice(start, start + this.gamesPageSize);
  });

  setGamesPage(p: number): void {
    if (p >= 1 && p <= this.gamesPageCount()) {
      this.gamesPage.set(p);
    }
  }

  // Pagination for badges
  readonly badgesPage = signal(1);
  readonly badgesPageSize = 10;
  readonly badgesPageCount = computed(() => Math.max(1, Math.ceil(this.badgesList().length / this.badgesPageSize)));
  readonly pagedBadges = computed(() => {
    const start = (this.badgesPage() - 1) * this.badgesPageSize;
    return this.badgesList().slice(start, start + this.badgesPageSize);
  });

  setBadgesPage(p: number): void {
    if (p >= 1 && p <= this.badgesPageCount()) {
      this.badgesPage.set(p);
    }
  }

  constructor(private gameService: GameService, private router: Router, private badgesService: BadgesService) {}

  ngOnInit(): void {
    this.loadGames();
    this.loadBadges();
  }

  /**
   * Loads all games from the backend service
   */
  loadGames(): void {
    this.loading.set(true);
    this.gameService.getAll().subscribe({
      next: (data: Game[]) => {
        this.games.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading games:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Deletes a game from the database
   * @param id - The game ID to delete
   */
  deleteGame(id: number): void {
    if (!id) return;
    this.gameService.delete(id).subscribe({
      next: () => this.loadGames(),
      error: (err) => console.error('Failed to delete game:', err)
    });
  }

  /**
   * Starts editing a game
   * @param game - The game to edit
   */
  startEdit(game: Game): void {
    this.editGame.set({ ...game });
  }

  /**
   * Updates an existing game with edited data
   */
  updateGame(): void {
    const game = this.editGame();
    if (!game || !game.id) return;
    this.gameService.update(game.id, game).subscribe({
      next: () => {
        this.editGame.set(null);
        this.loadGames();
      },
      error: (err) => console.error('Failed to update game:', err)
    });
  }

  openPopup(): void { this.showPopup.set(true); }
  closePopup(): void { this.showPopup.set(false); }
  setTab(tab: 'games' | 'avatars' | 'skins' | 'badges'): void { this.activeTab.set(tab); }

  // ── Badge CRUD ──
  loadBadges(): void {
    this.badgesService.getAll().subscribe({
      next: (data) => this.badgesList.set(data || []),
      error: (err) => console.error('Error loading badges:', err)
    });
  }

  openBadgePopup(): void {
    this.newBadge.set({ name: '', description: '', unlockLevel: 1 });
    this.badgeSelectedFile = null;
    this.badgePreviewUrl.set(null);
    this.showBadgePopup.set(true);
  }

  closeBadgePopup(): void {
    this.showBadgePopup.set(false);
    this.badgeSelectedFile = null;
    this.badgePreviewUrl.set(null);
  }

  onBadgeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.badgeSelectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.badgePreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(this.badgeSelectedFile);
    }
  }

  onEditBadgeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editBadgeSelectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.editBadgePreviewUrl.set(e.target?.result as string);
      reader.readAsDataURL(this.editBadgeSelectedFile);
    }
  }

  createBadge(): void {
    const b = this.newBadge();
    if (!b.name) {
      alert('Please enter a badge name.');
      return;
    }
    if (!this.badgeSelectedFile) {
      alert('Please select an image for the badge.');
      return;
    }
    this.badgesService.create(b, this.badgeSelectedFile).subscribe({
      next: () => { this.loadBadges(); this.closeBadgePopup(); },
      error: (err) => console.error('Failed to create badge:', err)
    });
  }

  startEditBadge(badge: Badge): void {
    this.editBadgeData.set({ ...badge });
    this.editBadgeSelectedFile = null;
    this.editBadgePreviewUrl.set(null);
  }

  updateBadge(): void {
    const b = this.editBadgeData();
    if (!b || !b.id) return;
    this.badgesService.update(b.id, b, this.editBadgeSelectedFile).subscribe({
      next: () => {
        this.editBadgeData.set(null);
        this.editBadgeSelectedFile = null;
        this.editBadgePreviewUrl.set(null);
        this.loadBadges();
      },
      error: (err) => console.error('Failed to update badge:', err)
    });
  }

  deleteBadge(id: number): void {
    if (!id) return;
    this.badgesService.delete(id).subscribe({
      next: () => this.loadBadges(),
      error: (err) => console.error('Failed to delete badge:', err)
    });
  }

  updateNewBadge(field: keyof Badge, value: any): void {
    this.newBadge.update(b => ({ ...b, [field]: value }));
  }

  updateEditBadgeField(field: keyof Badge, value: any): void {
    this.editBadgeData.update(b => b ? { ...b, [field]: value } : b);
  }

  levelColor(level: number): string {
    if (level <= 3) return '#27ae60';
    if (level <= 6) return '#f59e0b';
    if (level <= 10) return '#ef4444';
    return '#8b5cf6';
  }

  /**
   * Creates a new game in the database
   */
  createGame(): void {
    const game = this.newGame();
    if (!game.title || !game.category) return;
    this.gameService.create(game).subscribe({
      next: () => {
        const isCrossword = game.category === 'Crossword';
        this.newGame.set({ title: '', description: '', category: '', xpReward: 0, timerDuration: 0 });
        this.loadGames();
        this.closePopup();
        if (isCrossword) {
          this.router.navigate(['/crosswords']);
        }
      },
      error: (err) => console.error('Failed to create game:', err)
    });
  }

  /** Updates a field on the newGame signal */
  updateNewGame(field: keyof Game, value: any): void {
    this.newGame.update(g => ({ ...g, [field]: value }));
  }

  /** Updates a field on the editGame signal */
  updateEditGame(field: keyof Game, value: any): void {
    this.editGame.update(g => g ? { ...g, [field]: value } : g);
  }

  // Sample leaderboard data
  leaderboard = [
    { rank: 1, name: 'Sophie L.', points: 12500, avatar: 'SL' },
    { rank: 2, name: 'Marc D.', points: 11200, avatar: 'MD' },
    { rank: 3, name: 'Julie A.', points: 10800, avatar: 'JA' },
    { rank: 4, name: 'Thomas B.', points: 9500, avatar: 'TB' },
    { rank: 5, name: 'Lucas M.', points: 8900, avatar: 'LM' }
  ];
}