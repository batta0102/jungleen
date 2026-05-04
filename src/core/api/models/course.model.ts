export type CourseStatus = 'Active' | 'Upcoming' | 'Completed';
export type CourseType = 'Online' | 'On-site' | 'Both';

export interface Course {
  id: string | number;
  title: string;
  instructor?: string;
  description?: string;
  level?: string;       // A1, A2, B1, B2, C1, C2
  type?: CourseType;    // Online, On-site
  classroom?: string;
  students?: number;
  sessions?: number;
  progress?: number;
  status?: CourseStatus;
  priceOnline?: number;
  priceOnsite?: number;
  rating?: number;
  reviewCount?: number;
  /** Backend may use different field names; map in service if needed */
  [key: string]: unknown;
}

export interface CourseCreate {
  title: string;
  instructor?: string;
  description?: string;
  level?: string;
  type?: CourseType;
  students?: number;
  sessions?: number;
  progress?: number;
  status?: CourseStatus;
  priceOnline?: number;
  priceOnsite?: number;
}

export interface GetCoursesParams {
  search?: string;
  type?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
}
