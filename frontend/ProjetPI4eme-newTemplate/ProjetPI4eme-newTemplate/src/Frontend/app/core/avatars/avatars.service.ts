import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AvatarDto {
  id?: number;
  type: string;
  imageUrl?: string;
  skins?: SkinDto[];
}

export interface SkinDto {
  id?: number;
  category: 'hoodie' | 'hat' | 'glasses' | string;
  name: string;
  imageUrl?: string;
  unlockLevel?: number;
  avatar?: AvatarDto | null;
}

@Injectable({ providedIn: 'root' })
export class AvatarsService {
  private avatarsUrl = '/api/avatars';
  private skinsUrl = '/api/skins';

  constructor(private http: HttpClient) {}

  getAvatars(): Observable<AvatarDto[]> {
    return this.http.get<AvatarDto[]>(this.avatarsUrl).pipe(
      map(list => (list || []).map(it => ({ ...it, id: it.id ?? (it as any)._id })))
    );
  }

  getSkins(): Observable<SkinDto[]> {
    return this.http.get<SkinDto[]>(this.skinsUrl).pipe(
      map(list => (list || []).map(it => ({ ...it, id: it.id ?? (it as any)._id })))
    );
  }
}
