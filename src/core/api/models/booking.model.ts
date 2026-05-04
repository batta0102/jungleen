export interface Booking {
  id?: string | number;
  courseId: string | number;
  sessionId?: string | number;
  userId?: string | number;
  type?: 'Online' | 'On-site';
  status?: string;
  bookedAt?: string;
  [key: string]: unknown;
}

export interface BookingCreate {
  courseId: string | number;
  sessionId?: string | number;
  type?: 'Online' | 'On-site';
}
