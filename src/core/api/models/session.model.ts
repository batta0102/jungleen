export interface Session {
  id: string | number;
  courseId: string | number;
  title?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  classroomId?: string | number;
  type?: 'Online' | 'On-site';
  maxParticipants?: number;
  capacity?: number;
  [key: string]: unknown;
}

export interface SessionCreate {
  courseId: string | number;
  title?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  classroomId?: string | number;
  type?: 'Online' | 'On-site';
  maxParticipants?: number;
}
