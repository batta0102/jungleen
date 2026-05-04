export type ClassroomType = 'STANDARD' | 'PREMIUM' | 'MEETING';

export interface Classroom {
  id: number;
  name: string;
  capacity: number;
  type: ClassroomType;
  featuresDescription: string | null;
  /** Sketchfab model UID for Viewer API */
  sketchfabModelUid: string | null;
}
