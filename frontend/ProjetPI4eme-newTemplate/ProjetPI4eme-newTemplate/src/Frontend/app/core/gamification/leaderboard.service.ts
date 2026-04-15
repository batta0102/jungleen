import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { GamificationService } from './gamification.service';

export interface LeaderboardUser {
  userId: string;
  name: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  updatedAt: string;
}

const LEADERBOARD_KEY = 'jie-leaderboard-v1';

function readLeaderboard(): LeaderboardUser[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardUser[]) : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(entries: LeaderboardUser[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly auth = inject(AuthService);
  private readonly gami = inject(GamificationService);

  readonly entries = signal<LeaderboardUser[]>(readLeaderboard());

  readonly ranked = computed(() => [...this.entries()].sort((a, b) => b.xp - a.xp));

  readonly myRank = computed(() => {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return 0;
    const idx = this.ranked().findIndex((e) => e.userId === uid);
    return idx >= 0 ? idx + 1 : 0;
  });

  sync(gamesPlayed?: number): void {
    const user = this.auth.currentUser();
    if (!user) return;

    const all = readLeaderboard();
    const idx = all.findIndex((e) => e.userId === user.id);
    const entry: LeaderboardUser = {
      userId: user.id,
      name: user.name || user.email || 'Player',
      xp: this.gami.xp(),
      level: this.gami.level(),
      gamesPlayed: gamesPlayed ?? (idx >= 0 ? all[idx].gamesPlayed : 0),
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      all[idx] = { ...entry, gamesPlayed: Math.max(entry.gamesPlayed, all[idx].gamesPlayed) };
    } else {
      all.push(entry);
    }

    writeLeaderboard(all);
    this.entries.set([...all]);
  }

  refresh(): void {
    this.entries.set(readLeaderboard());
  }
}
