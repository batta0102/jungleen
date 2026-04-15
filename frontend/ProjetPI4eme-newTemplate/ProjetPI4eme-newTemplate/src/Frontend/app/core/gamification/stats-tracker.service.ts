import { Injectable, inject, signal, computed } from '@angular/core';
import { GamificationService } from './gamification.service';
import { BadgesApiService, ApiBadge } from './badges-api.service';
import { AvatarsService, AvatarDto } from '../avatars/avatars.service';
import { AiChatService, UserMemory } from '../ai/ai-chat.service';
import { GamesService } from '../games/games.service';
import { AuthService } from '../auth/auth.service';

/* ─── Interfaces ─── */

export interface DailyXpEntry {
  date: string;     // YYYY-MM-DD
  xp: number;
}

export interface GamePlayRecord {
  gameId: string;
  title: string;
  category: string;
  playedAt: string;  // ISO string
  durationSec: number;
  xpEarned: number;
  completed: boolean;
}

export interface AiSessionRecord {
  startedAt: string;
  endedAt: string;
  durationSec: number;
  messageCount: number;
  scriptsCompleted: number;
}

export interface UserStats {
  // Games
  totalGamesPlayed: number;
  gamesCompletedToday: number;
  avgGameCompletionSec: number;
  fastestGameSec: number;
  gameCategories: { category: string; count: number }[];

  // XP
  totalXp: number;
  xpToday: number;
  xpThisWeek: number;
  dailyXpHistory: DailyXpEntry[];

  // AI
  totalAiMinutes: number;
  aiSessionsCount: number;
  aiMessagesTotal: number;
  scriptsCompleted: number;

  // Badges & Avatars
  badgesUnlocked: number;
  badgesTotal: number;
  avatarsUnlocked: number;
  avatarsTotal: number;

  // Progression
  level: number;
  streakDays: number;
  challengesCompleted: number;
  challengesTotal: number;
  tasksCompleted: number;

  // Time
  memberSinceDays: number;
}

