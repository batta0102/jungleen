import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import type { ClassroomRecommendation, ClassroomType } from '../models/onsite-session.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class OnsiteSessionApiService {
  private readonly base = `${environment.apiBaseUrl}/v1/onsite-sessions`;

  constructor(private http: HttpClient) {}

  recommendClassroom(date: string, requiredCapacity: number, preferredType?: ClassroomType): Observable<ApiResponse<ClassroomRecommendation>> {
    let params = new HttpParams()
      .set('date', date)
      .set('requiredCapacity', requiredCapacity.toString());

    if (preferredType) {
      params = params.set('preferredType', preferredType);
    }

    return this.http.get<ApiResponse<ClassroomRecommendation>>(`${this.base}/recommend-classroom`, { params });
  }
}
