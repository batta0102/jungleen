/**
 * Response from GET /advanced/progress?courseType=...&courseId=...&studentId=...
 */
export interface ProgressResponse {
  attendanceRate: number;
  eligible: boolean;
  /** Backend may send extra fields */
  [key: string]: unknown;
}
