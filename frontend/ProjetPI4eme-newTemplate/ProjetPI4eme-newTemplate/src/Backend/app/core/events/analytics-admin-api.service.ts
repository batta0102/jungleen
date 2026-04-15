import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsAdminApiService {
  private readonly http = inject(HttpClient);

  getPopularEvents(): Observable<any> {
    return this.http.get('/api/analytics/events/popular');
  }

  getAttendanceRate(): Observable<any> {
    return this.http.get('/api/analytics/events/attendance-rate');
  }

  getParticipants(): Observable<any> {
    return this.http.get('/api/analytics/events/participants');
  }

  getVenueUtilization(): Observable<any> {
    return this.http.get('/api/analytics/venues/utilization');
  }

  getEngagement(): Observable<any> {
    return this.http.get('/api/analytics/engagement');
  }

  getTrends(): Observable<any> {
    return this.http.get('/api/analytics/trends');
  }

  predictAttendance(eventId: number): Observable<any> {
    return this.http.get(`/api/analytics/predict-attendance/${eventId}`);
  }

  getEventsReport(): Observable<any> {
    return this.http.get('/api/analytics/report/events');
  }

  downloadEventsReportCsv(): Observable<Blob> {
    return this.http.get('/api/analytics/report/events?format=csv', { responseType: 'blob' });
  }
}
