import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../environment';
import { Course, GetCoursesParams } from '../models';

const BASE = environment.apiBaseUrl;

function toList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o['content'])) return o['content'] as T[];
    if (Array.isArray(o['data'])) return o['data'] as T[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class CourseApiService {
  private readonly http = inject(HttpClient);

  getCourses(params?: GetCoursesParams): Observable<Course[]> {
    return forkJoin({
      online: this.http.get<unknown>(`${BASE}/onlinecourses/all`).pipe(map(toList<Course>), catchError(() => of([]))),
      onsite: this.http.get<unknown>(`${BASE}/onsitecourses/all`).pipe(map(toList<Course>), catchError(() => of([])))
    }).pipe(
      map(({ online, onsite }) => {
        let list = [
          ...online.map((c) => ({ ...c, type: 'Online' as const })),
          ...onsite.map((c) => ({ ...c, type: 'On-site' as const }))
        ];
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
    return this.getCourses().pipe(
      map((all) => all.find((c) => String(c.id) === String(id)) ?? ({ id, title: 'Course' } as Course))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    return throwError(() => new Error(msg));
  }
}
