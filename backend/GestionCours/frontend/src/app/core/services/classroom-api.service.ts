import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import type { Classroom } from '../models/classroom.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ClassroomApiService {
  /** Matches dev proxy: `/api` stripped → `/v1/classrooms/...` on backend */
  private readonly base = `${environment.apiBaseUrl}/v1/classrooms`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Classroom[]>> {
    return this.http.get<ApiResponse<Classroom[]>>(`${this.base}/all`);
  }
}
