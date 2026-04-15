import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Avatar {
  id?: number;
  type: string;
  imageUrl?: string;
  skins?: any[];
}

@Injectable({ providedIn: 'root' })
export class AvatarsService {
  private apiUrl = '/api/avatars';

  constructor(private http: HttpClient) {}

  private normalize(a: any): Avatar {
    return { ...a, id: a.id ?? a._id };
  }

  getAll(): Observable<Avatar[]> {
    return this.http.get<Avatar[]>(this.apiUrl).pipe(
      map(list => (list || []).map(l => this.normalize(l)))
    );
  }

  create(a: Avatar, file: File) {
    const form = new FormData();
    form.append('type', a.type);
    form.append('file', file);
    return this.http.post<Avatar>(this.apiUrl, form).pipe(
      map(r => this.normalize(r))
    );
  }

  update(id: number, a: Avatar, file?: File | null) {
    const form = new FormData();
    form.append('type', a.type);
    if (file) form.append('file', file);
    return this.http.put<Avatar>(`${this.apiUrl}/${id}`, form).pipe(
      map(r => this.normalize(r))
    );
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
