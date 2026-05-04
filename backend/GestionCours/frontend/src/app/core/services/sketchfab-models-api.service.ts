import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import type { SketchfabModelSearchItem } from '../models/sketchfab-search.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SketchfabModelsApiService {
  private readonly base = `${environment.apiBaseUrl}/v1/3d-models`;

  constructor(private http: HttpClient) {}

  search(query: string, limit = 12): Observable<ApiResponse<SketchfabModelSearchItem[]>> {
    const params = new HttpParams().set('query', query).set('limit', String(limit));
    return this.http.get<ApiResponse<SketchfabModelSearchItem[]>>(`${this.base}/search`, { params });
  }
}
