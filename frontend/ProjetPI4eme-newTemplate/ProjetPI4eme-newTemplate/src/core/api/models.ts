export interface Course {
  id: string | number;
  title?: string;
  instructor?: string;
  description?: string;
  level?: string;
  type?: 'Online' | 'On-site';
  priceOnline?: number;
  priceOnsite?: number;
  rating?: number;
  reviewCount?: number;
  [key: string]: unknown;
}

export type CourseCreate = Partial<Course> & {
  title: string;
  type: 'Online' | 'On-site';
};

export interface Session {
  id: string | number;
  courseId: string | number;
  classroomId?: string | number;
  type?: string;
  startDate?: string;
  startTime?: string;
  [key: string]: unknown;
}

export type SessionCreate = Partial<Session> & {
  courseId: string | number;
};

export interface Classroom {
  id: string | number;
  name?: string;
  capacity?: number;
  location?: string;
  [key: string]: unknown;
}

export interface Booking {
  id?: string | number;
  courseId?: string | number;
  type?: 'Online' | 'On-site';
  [key: string]: unknown;
}

export interface BookingCreate {
  courseId: string | number;
  type: 'Online' | 'On-site';
}

export interface GetCoursesParams {
  search?: string;
  level?: string;
  type?: 'Online' | 'On-site';
}

export interface RealtimeNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  payloadJson: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface RealtimeNotificationCreate {
  userId: number;
  type: string;
  title: string;
  message: string;
  payloadJson?: string | null;
}
