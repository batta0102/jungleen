import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environment';
import { Classroom } from '../models';

const BASE = `${environment.apiBaseUrl}/classrooms`;

interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ClassroomApiService {
  private readonly http = inject(HttpClient);

  private lastUpserted: Classroom | null = null;
  setLastUpserted(c: Classroom): void {
    this.lastUpserted = c;
  }
  getAndClearLastUpserted(): Classroom | null {
    const c = this.lastUpserted;
    this.lastUpserted = null;
    return c;
  }

  getClassrooms(): Observable<Classroom[]> {
    return this.http
      .get<Classroom[] | ApiResponse<Classroom[]> | { content?: Classroom[]; data?: Classroom[] }>(`${BASE}/all`)
      .pipe(
        map((res) => {
          let list: Classroom[];
          if (Array.isArray(res)) list = res;
          else {
            const o = res as Record<string, unknown>;
            if (Array.isArray(o['data'])) list = o['data'] as Classroom[];
            else if (Array.isArray(o['content'])) list = o['content'] as Classroom[];
            else list = [];
          }
          return list.map((c) => this.normalizeClassroom(c as Record<string, unknown>));
        }),
        catchError(this.handleError)
      );
  }

  getClassroomById(id: string | number): Observable<Classroom> {
    return this.http
      .get<ApiResponse<Classroom> | Classroom>(`${BASE}/${id}`)
      .pipe(
        map((res): Classroom => {
          const r = res as Record<string, unknown>;
          const out = r['data'] ?? res;
          return this.normalizeClassroom(out as Record<string, unknown>);
        }),
        catchError(this.handleError)
      );
  }

  createClassroom(classroom: {
    name: string;
    capacity: number;
    type?: string;
    location?: string;
    model3dUrl?: string;
    sketchfabModelUid?: string;
  }): Observable<Classroom> {
    const locationStr = classroom['location'] != null ? String(classroom['location']).trim() : '';
    const model3dUrl = classroom['model3dUrl'] != null ? String(classroom['model3dUrl']).trim() : '';
    const sketchfabModelUid =
      classroom['sketchfabModelUid'] != null ? String(classroom['sketchfabModelUid']).trim() : '';
    const type = classroom['type'] != null ? String(classroom['type']).trim().toUpperCase() : 'STANDARD';
    const body: Record<string, unknown> = {
      name: classroom['name'],
      capacity: Number(classroom['capacity']),
      type,
      location: locationStr
    };
    if (model3dUrl !== '') body['model3dUrl'] = model3dUrl;
    if (sketchfabModelUid !== '') body['sketchfabModelUid'] = sketchfabModelUid;
    return this.http
      .post<Classroom | ApiResponse<Classroom>>(`${BASE}/add`, body)
      .pipe(
        map((res): Classroom => {
          const r = res as Record<string, unknown>;
          const out = (r['data'] ?? res) as Record<string, unknown>;
          const created = this.normalizeClassroom(out);
          if (!created.location && locationStr) created.location = locationStr;
          this.setLastUpserted(created);
          return created;
        }),
        catchError(this.handleError)
      );
  }

  updateClassroom(
    id: string | number,
    classroom: {
      name?: string;
      capacity?: number;
      type?: string;
      location?: string;
      model3dUrl?: string;
      sketchfabModelUid?: string;
    }
  ): Observable<Classroom> {
    const body: Record<string, unknown> = {};
    if (classroom['name'] !== undefined) body['name'] = classroom['name'];
    if (classroom['capacity'] !== undefined) body['capacity'] = Number(classroom['capacity']);
    if (classroom['type'] !== undefined) body['type'] = String(classroom['type']).trim().toUpperCase();
    if (classroom['location'] !== undefined) body['location'] = String(classroom['location']).trim();
    if (classroom['model3dUrl'] !== undefined) body['model3dUrl'] = String(classroom['model3dUrl']).trim();
    if (classroom['sketchfabModelUid'] !== undefined) {
      body['sketchfabModelUid'] = String(classroom['sketchfabModelUid']).trim();
    }
    const locationSent = classroom['location'] != null ? String(classroom['location']).trim() : '';
    return this.http
      .put<Classroom | ApiResponse<Classroom>>(`${BASE}/update/${id}`, body)
      .pipe(
        map((res): Classroom => {
          const r = res as Record<string, unknown>;
          const out = (r['data'] ?? res) as Record<string, unknown>;
          const updated = this.normalizeClassroom(out);
          if (!updated.location && locationSent) updated.location = locationSent;
          this.setLastUpserted(updated);
          return updated;
        }),
        catchError(this.handleError)
      );
  }

  deleteClassroom(id: string | number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${BASE}/delete/${id}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  private normalizeClassroom(raw: Record<string, unknown>): Classroom {
    const loc =
      raw['location'] != null && raw['location'] !== '' ? String(raw['location']).trim() :
      raw['locationName'] != null && raw['locationName'] !== '' ? String(raw['locationName']).trim() :
      raw['lieu'] != null && raw['lieu'] !== '' ? String(raw['lieu']).trim() :
      raw['adresse'] != null && raw['adresse'] !== '' ? String(raw['adresse']).trim() :
      raw['place'] != null && raw['place'] !== '' ? String(raw['place']).trim() :
      raw['loc'] != null && raw['loc'] !== '' ? String(raw['loc']).trim() : '';
    const addr = raw['address'];
    const locationStr = loc ||
      (typeof addr === 'string' && addr ? addr.trim() : '') ||
      (addr && typeof addr === 'object' && addr !== null && (addr as Record<string, unknown>)['name'] != null
        ? String((addr as Record<string, unknown>)['name']).trim() : '');
    const model3dUrlRaw = raw['model3dUrl'] ?? raw['model3d_url'];
    const model3dUrl = model3dUrlRaw != null ? String(model3dUrlRaw).trim() : '';
    const sketchfabRaw = raw['sketchfabModelUid'] ?? raw['sketchfab_model_uid'];
    const sketchfabModelUid = sketchfabRaw != null ? String(sketchfabRaw).trim() : '';
    const typeRaw = raw['type'] ?? raw['classroomType'];
    const type = typeRaw != null ? String(typeRaw).trim().toUpperCase() : '';
    const featuresRaw = raw['featuresDescription'] ?? raw['features_description'];
    const featuresDescription = featuresRaw != null ? String(featuresRaw).trim() : '';
    return {
      ...raw,
      id: raw['id'],
      name: raw['name'] != null ? String(raw['name']) : '',
      capacity: raw['capacity'] != null ? Number(raw['capacity']) : undefined,
      location: locationStr || undefined,
      type: type || undefined,
      featuresDescription: featuresDescription || undefined,
      model3dUrl: model3dUrl || undefined,
      sketchfabModelUid: sketchfabModelUid || undefined
    } as Classroom;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    console.error('[ClassroomApiService]', error.status, error.url, msg);
    const enrichedError = Object.assign(new Error(msg), {
      status: error.status,
      originalError: error
    });
    return throwError(() => enrichedError);
  }
}
