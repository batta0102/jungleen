import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrosswordClue {
  id: string;
  number: number;
  direction: 'across' | 'down';
  row: number;
  col: number;
  answer: string;
  hint: string;
}

export interface CrosswordGame {
  id?: number;
  title: string;
  difficulty: 'Beginner' | 'Medium' | 'Hard' | string;
  xpReward: number;
  width: number;
  height: number;
  gridRows: string[];
  clues: CrosswordClue[];
}

@Injectable({ providedIn: 'root' })
export class CrosswordsService {
  private apiUrl = '/api/crosswords';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CrosswordGame[]> {
    return this.http.get<CrosswordGame[]>(this.apiUrl);
  }

  create(game: CrosswordGame): Observable<CrosswordGame> {
    return this.http.post<CrosswordGame>(this.apiUrl, game);
  }

  update(id: number, game: CrosswordGame): Observable<CrosswordGame> {
    return this.http.put<CrosswordGame>(`${this.apiUrl}/${id}`, game);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
