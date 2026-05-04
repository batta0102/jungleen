import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../core/api/environment';
import { Course } from '../../../../core/api/models';

function toCourseList(raw: unknown): Course[] {
  if (Array.isArray(raw)) return raw as Course[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as Course[];
    if (Array.isArray(o.data)) return o.data as Course[];
  }
  return [];
}

/**
 * Service for loading courses for the Front at /front/trainings.
 * Uses the same REST API as the back office (/back/courses page): /api/v1/onlinecourses/all + /api/v1/onsitecourses/all.
 * (GET /back/courses is the Angular route for the admin UI, not a JSON API.)
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * Fetches all courses from the backend API (proxy /api → http://localhost:8098).
   * Merges online and onsite courses.
   * URLs called: GET /api/v1/onlinecourses/all and GET /api/v1/onsitecourses/all
   * (Browser shows localhost:4200; proxy forwards to 8098.)
   */
  getAllCourses(): Observable<Course[]> {
    const onlineUrl = `${this.base}/onlinecourses/all`;
    const onsiteUrl = `${this.base}/onsitecourses/all`;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    console.log('[CourseService] Calling API... GET', origin + onlineUrl, 'and', origin + onsiteUrl);
    return forkJoin({
      online: this.http.get<Course[] | { content?: Course[]; data?: Course[] }>(onlineUrl).pipe(
        map(toCourseList),
        tap((data) => console.log('[CourseService] online next: count=', data.length, 'raw handled')),
        catchError((err: HttpErrorResponse) => {
          console.error('[CourseService] online error: status=', err?.status, 'message=', err?.message, 'url=', err?.url, 'body=', err?.error);
          return of([]);
        })
      ),
      onsite: this.http.get<Course[] | { content?: Course[]; data?: Course[] }>(onsiteUrl).pipe(
        map(toCourseList),
        tap((data) => console.log('[CourseService] onsite next: count=', data.length, 'raw handled')),
        catchError((err: HttpErrorResponse) => {
          console.error('[CourseService] onsite error: status=', err?.status, 'message=', err?.message, 'url=', err?.url, 'body=', err?.error);
          return of([]);
        })
      )
    }).pipe(
      map(({ online, onsite }) => {
        const onlineWithType = online.map((c) => ({ ...c, type: 'Online' as const }));
        const onsiteWithType = onsite.map((c) => ({ ...c, type: 'On-site' as const }));
        const list = [...onlineWithType, ...onsiteWithType];
        console.log('[CourseService] getAllCourses() success: total=', list.length, 'response shape: merged array');
        return list;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error?.error?.message ?? error?.message ?? 'Request failed';
    console.error('[CourseService] getAllCourses() error: status=', error?.status, 'url=', error?.url, 'message=', msg, 'body=', error?.error);
    return throwError(() => new Error(msg));
  }
}
