export type Visibility = 'public' | 'private';
export type PriceType = 'free' | 'paid';

export interface EventModel {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  visibility: Visibility;
  priceType: PriceType;
  overview: string;
  expectedOutcomes: string[];
  schedule: string[];
}

export interface ClubActivity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

export interface ClubModel {
  id: string;
  name: string;
  description: string;
  details: string;
  upcomingActivities: ClubActivity[];
}

export interface TrainingSection {
  id: string;
  title: string;
  objective: string;
  contentTypes: Array<'video' | 'quiz' | 'text'>;
}

export interface TrainingChapter {
  id: string;
  title: string;
  sections: TrainingSection[];
}

export interface TrainingModel {
  id: string;
  name: string;
  learningObjectives: string[];
  chapters: TrainingChapter[];
}

export interface TestimonialModel {
  id: string;
  studentName: string;
  text: string;
  program: string;
}
