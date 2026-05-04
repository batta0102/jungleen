import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../environment';
import { Booking, BookingCreate } from '../models';

const BASE = environment.apiBaseUrl;

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);

  createBooking(payload: BookingCreate): Observable<Booking> {
    const endpoint = payload.type === 'On-site' ? `${BASE}/onsite-bookings` : `${BASE}/online-bookings`;
    return this.http.post<Booking>(endpoint, payload).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message ?? error.message ?? 'Request failed';
    return throwError(() => new Error(msg));
  }
}