/* ─── Storage keys (user-scoped) ─── */
const BASE_GAME_PLAYS_KEY = 'jie-stats-game-plays-v1';
const BASE_AI_SESSIONS_KEY = 'jie-stats-ai-sessions-v1';
const BASE_DAILY_XP_KEY = 'jie-stats-daily-xp-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function writeJson<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class StatsTrackerService {
  private readonly gami = inject(GamificationService);
  private readonly badgesApi = inject(BadgesApiService);
  private readonly avatarsService = inject(AvatarsService);
  private readonly aiService = inject(AiChatService);
  private readonly gamesService = inject(GamesService);
  private readonly authService = inject(AuthService);

  /* ─── User-scoped key helpers ─── */
  private get userId(): string {
    return this.authService.currentUser()?.id ?? 'guest';
  }
  private get gamePlaysKey(): string { return `${BASE_GAME_PLAYS_KEY}-${this.userId}`; }
  private get aiSessionsKey(): string { return `${BASE_AI_SESSIONS_KEY}-${this.userId}`; }
  private get dailyXpKey(): string { return `${BASE_DAILY_XP_KEY}-${this.userId}`; }

  /* ─── Persistent signals ─── */
  readonly gamePlays = signal<GamePlayRecord[]>([]);
  readonly aiSessions = signal<AiSessionRecord[]>([]);
  readonly dailyXp = signal<DailyXpEntry[]>([]);

  /* ─── API data ─── */
  readonly apiBadges = signal<ApiBadge[]>([]);
  readonly avatars = signal<AvatarDto[]>([]);

  constructor() {
    this.loadApiData();
  }

  /**
   * Loads all stats data for the currently authenticated user.
   * Call this after authentication completes.
   */
  initForUser(): void {
    this.gamePlays.set(readJson(this.gamePlaysKey, []));
    this.aiSessions.set(readJson(this.aiSessionsKey, []));
    this.dailyXp.set(readJson(this.dailyXpKey, []));
    this.syncDailyXp();
  }

  /* ─── Load from backend ─── */
  private loadApiData(): void {
    this.badgesApi.getAll().subscribe({
      next: (b) => this.apiBadges.set(b ?? []),
      error: () => {}
    });
    this.avatarsService.getAvatars().subscribe({
      next: (a) => this.avatars.set(a ?? []),
      error: () => {}
    });
  }

  /* ─── Record a game play ─── */
  recordGamePlay(record: Omit<GamePlayRecord, 'playedAt'>): void {
    const entry: GamePlayRecord = { ...record, playedAt: new Date().toISOString() };
    this.gamePlays.update((all) => {
      const updated = [...all, entry].slice(-500); // keep last 500
      writeJson(this.gamePlaysKey, updated);
      return updated;
    });
    this.addDailyXp(record.xpEarned);
  }

  /* ─── Record an AI session ─── */
  recordAiSession(record: AiSessionRecord): void {
    this.aiSessions.update((all) => {
      const updated = [...all, record].slice(-200);
      writeJson(this.aiSessionsKey, updated);
      return updated;
    });
  }

  /* ─── Daily XP tracking ─── */
  addDailyXp(xp: number): void {
    if (xp <= 0) return;
    const today = todayIso();
    this.dailyXp.update((days) => {
      const idx = days.findIndex((d) => d.date === today);
      const updated = [...days];
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], xp: updated[idx].xp + xp };
      } else {
        updated.push({ date: today, xp });
      }
      const trimmed = updated.slice(-90); // keep 90 days
      writeJson(this.dailyXpKey, trimmed);
      return trimmed;
    });
  }

  private syncDailyXp(): void {
    const today = todayIso();
    const currentXp = this.gami.xp();
    const days = this.dailyXp();
    const existing = days.find((d) => d.date === today);
    if (!existing && currentXp > 0) {
      // Ensure at least the current total is represented
      // (daily tracking starts from now, so we won't backfill)
    }
  }

  /* ─── Compute full stats snapshot ─── */
  readonly stats = computed<UserStats>(() => {
    const plays = this.gamePlays();
    const sessions = this.aiSessions();
    const xpHistory = this.dailyXp();
    const today = todayIso();
    const now = new Date();

    // Games
    const completedPlays = plays.filter((p) => p.completed);
    const todayPlays = plays.filter((p) => p.playedAt.startsWith(today));
    const durations = completedPlays.filter((p) => p.durationSec > 0).map((p) => p.durationSec);
    const categoryMap = new Map<string, number>();
    for (const p of plays) {
      categoryMap.set(p.category, (categoryMap.get(p.category) ?? 0) + 1);
    }

    // XP
    const todayXp = xpHistory.find((d) => d.date === today)?.xp ?? 0;
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekIso = weekAgo.toISOString().slice(0, 10);
    const weekXp = xpHistory
      .filter((d) => d.date >= weekIso)
      .reduce((sum, d) => sum + d.xp, 0);

    // AI memory (read-only peek — no side effects allowed in computed)
    const user = this.authService.currentUser();
    const userId = user?.id ?? 'guest';
    const aiMem = this.aiService.peekMemory(userId);
    const totalAiMin = Math.round(sessions.reduce((s, r) => s + r.durationSec, 0) / 60);

    // Badges
    const apiBadgesList = this.apiBadges();
    const level = this.gami.level();
    const unlockedApiBadges = apiBadgesList.filter((b) => level >= b.unlockLevel).length;
    const earnedChallengeBadges = this.gami.earnedBadgeCount();
    const totalBadges = apiBadgesList.length + this.gami.badges().length;
    const unlockedBadges = unlockedApiBadges + earnedChallengeBadges;

    // Avatars
    const avatarsList = this.avatars();

    // First seen
    let memberDays = 0;
    if (aiMem?.firstSeen) {
      memberDays = Math.max(1, Math.floor((now.getTime() - new Date(aiMem.firstSeen).getTime()) / 86_400_000));
    }

    return {
      totalGamesPlayed: plays.length,
      gamesCompletedToday: todayPlays.filter((p) => p.completed).length,
      avgGameCompletionSec: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      fastestGameSec: durations.length > 0 ? Math.min(...durations) : 0,
      gameCategories: Array.from(categoryMap, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),

      totalXp: this.gami.xp(),
      xpToday: todayXp,
      xpThisWeek: weekXp,
      dailyXpHistory: xpHistory.slice(-14), // last 14 days

      totalAiMinutes: totalAiMin,
      aiSessionsCount: sessions.length,
      aiMessagesTotal: aiMem?.totalMessages ?? 0,
      scriptsCompleted: aiMem?.completedScripts?.length ?? 0,

      badgesUnlocked: unlockedBadges,
      badgesTotal: totalBadges,
      avatarsUnlocked: avatarsList.length,
      avatarsTotal: avatarsList.length,

      level,
      streakDays: this.gami.streakDays(),
      challengesCompleted: this.gami.completedChallengesCount(),
      challengesTotal: this.gami.challenges().length,
      tasksCompleted: this.gami.completedTasksCount(),

      memberSinceDays: memberDays,
    };
  });
}
