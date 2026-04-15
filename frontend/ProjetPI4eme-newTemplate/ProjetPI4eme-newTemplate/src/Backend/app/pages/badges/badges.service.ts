import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Badge {
  id?: number;
  name: string;
  description: string;
  imageUrl?: string;
  unlockLevel: number;
}

@Injectable({ providedIn: 'root' })
export class BadgesService {
  private apiUrl = '/api/badges';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Badge[]> {
    return this.http.get<Badge[]>(this.apiUrl);
  }

  create(badge: Badge, file: File): Observable<Badge> {
    const form = new FormData();
    form.append('name', badge.name);
    form.append('description', badge.description);
    form.append('unlockLevel', String(badge.unlockLevel));
    form.append('file', file);
    return this.http.post<Badge>(this.apiUrl, form);
  }

  update(id: number, badge: Badge, file?: File | null): Observable<Badge> {
    const form = new FormData();
    form.append('name', badge.name);
    form.append('description', badge.description);
    form.append('unlockLevel', String(badge.unlockLevel));
    if (file) form.append('file', file);
    return this.http.put<Badge>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
