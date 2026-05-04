export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendanceSessionType = 'ONLINE' | 'ONSITE';

/**
 * One attendance record for a student in a session.
 * Returned by GET /advanced/attendance/session
 * and possibly by POST /advanced/attendance/mark.
 */
export interface Attendance {
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  note?: string;
  /** Backend may send extra fields */
  [key: string]: unknown;
}

/**
 * Payload for POST /advanced/attendance/mark
 * { sessionType, sessionId, studentId, status, note? }
 */
export interface MarkAttendanceRequest {
  sessionType: AttendanceSessionType;
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  note?: string;
}

