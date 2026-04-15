import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Skin {
  id?: number;
  category: string;
  name: string;
  imageUrl?: string;
  unlockLevel?: number;
  avatar?: any;
}

@Injectable({ providedIn: 'root' })
export class SkinsService {
  private apiUrl = '/api/skins';

  constructor(private http: HttpClient) {}

  private normalize(s: any): Skin { return { ...s, id: s.id ?? s._id }; }

  getAll(): Observable<Skin[]> { return this.http.get<Skin[]>(this.apiUrl).pipe(map(list => (list||[]).map(l => this.normalize(l)))); }

  create(s: Skin, file?: File | null) {
    const form = new FormData();
    form.append('category', s.category);
    form.append('name', s.name);
    form.append('unlockLevel', String(s.unlockLevel ?? 0));
    if (s.avatar && (s.avatar as any).id) form.append('avatarId', String((s.avatar as any).id));
    if (file) form.append('file', file);
    return this.http.post<Skin>(this.apiUrl, form).pipe(map(r => this.normalize(r)));
  }

  update(id: number, s: Skin, file?: File | null) {
    const form = new FormData();
    form.append('category', s.category);
    form.append('name', s.name);
    form.append('unlockLevel', String(s.unlockLevel ?? 0));
    if (s.avatar && (s.avatar as any).id) form.append('avatarId', String((s.avatar as any).id));
    if (file) form.append('file', file);
    return this.http.put<Skin>(`${this.apiUrl}/${id}`, form).pipe(map(r => this.normalize(r)));
  }

  delete(id: number) { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
