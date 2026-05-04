import { ClubModel, EventModel, TestimonialModel, TrainingModel } from './models';

export const SAMPLE_EVENTS: EventModel[] = [
  {
    id: 'evt-conv-001',
    name: 'Conversation Booster: Speak with Confidence',
    date: '2026-03-05',
    time: '18:00',
    location: 'Jungle in English – Main Campus',
    visibility: 'public',
    priceType: 'free',
    overview: 'A practical speaking session focused on fluency, pronunciation, and real-life conversation strategies.',
    expectedOutcomes: [
      'Use conversation openers and follow-up questions naturally',
      'Improve pronunciation clarity in common situations',
      'Build confidence speaking in small groups'
    ],
    schedule: ['Welcome & warm-up', 'Guided conversation drills', 'Role-play scenarios', 'Feedback & next steps']
  },
  {
    id: 'evt-writing-001',
    name: 'Writing Clinic: Emails & CV Essentials',
    date: '2026-03-12',
    time: '17:30',
    location: 'Online (Live)',
    visibility: 'public',
    priceType: 'paid',
    overview: 'Hands-on workshop to improve professional writing, structure, and tone for real-world documents.',
    expectedOutcomes: [
      'Write clear and polite professional emails',
      'Improve CV sections (summary, experience, skills)',
      'Avoid the most common grammar mistakes'
    ],
    schedule: ['Diagnostic mini-test', 'Email writing practice', 'CV section improvement', 'Personal feedback']
  },
  {
    id: 'evt-private-001',
    name: 'Tutor Roundtable (Internal)',
    date: '2026-03-20',
    time: '16:00',
    location: 'Staff Room',
    visibility: 'private',
    priceType: 'free',
    overview: 'Internal tutor session on lesson design, assessment, and classroom best practices.',
    expectedOutcomes: ['Align on teaching objectives', 'Share lesson plans', 'Improve student feedback loops'],
    schedule: ['Teaching challenges', 'Peer review', 'Action plan']
  }
];

export const SAMPLE_CLUBS: ClubModel[] = [
  {
    id: 'club-conversation',
    name: 'English Conversation Club',
    description: 'Weekly meet-ups to practice speaking with friendly prompts and games.',
    details: 'The Conversation Club is designed for learners who want more speaking time, guided by a tutor with structured topics and supportive feedback.',
    upcomingActivities: [
      {
        id: 'act-cc-1',
        title: 'Small talk & introductions',
        date: '2026-02-20',
        time: '18:30',
        location: 'Main Campus'
      },
      {
        id: 'act-cc-2',
        title: 'Debate night: Technology & life',
        date: '2026-02-27',
        time: '18:30',
        location: 'Main Campus'
      }
    ]
  },
  {
    id: 'club-drama',
    name: 'Drama Club',
    description: 'Improve pronunciation and expression through acting and short scenes.',
    details: 'Drama activities help learners develop rhythm, intonation, and confidence. Sessions include warm-ups, scripts, and performance practice.',
    upcomingActivities: [
      {
        id: 'act-dr-1',
        title: 'Scene reading: emotions & tone',
        date: '2026-03-02',
        time: '19:00',
        location: 'Studio Room'
      }
    ]
  },
  {
    id: 'club-reading',
    name: 'Reading Club',
    description: 'Short stories and articles with vocabulary building and discussion.',
    details: 'Build vocabulary and reading fluency with curated texts. We focus on comprehension strategies and speaking about what you read.',
    upcomingActivities: []
  }
];

export const SAMPLE_TRAININGS: TrainingModel[] = [
  {
    id: 'trn-a2-foundations',
    name: 'A2 Foundations',
    learningObjectives: [
      'Introduce yourself and talk about daily life',
      'Use basic past and future forms',
      'Understand simple spoken English'
    ],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: Getting started',
        sections: [
          {
            id: 's-1',
            title: 'Greetings and introductions',
            objective: 'Use polite greetings and introduce yourself naturally.',
            contentTypes: ['video', 'text', 'quiz']
          },
          {
            id: 's-2',
            title: 'Numbers, time, and schedules',
            objective: 'Talk about time and daily routines.',
            contentTypes: ['text', 'quiz']
          }
        ]
      },
      {
        id: 'ch-2',
        title: 'Chapter 2: Everyday communication',
        sections: [
          {
            id: 's-3',
            title: 'Asking questions',
            objective: 'Form questions correctly and follow up in conversation.',
            contentTypes: ['video', 'quiz']
          }
        ]
      }
    ]
  },
  {
    id: 'trn-b1-speaking',
    name: 'B1 Speaking Skills',
    learningObjectives: ['Speak with clearer structure', 'Use connectors confidently', 'Handle common situations'],
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1: Speaking structure',
        sections: [
          {
            id: 's-1',
            title: 'Organizing answers',
            objective: 'Answer questions with a clear beginning, middle, and end.',
            contentTypes: ['video', 'text']
          }
        ]
      }
    ]
  }
];

export const SAMPLE_TESTIMONIALS: TestimonialModel[] = [
  {
    id: 't-1',
    studentName: 'Sara M.',
    program: 'A2 Foundations',
    text: 'I improved my confidence in speaking after just a few sessions. The tutors are supportive and practical.'
  },
  {
    id: 't-2',
    studentName: 'Youssef A.',
    program: 'Conversation Club',
    text: 'Great atmosphere and real practice. I learned how to keep conversations going without stress.'
  },
  {
    id: 't-3',
    studentName: 'Mina K.',
    program: 'Writing Clinic',
    text: 'The writing workshop helped me fix my CV and improve my email tone quickly.'
  }
];
