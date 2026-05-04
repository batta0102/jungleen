import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environment';
import { ProgressResponse } from '../models/progress.model';
import { Attendance, MarkAttendanceRequest } from '../models/attendance.model';

const BASE = `${environment.apiBaseUrl}`;

/**
 * Advanced API: Attendance & Progress.
 * Uses the same BASE as other *ApiService classes.
 */
@Injectable({ providedIn: 'root' })
export class AdvancedApiService {
  private readonly http = inject(HttpClient);

  /**
   * GET /advanced/progress?courseType=...&courseId=...&studentId=...
   */
  getProgress(
    courseType: string,
    courseId: string | number,
    studentId: number | string
  ): Observable<ProgressResponse> {
    const url = `${BASE}/advanced/progress`;
    const params = {
      courseType,
      courseId: String(courseId),
      studentId: String(studentId)
    };
    return this.http.get<ProgressResponse>(url, { params }).pipe(catchError(this.handleError));
  }

  /**
   * GET /advanced/attendance/session?type=...&id=...
   * Retour: Attendance[]
   */
  getSessionAttendance(type: string, sessionId: number): Observable<Attendance[]> {
    const url = `${BASE}/advanced/attendance/session`;
    const params = {
      type,
      id: String(sessionId)
    };
    return this.http
      .get<Attendance[]>(url, { params })
      .pipe(catchError(() => of([] as Attendance[])));
  }

  /**
   * POST /advanced/attendance/mark
   * Payload: { sessionType, sessionId, studentId, status, note? }
   */
  markAttendance(payload: MarkAttendanceRequest): Observable<Attendance[]> {
    const url = `${BASE}/advanced/attendance/mark`;
    return this.http.post<Attendance[]>(url, payload).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    console.error('[AdvancedApiService]', error.status, error.url, msg);
    return throwError(() => new Error(msg));
  }
}
