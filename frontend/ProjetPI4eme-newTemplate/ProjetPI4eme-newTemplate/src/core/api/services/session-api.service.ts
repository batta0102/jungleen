import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../environment';
import { Session } from '../models';

const BASE = environment.apiBaseUrl;

function toSessionList(res: unknown): Session[] {
  if (Array.isArray(res)) return res as Session[];
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o['content'])) return o['content'] as Session[];
    if (Array.isArray(o['data'])) return o['data'] as Session[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly http = inject(HttpClient);

  getSessions(_params?: { courseId?: string | number; tutorId?: string }): Observable<Session[]> {
    return this.http.get<unknown>(`${BASE}/online-sessions/all`).pipe(
      map(toSessionList),
      catchError(() => of([]))
    );
  }
}
