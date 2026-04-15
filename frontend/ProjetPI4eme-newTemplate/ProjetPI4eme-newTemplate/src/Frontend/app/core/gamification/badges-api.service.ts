import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiBadge {
  id?: number;
  name: string;
  description: string;
  imageUrl?: string;
  unlockLevel: number;
}

@Injectable({ providedIn: 'root' })
export class BadgesApiService {
  private apiUrl = '/api/badges';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiBadge[]> {
    return this.http.get<ApiBadge[]>(this.apiUrl);
  }

  create(badge: ApiBadge, file: File): Observable<ApiBadge> {
    const form = new FormData();
    form.append('name', badge.name);
    form.append('description', badge.description);
    form.append('unlockLevel', String(badge.unlockLevel));
    form.append('file', file);
    return this.http.post<ApiBadge>(this.apiUrl, form);
  }

  update(id: number, badge: ApiBadge, file?: File | null): Observable<ApiBadge> {
    const form = new FormData();
    form.append('name', badge.name);
    form.append('description', badge.description);
    form.append('unlockLevel', String(badge.unlockLevel));
    if (file) form.append('file', file);
    return this.http.put<ApiBadge>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
