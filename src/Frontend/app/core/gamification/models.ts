export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

export interface ChallengeTask {
  id: string;
  label: string;
  xp: number;
}

export interface ChallengeSection {
  id: string;
  title: string;
  tasks: ChallengeTask[];
}

export interface ChallengeModel {
  id: string;
  name: string;
  difficulty: Difficulty;
  rewardBadgeId?: string;
  sections: ChallengeSection[];
}

export interface BadgeModel {
  id: string;
  name: string;
  description: string;
}

export interface AchievementModel {
  id: string;
  name: string;
  description: string;
  current: number;
  goal: number;
}

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  completedChallenges: number;
  badges: number;
}

export type GamificationEvent =
  | { type: 'xp'; delta: number }
  | { type: 'levelUp'; level: number }
  | { type: 'badgeEarned'; badgeId: string }
  | { type: 'challengeCompleted'; challengeId: string };
