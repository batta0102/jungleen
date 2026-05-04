export type ClassroomType = 'STANDARD' | 'PREMIUM' | 'MEETING';

export interface ClassroomRecommendation {
  id: number;
  name: string;
  capacity: number;
  type: ClassroomType;
  featuresDescription: string | null;
}
