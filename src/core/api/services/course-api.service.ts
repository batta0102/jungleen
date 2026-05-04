import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environment';
import { Course, CourseCreate, GetCoursesParams } from '../models';

const BASE = `${environment.apiBaseUrl}`;

function toList<T>(res: T[] | { content?: T[]; data?: T[] } | null | undefined): T[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class CourseApiService {
  private readonly http = inject(HttpClient);

  /**
   * Appelle /api/v1/onlinecourses/all et /api/v1/onsitecourses/all, fusionne et filtre côté client.
   */
  getCourses(params?: GetCoursesParams): Observable<Course[]> {
    const onlineUrl = `${BASE}/onlinecourses/all`;
    const onsiteUrl = `${BASE}/onsitecourses/all`;
    return forkJoin({
      online: this.http.get<Course[] | { content?: Course[]; data?: Course[] }>(onlineUrl).pipe(
        map(toList),
        catchError(() => of([]))
      ),
      onsite: this.http.get<Course[] | { content?: Course[]; data?: Course[] }>(onsiteUrl).pipe(
        map(toList),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ online, onsite }) => {
        const onlineWithType = online.map((c) => ({ ...c, type: 'Online' as const }));
        const onsiteWithType = onsite.map((c) => ({ ...c, type: 'On-site' as const }));
        let list = [...onlineWithType, ...onsiteWithType];
        if (params?.search?.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter((c) => (c.title ?? '').toLowerCase().includes(q));
        }
        if (params?.level) list = list.filter((c) => (c.level ?? '') === params.level);
        if (params?.type) list = list.filter((c) => (c.type ?? '') === params.type);
        return list;
      })
    );
  }

  getCourseById(id: string | number): Observable<Course> {
    return this.http.get<Course>(`${BASE}/courses/${id}`).pipe(catchError(this.handleError));
  }

  createCourse(course: CourseCreate): Observable<Course> {
    return this.http.post<Course>(BASE + (course.type === 'On-site' ? '/onsitecourses' : '/onlinecourses'), course).pipe(catchError(this.handleError));
  }

  updateCourse(id: string | number, course: Partial<CourseCreate>): Observable<Course> {
    return this.http.put<Course>(`${BASE}/courses/${id}`, course).pipe(catchError(this.handleError));
  }

  deleteCourse(id: string | number): Observable<void> {
    return this.http.delete<void>(`${BASE}/courses/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    console.error('[CourseApiService]', error.status, error.url, msg);
    return throwError(() => new Error(msg));
  }
}
