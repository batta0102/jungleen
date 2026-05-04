import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../environment';
import { Classroom } from '../models';

const BASE = environment.apiBaseUrl;

function toClassroomList(res: unknown): Classroom[] {
  if (Array.isArray(res)) return res as Classroom[];
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o['content'])) return o['content'] as Classroom[];
    if (Array.isArray(o['data'])) return o['data'] as Classroom[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class ClassroomApiService {
  private readonly http = inject(HttpClient);

  getClassrooms(): Observable<Classroom[]> {
    return this.http.get<unknown>(`${BASE}/classrooms/all`).pipe(
      map(toClassroomList),
      catchError(() => of([]))
    );
  }
}
