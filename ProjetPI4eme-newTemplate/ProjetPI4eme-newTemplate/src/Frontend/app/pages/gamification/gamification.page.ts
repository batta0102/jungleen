import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DataService } from '../../core/data/data.service';
import { GamificationService } from '../../core/gamification/gamification.service';
import { AchievementModel, ChallengeModel, LeaderboardPeriod } from '../../core/gamification/models';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-gamification-page',
  imports: [RouterLink, ModalComponent],
  templateUrl: './gamification.page.html',
  styleUrl: './gamification.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GamificationPage {
  private readonly data = inject(DataService);
  readonly gami = inject(GamificationService);

  readonly Math = Math;

  readonly tab = signal<'dashboard' | 'courses' | 'challenges' | 'leaderboard'>('dashboard');
  readonly mobileMenuOpen = signal(false);
  readonly leaderboardPeriod = signal<LeaderboardPeriod>('week');

  readonly selectedChallengeId = signal<string | null>(null);
  readonly selectedAchievementId = signal<string | null>(null);

  readonly toasts = signal<Array<{ id: string; title: string; body: string }>>([]);
  readonly confetti = signal(false);

  readonly challenges = this.gami.challenges;
  readonly badges = this.gami.badges;
  readonly achievements = computed<AchievementModel[]>(() => this.gami.getAchievements());

  readonly leaderboard = computed(() => this.gami.leaderboard(this.leaderboardPeriod()));
  readonly youIndex = computed(() => this.leaderboard().findIndex((e) => e.id === 'you'));

  readonly trainings = this.data.trainings;
  readonly courseCards = computed(() =>
    this.trainings().map((t) => {
      const total = t.chapters.reduce((acc, ch) => acc + ch.sections.length, 0);
      const completed = t.chapters.reduce(
        (acc, ch) => acc + ch.sections.filter((s) => this.data.isSectionComplete(t.id, ch.id, s.id)).length,
        0
      );
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { id: t.id, name: t.name, objectives: t.learningObjectives.length, total, completed, percent };
    })
  );

  readonly selectedChallenge = computed<ChallengeModel | null>(() => {
    const id = this.selectedChallengeId();
    if (!id) return null;
    return this.gami.getChallengeById(id) ?? null;
  });

  readonly selectedAchievement = computed<AchievementModel | null>(() => {
    const id = this.selectedAchievementId();
    if (!id) return null;
    return this.achievements().find((a) => a.id === id) ?? null;
  });

  setTab(tab: 'dashboard' | 'courses' | 'challenges' | 'leaderboard'): void {
    this.tab.set(tab);
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  openChallenge(challengeId: string): void {
    this.selectedChallengeId.set(challengeId);
  }

  closeChallenge(): void {
    this.selectedChallengeId.set(null);
  }

  openAchievement(achievementId: string): void {
    this.selectedAchievementId.set(achievementId);
  }

  closeAchievement(): void {
    this.selectedAchievementId.set(null);
  }

  difficultyClass(difficulty: string): string {
    return difficulty === 'Expert' ? 'diff diff-expert' : difficulty === 'Intermediate' ? 'diff diff-inter' : 'diff diff-begin';
  }

  progressForChallenge(challengeId: string): number {
    return this.gami.getChallengeProgress(challengeId).percent;
  }

  rewardXpForChallenge(challenge: ChallengeModel): number {
    return challenge.sections.reduce((acc, s) => acc + s.tasks.reduce((a, t) => a + t.xp, 0), 0);
  }

  markTaskDone(challengeId: string, sectionId: string, taskId: string): void {
    const events = this.gami.completeTask(challengeId, sectionId, taskId);
    for (const ev of events) {
      if (ev.type === 'xp') this.toast(`+${ev.delta} XP`, 'Nice work. Keep going.');
      if (ev.type === 'levelUp') {
        this.toast(`Level up!`, `You reached Level ${ev.level}.`);
        this.playSound('level');
        this.burstConfetti();
      }
      if (ev.type === 'badgeEarned') {
        const badge = this.badges().find((b) => b.id === ev.badgeId);
        this.toast('Badge earned', badge ? badge.name : 'New badge unlocked');
        this.playSound('badge');
        this.burstConfetti();
      }
      if (ev.type === 'challengeCompleted') {
        const ch = this.challenges().find((c) => c.id === ev.challengeId);
        this.toast('Challenge completed', ch ? ch.name : 'Great job');
        this.playSound('complete');
        this.burstConfetti();
      }
    }
  }

  setLeaderboardPeriod(period: LeaderboardPeriod): void {
    this.leaderboardPeriod.set(period);
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  private toast(title: string, body: string): void {
    const id = this.makeId();
    this.toasts.update((all) => [{ id, title, body }, ...all].slice(0, 4));
    window.setTimeout(() => this.toasts.update((all) => all.filter((t) => t.id !== id)), 2800);
  }

  private burstConfetti(): void {
    this.confetti.set(true);
    window.setTimeout(() => this.confetti.set(false), 900);
  }

  private playSound(kind: 'level' | 'badge' | 'complete'): void {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      const now = ctx.currentTime;
      const freq = kind === 'level' ? 660 : kind === 'badge' ? 880 : 520;
      o.frequency.setValueAtTime(freq, now);
      o.type = 'triangle';
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      o.connect(g);
      g.connect(ctx.destination);
      o.start(now);
      o.stop(now + 0.2);
      o.onended = () => {
        void ctx.close();
      };
    } catch {
      // ignore
    }
  }

  private makeId(): string {
    try {
      const c = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
      if (c?.randomUUID) return c.randomUUID();
    } catch {
      // ignore
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

