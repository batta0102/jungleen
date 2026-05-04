export type CourseStatus = 'Active' | 'Upcoming' | 'Completed';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  students: number;
  sessions: number;
  progress: number;
  status: CourseStatus;
}

export interface CourseCreate {
  title: string;
  instructor: string;
  students: number;
  sessions: number;
  progress: number;
  status: CourseStatus;
}
