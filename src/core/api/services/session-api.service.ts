import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environment';
import { Session, SessionCreate } from '../models';

const BASE = `${environment.apiBaseUrl}`;

function toSessionList(res: unknown): Session[] {
  if (Array.isArray(res)) return res as Session[];
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as Session[];
    if (Array.isArray(o.data)) return o.data as Session[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly http = inject(HttpClient);

  /** GET /api/v1/online-sessions/getAll (et onsite-sessions si disponible). */
  getSessions(params?: { courseId?: string | number; tutorId?: string }): Observable<Session[]> {
    const url = `${BASE}/online-sessions/getAll`;
    return this.http.get<Session[] | { content?: Session[]; data?: Session[] }>(url).pipe(
      map(toSessionList),
      catchError(() => of([]))
    );
  }

  getSessionById(id: string | number): Observable<Session> {
    return this.http.get<Session>(`${BASE}/online-sessions/${id}`).pipe(catchError(this.handleError));
  }

  createSession(session: SessionCreate): Observable<Session> {
    return this.http.post<Session>(`${BASE}/online-sessions`, session).pipe(catchError(this.handleError));
  }

  updateSession(id: string | number, session: Partial<SessionCreate>): Observable<Session> {
    return this.http.put<Session>(`${BASE}/online-sessions/${id}`, session).pipe(catchError(this.handleError));
  }

  deleteSession(id: string | number): Observable<void> {
    return this.http.delete<void>(`${BASE}/online-sessions/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    console.error('[SessionApiService]', error.status, error.url, msg);
    return throwError(() => new Error(msg));
  }
}
