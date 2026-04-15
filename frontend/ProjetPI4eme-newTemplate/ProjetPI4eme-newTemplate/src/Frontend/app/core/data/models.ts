export type Visibility = 'public' | 'private';
export type PriceType = 'free' | 'paid';
export type EventType = 'online' | 'onsite';

export interface VenueDetails {
  name: string;
  address?: string;
  capacity?: number;
  amenities?: string[];
}

export interface EventModel {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  eventType?: EventType; // 'online' or 'onsite'
  visibility: Visibility;
  priceType: PriceType;
  overview: string;
  fullDescription?: string; // Extended description for modal
  expectedOutcomes: string[];
  schedule: string[];
  image?: string; // Event image URL
  venue?: VenueDetails; // Venue information for onsite events
  maxCapacity?: number; // Maximum attendees
  currentAttendees?: number; // Current registered attendees
  price?: number; // Price in TND for paid events
  category?: string; // Event category (Workshop, Seminar, etc.)
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
