import { BadgeModel, ChallengeModel } from './models';

export const SAMPLE_BADGES: BadgeModel[] = [
  {
    id: 'b-first-steps',
    name: 'First Steps',
    description: 'Complete your first task.'
  },
  {
    id: 'b-streak-3',
    name: '3-Day Streak',
    description: 'Learn 3 days in a row.'
  },
  {
    id: 'b-challenge-1',
    name: 'Challenge Cleared',
    description: 'Complete one full challenge.'
  },
  {
    id: 'b-quiz-hunter',
    name: 'Quiz Hunter',
    description: 'Complete 5 quiz tasks.'
  }
];

export const SAMPLE_CHALLENGES: ChallengeModel[] = [
  {
    id: 'c-speak-sprint',
    name: 'Speaking Sprint',
    difficulty: 'Beginner',
    rewardBadgeId: 'b-challenge-1',
    sections: [
      {
        id: 's1',
        title: 'Warm-up',
        tasks: [
          { id: 't1', label: 'Introduce yourself (30 sec)', xp: 50 },
          { id: 't2', label: 'Record 3 sentences with correct tense', xp: 80 }
        ]
      },
      {
        id: 's2',
        title: 'Challenge',
        tasks: [
          { id: 't3', label: 'Mini role-play: ordering at a café', xp: 120 },
          { id: 't4', label: 'Quiz: common speaking mistakes', xp: 120 }
        ]
      }
    ]
  },
  {
    id: 'c-vocab-raid',
    name: 'Vocabulary Raid',
    difficulty: 'Intermediate',
    sections: [
      {
        id: 's1',
        title: 'Loot',
        tasks: [
          { id: 't1', label: 'Learn 15 words (topic: travel)', xp: 80 },
          { id: 't2', label: 'Write 5 example sentences', xp: 100 }
        ]
      },
      {
        id: 's2',
        title: 'Boss fight',
        tasks: [
          { id: 't3', label: 'Quiz: synonyms and collocations', xp: 150 },
          { id: 't4', label: 'Challenge: 2-minute story using 10 words', xp: 160 }
        ]
      }
    ]
  },
  {
    id: 'c-grammar-lab',
    name: 'Grammar Lab',
    difficulty: 'Expert',
    sections: [
      {
        id: 's1',
        title: 'Diagnostics',
        tasks: [
          { id: 't1', label: 'Quiz: conditionals & modals', xp: 180 },
          { id: 't2', label: 'Fix 10 error sentences', xp: 160 }
        ]
      },
      {
        id: 's2',
        title: 'Production',
        tasks: [
          { id: 't3', label: 'Write a 200-word opinion paragraph', xp: 200 },
          { id: 't4', label: 'Quiz: punctuation and connectors', xp: 180 }
        ]
      }
    ]
  }
];
