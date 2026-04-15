import { Injectable, computed, signal } from '@angular/core';

import {
  AchievementModel,
  BadgeModel,
  ChallengeModel,
  GamificationEvent,
  LeaderboardEntry,
  LeaderboardPeriod
} from './models';
import { SAMPLE_BADGES, SAMPLE_CHALLENGES } from './sample-data';

type CompletionState = Record<string, true>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly completionKey = 'jie-gami-completion-v1';
  private readonly xpKey = 'jie-gami-xp-v1';
  private readonly badgeKey = 'jie-gami-badges-v1';
  private readonly activityKey = 'jie-gami-activity-v1';

  private readonly _challenges = signal<ChallengeModel[]>(SAMPLE_CHALLENGES);
  private readonly _badges = signal<BadgeModel[]>(SAMPLE_BADGES);

  private readonly _completed = signal<CompletionState>(readJson<CompletionState>(this.completionKey, {}));
  private readonly _xp = signal<number>(readJson<number>(this.xpKey, 0));
  private readonly _earnedBadges = signal<Record<string, true>>(readJson(this.badgeKey, {} as Record<string, true>));
  private readonly _activityDays = signal<Record<string, true>>(readJson(this.activityKey, {} as Record<string, true>));

  readonly challenges = this._challenges.asReadonly();
  readonly badges = this._badges.asReadonly();
  readonly completed = computed(() => this._completed());
  readonly xp = computed(() => this._xp());

  readonly earnedBadges = computed(() => Object.keys(this._earnedBadges()).sort());
  readonly earnedBadgeCount = computed(() => this.earnedBadges().length);

  readonly completedTasksCount = computed(() => Object.keys(this._completed()).length);
  readonly completedChallengesCount = computed(() =>
    this._challenges().filter((c) => this.getChallengeProgress(c.id).percent === 100).length
  );

  readonly level = computed(() => Math.floor(this._xp() / 500) + 1);
  readonly nextLevelAt = computed(() => this.level() * 500);
  readonly xpToNext = computed(() => Math.max(0, this.nextLevelAt() - this._xp()));
  readonly xpInLevel = computed(() => this._xp() - (this.level() - 1) * 500);

  readonly streakDays = computed(() => {
    const days = this._activityDays();
    const today = todayIso();
    const yesterday = yesterdayIso();
    if (!days[today] && !days[yesterday]) return 0;
    let streak = 0;
    let cursor = new Date(today);
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (!days[iso]) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  });

  getChallengeById(id: string): ChallengeModel | undefined {
    return this._challenges().find((c) => c.id === id);
  }

  isTaskComplete(challengeId: string, sectionId: string, taskId: string): boolean {
    return Boolean(this._completed()[this.taskKey(challengeId, sectionId, taskId)]);
  }

  isTaskUnlocked(challengeId: string, sectionId: string, taskId: string): boolean {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) return false;
    const linear = challenge.sections.flatMap((s) => s.tasks.map((t) => ({ sectionId: s.id, taskId: t.id })));
    const idx = linear.findIndex((x) => x.sectionId === sectionId && x.taskId === taskId);
    if (idx <= 0) return true;
    const prev = linear[idx - 1];
    return this.isTaskComplete(challengeId, prev.sectionId, prev.taskId);
  }

  getChallengeProgress(challengeId: string): { completed: number; total: number; percent: number } {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) return { completed: 0, total: 0, percent: 0 };
    const allTasks = challenge.sections.flatMap((s) => s.tasks.map((t) => ({ sectionId: s.id, taskId: t.id })));
    const total = allTasks.length;
    const completed = allTasks.filter((t) => this.isTaskComplete(challengeId, t.sectionId, t.taskId)).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  completeTask(challengeId: string, sectionId: string, taskId: string): GamificationEvent[] {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) return [];

    const section = challenge.sections.find((s) => s.id === sectionId);
    const task = section?.tasks.find((t) => t.id === taskId);
    if (!section || !task) return [];

    const key = this.taskKey(challengeId, sectionId, taskId);
    if (this._completed()[key]) return [];
    if (!this.isTaskUnlocked(challengeId, sectionId, taskId)) return [];

    const events: GamificationEvent[] = [];
    const beforeLevel = this.level();

    this._completed.update((state) => {
      const next = { ...state, [key]: true } as CompletionState;
      writeJson(this.completionKey, next);
      return next;
    });

    this._xp.update((xp) => {
      const next = xp + task.xp;
      writeJson(this.xpKey, next);
      return next;
    });

    this._activityDays.update((days) => {
      const next = { ...days, [todayIso()]: true } as Record<string, true>;
      writeJson(this.activityKey, next);
      return next;
    });

    events.push({ type: 'xp', delta: task.xp });

    const afterLevel = this.level();
    if (afterLevel > beforeLevel) {
      events.push({ type: 'levelUp', level: afterLevel });
    }

    const progress = this.getChallengeProgress(challengeId);
    if (progress.percent === 100) {
      events.push({ type: 'challengeCompleted', challengeId });
      if (challenge.rewardBadgeId) {
        const earned = this.tryEarnBadge(challenge.rewardBadgeId);
        if (earned) events.push({ type: 'badgeEarned', badgeId: challenge.rewardBadgeId });
      }
    }

    // Global badge rules
    if (this.completedTasksCount() === 1) {
      const earned = this.tryEarnBadge('b-first-steps');
      if (earned) events.push({ type: 'badgeEarned', badgeId: 'b-first-steps' });
    }

    if (this.streakDays() >= 3) {
      const earned = this.tryEarnBadge('b-streak-3');
      if (earned) events.push({ type: 'badgeEarned', badgeId: 'b-streak-3' });
    }

    if (this.countQuizTasksCompleted() >= 5) {
      const earned = this.tryEarnBadge('b-quiz-hunter');
      if (earned) events.push({ type: 'badgeEarned', badgeId: 'b-quiz-hunter' });
    }

    return events;
  }

  getAchievements(): AchievementModel[] {
    const completedTasks = this.completedTasksCount();
    const completedChallenges = this.completedChallengesCount();
    const quizTasks = this.countQuizTasksCompleted();
    const streak = this.streakDays();
    return [
      {
        id: 'a-tasks',
        name: 'Task Runner',
        description: 'Complete tasks across challenges.',
        current: Math.min(completedTasks, 20),
        goal: 20
      },
      {
        id: 'a-challenges',
        name: 'Challenge Finisher',
        description: 'Finish full challenges.',
        current: Math.min(completedChallenges, 3),
        goal: 3
      },
      {
        id: 'a-quiz',
        name: 'Quiz Streak',
        description: 'Complete quiz tasks.',
        current: Math.min(quizTasks, 10),
        goal: 10
      },
      {
        id: 'a-streak',
        name: 'Consistency',
        description: 'Keep learning daily.',
        current: Math.min(streak, 7),
        goal: 7
      }
    ];
  }

  leaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
    const you: LeaderboardEntry = {
      id: 'you',
      name: 'You',
      xp: this._xp(),
      completedChallenges: this.completedChallengesCount(),
      badges: this.earnedBadgeCount()
    };

    const base: LeaderboardEntry[] =
      period === 'week'
        ? [
            { id: 'u1', name: 'Sam', xp: 820, completedChallenges: 2, badges: 3 },
            { id: 'u2', name: 'Mina', xp: 730, completedChallenges: 1, badges: 2 },
            { id: 'u3', name: 'Alex', xp: 640, completedChallenges: 1, badges: 2 },
            { id: 'u4', name: 'Noah', xp: 580, completedChallenges: 1, badges: 1 }
          ]
        : period === 'month'
          ? [
              { id: 'u1', name: 'Sam', xp: 3120, completedChallenges: 6, badges: 7 },
              { id: 'u2', name: 'Mina', xp: 2800, completedChallenges: 5, badges: 6 },
              { id: 'u3', name: 'Alex', xp: 2400, completedChallenges: 4, badges: 5 },
              { id: 'u4', name: 'Noah', xp: 2100, completedChallenges: 3, badges: 4 }
            ]
          : [
              { id: 'u1', name: 'Sam', xp: 15400, completedChallenges: 28, badges: 18 },
              { id: 'u2', name: 'Mina', xp: 14250, completedChallenges: 26, badges: 16 },
              { id: 'u3', name: 'Alex', xp: 12100, completedChallenges: 22, badges: 14 },
              { id: 'u4', name: 'Noah', xp: 11050, completedChallenges: 20, badges: 12 }
            ];

    const all = [...base, you].sort((a, b) => b.xp - a.xp);
    return all;
  }

  private taskKey(challengeId: string, sectionId: string, taskId: string): string {
    return `${challengeId}:${sectionId}:${taskId}`;
  }

  private tryEarnBadge(badgeId: string): boolean {
    if (this._earnedBadges()[badgeId]) return false;
    this._earnedBadges.update((state) => {
      const next = { ...state, [badgeId]: true } as Record<string, true>;
      writeJson(this.badgeKey, next);
      return next;
    });
    return true;
  }

  private countQuizTasksCompleted(): number {
    // heuristic: tasks with word "Quiz" in label
    const completed = this._completed();
    let count = 0;
    for (const challenge of this._challenges()) {
      for (const section of challenge.sections) {
        for (const task of section.tasks) {
          if (!task.label.toLowerCase().includes('quiz')) continue;
          const key = this.taskKey(challenge.id, section.id, task.id);
          if (completed[key]) count += 1;
        }
      }
    }
    return count;
  }
}
