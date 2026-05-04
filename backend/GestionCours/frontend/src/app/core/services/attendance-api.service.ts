import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import type { Attendance, MarkAttendanceRequest, SessionType } from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private readonly base = `${environment.apiBaseUrl}/advanced`;

  constructor(private http: HttpClient) {}

  getBySession(type: SessionType, sessionId: number): Observable<Attendance[]> {
    const params = new HttpParams()
      .set('type', type)
      .set('id', sessionId.toString());
    return this.http.get<Attendance[]>(`${this.base}/attendance/session`, { params });
  }

  markAttendance(body: MarkAttendanceRequest): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.base}/attendance/mark`, body);
  }
}
