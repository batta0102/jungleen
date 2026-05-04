import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environment';
import { RealtimeNotification, RealtimeNotificationCreate } from '../models';

const BASE = `${environment.notificationsApiBase}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid notification field "${field}": expected number`);
  }
  return n;
}

function toString(value: unknown, field: string): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const s = String((value as { toString(): string }).toString());
    if (s !== '[object Object]') return s;
  }
  throw new Error(`Invalid notification field "${field}": expected string`);
}

function toBoolean(value: unknown, field: string): boolean {
  if (value == null) return false;
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  throw new Error(`Invalid notification field "${field}": expected boolean`);
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** Jackson may serialize LocalDateTime as ISO string or array [y, m, d, h, min, sec, nano]. */
function coerceCreatedAt(raw: Record<string, unknown>): string {
  const v = raw['createdAt'] ?? raw['created_at'];
  if (v == null) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return new Date(v).toISOString();
  if (Array.isArray(v) && v.length >= 3) {
    const y = Number(v[0]);
    const mo = Number(v[1]);
    const d = Number(v[2]);
    const h = v.length > 3 ? Number(v[3]) : 0;
    const mi = v.length > 4 ? Number(v[4]) : 0;
    const s = v.length > 5 ? Number(v[5]) : 0;
    if ([y, mo, d].every((n) => Number.isFinite(n))) {
      const dt = new Date(y, mo - 1, d, h, mi, s);
      if (!Number.isNaN(dt.getTime())) return dt.toISOString();
    }
  }
  return new Date().toISOString();
}

function toPositiveUserId(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return n;
  return 1;
}

export function parseRealtimeNotification(raw: unknown): RealtimeNotification {
  if (!isRecord(raw)) {
    throw new Error('Invalid notification: expected object');
  }
  return {
    id: toNumber(raw['id'], 'id'),
    userId: toPositiveUserId(raw['userId'] ?? raw['user_id']),
    type: toString(raw['type'] ?? '', 'type'),
    title: toString(raw['title'] ?? '', 'title'),
    message: toString(raw['message'] ?? '', 'message'),
    payloadJson: toNullableString(raw['payloadJson'] ?? raw['payload_json']),
    read: toBoolean(raw['read'] ?? raw['isRead'] ?? raw['read_flag'] ?? false, 'read'),
    createdAt: coerceCreatedAt(raw),
    readAt: raw['readAt'] == null && raw['read_at'] == null
      ? null
      : toNullableString(raw['readAt'] ?? raw['read_at'])
  };
}

/** Alias for STOMP: map backend JSON to the Angular model. */
export const normalizeRealtimeNotification = parseRealtimeNotification;

function extractNotificationList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (!isRecord(res)) return [];
  if (Array.isArray(res['data'])) return res['data'];
  if (Array.isArray(res['content'])) return res['content'];
  if (Array.isArray(res['items'])) return res['items'];
  if (Array.isArray(res['notifications'])) return res['notifications'];
  return [];
}

function unwrapCreatedBody(res: unknown): unknown {
  if (!isRecord(res)) return res;
  if (res['data'] != null) return res['data'];
  return res;
}

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService {
  private readonly http = inject(HttpClient);

  /** Fired after POST /api/notifications so the bell can reload GET /my. */
  private readonly listRefresh$ = new Subject<void>();

  /** Subscribe (e.g. bell) to resync the list. */
  onListRefresh(): Observable<void> {
    return this.listRefresh$.asObservable();
  }

  /**
   * Call after a server-side action created notifications without using this service
   * (e.g. course POST). Triggers GET /api/notifications/my on subscribers (bell).
   */
  requestListRefresh(): void {
    this.listRefresh$.next();
  }

  /**
   * GET /api/notifications/my
   */
  getMyNotifications(): Observable<RealtimeNotification[]> {
    return this.http.get<unknown>(`${BASE}/my`).pipe(
      map((res) => {
        const out: RealtimeNotification[] = [];
        for (const item of extractNotificationList(res)) {
          try {
            out.push(parseRealtimeNotification(item));
          } catch (e) {
            console.warn('[RealtimeNotificationService] skip invalid notification row', e);
          }
        }
        return out;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/notifications — manual create (persisted; STOMP on server if configured).
   */
  createNotification(body: RealtimeNotificationCreate): Observable<RealtimeNotification> {
    return this.http.post<unknown>(BASE, body).pipe(
      map((res) => parseRealtimeNotification(unwrapCreatedBody(res))),
      tap(() => this.listRefresh$.next()),
      catchError(this.handleError)
    );
  }

  /**
   * PATCH /api/notifications/{id}/read
   */
  markAsRead(id: number): Observable<void> {
    if (!Number.isFinite(id) || id < 1) {
      return throwError(() => new Error('markAsRead: invalid id'));
    }
    return this.http.patch<void>(`${BASE}/${id}/read`, {}).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * PATCH /api/notifications/read-all
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${BASE}/read-all`, {}).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const backend = error.error;
    let message = error.message;
    if (isRecord(backend)) {
      const m = backend['message'] ?? backend['error'] ?? backend['detail'];
      if (typeof m === 'string' && m.trim() !== '') message = m;
    } else if (typeof backend === 'string' && backend.trim() !== '') {
      message = backend;
    }
    const enriched = Object.assign(new Error(`Notifications API: ${message}`), {
      status: error.status,
      url: error.url,
      originalError: error
    });
    console.error('[RealtimeNotificationService]', error.status, error.url, message);
    return throwError(() => enriched);
  }
}
