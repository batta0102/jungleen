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

export interface ValidateRequest {
  answers: Array<{ clueId: string; answer: string }>;
}

export interface ValidateResponse {
  total: number;
  correct: number;
  allCorrect: boolean;
  correctClueIds: string[];
}

@Injectable({ providedIn: 'root' })
export class CrosswordService {
  private apiUrl = '/api/crosswords';

  constructor(private http: HttpClient) {}

  getRandom(difficulty: string): Observable<CrosswordGame> {
    return this.http.get<CrosswordGame>(`${this.apiUrl}/random?difficulty=${encodeURIComponent(difficulty)}`);
  }

  validate(id: number, payload: ValidateRequest): Observable<ValidateResponse> {
    return this.http.post<ValidateResponse>(`${this.apiUrl}/${id}/validate`, payload);
  }
}
