import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ResourceDto {
  resourceId: number;
  title: string;
  description: string;
  type: string;
  fileUrl: string | null;
  uploadDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8089/resources';

  listResources(): Observable<ResourceDto[]> {
    return this.http.get<ResourceDto[]>(`${this.baseUrl}/displayResources`);
  }
}
