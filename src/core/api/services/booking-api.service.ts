import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environment';
import { Booking, BookingCreate } from '../models';

const BASE = `${environment.apiBaseUrl}`;

function toBookingList(res: unknown): Booking[] {
  if (Array.isArray(res)) return res as Booking[];
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as Booking[];
    if (Array.isArray(o.data)) return o.data as Booking[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);

  /** POST selon type: online-bookings ou onsite-bookings. */
  createBooking(payload: BookingCreate): Observable<Booking> {
    const path = payload.type === 'On-site' ? `${BASE}/onsite-bookings` : `${BASE}/online-bookings`;
    return this.http.post<Booking>(path, payload).pipe(catchError(this.handleError));
  }

  /** GET online-bookings/getAll + onsite-bookings/all, fusionnés. */
  getBookings(params?: { userId?: string; courseId?: string }): Observable<Booking[]> {
    return forkJoin({
      online: this.http.get<unknown>(`${BASE}/online-bookings/getAll`).pipe(map(toBookingList), catchError(() => of([]))),
      onsite: this.http.get<unknown>(`${BASE}/onsite-bookings/all`).pipe(map(toBookingList), catchError(() => of([])))
    }).pipe(map(({ online, onsite }) => [...online, ...onsite]));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    console.error('[BookingApiService]', error.status, error.url, msg);
    return throwError(() => new Error(msg));
  }
}
