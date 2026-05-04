export type SessionType = 'ONLINE' | 'ONSITE';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: number;
  sessionType: SessionType;
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  note: string | null;
  markedAt: string;
}

export interface MarkAttendanceRequest {
  sessionType: SessionType;
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  note?: string | null;
}

export const SESSION_TYPES: SessionType[] = ['ONLINE', 'ONSITE'];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
