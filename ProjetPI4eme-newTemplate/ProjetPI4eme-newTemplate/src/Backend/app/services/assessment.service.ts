import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BackQuestionDto {
  id?: number;
  contenu: string;
  choix?: BackChoiceDto[];
}

export interface BackChoiceDto {
  id?: number;
  contenu: string;
  estCorrect: boolean;
  ordre: number;
}

export interface BackQcmDto {
  id: number;
  titre: string;
  contenu: string;
  type?: 'QCM_SINGLE' | 'QCM_MULTI' | 'VRAI_FAUX';
  cible?: 'STUDENT' | 'CANDIDATE';
  datePublication?: string;
  dureeMinutes?: number;
  tentativesMax?: number;
  noteMax?: number;
  questions?: BackQuestionDto[];
}

export interface BackQcmCreateRequest {
  titre: string;
  contenu: string;
  type: 'QCM_SINGLE' | 'QCM_MULTI' | 'VRAI_FAUX';
  cible: 'STUDENT' | 'CANDIDATE';
  dureeMinutes: number;
  datePublication?: string;
  tentativesMax: number;
  noteMax: number;
  questions?: BackQuestionDto[];
}

export interface BackSessionTestDto {
  id: number;
  statut: string;
  pourcentage: number;
  qcm?: BackQcmDto;
}

export interface BackResultatDto {
  id: number;
  score: number;
  noteSur: number;
  pourcentage: number;
  session?: BackSessionTestDto;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private readonly http = inject(HttpClient);

  getQcms(): Observable<BackQcmDto[]> {
    return this.http.get<BackQcmDto[]>('/api/qcms');
  }

  createQcm(payload: BackQcmCreateRequest): Observable<BackQcmDto> {
    return this.http.post<BackQcmDto>('/api/qcms', payload);
  }

  updateQcm(id: number, payload: BackQcmCreateRequest): Observable<BackQcmDto> {
    return this.http.put<BackQcmDto>(`/api/qcms/${id}`, payload);
  }

  getSessionTests(): Observable<BackSessionTestDto[]> {
    return this.http.get<BackSessionTestDto[]>('/api/session-tests');
  }

  getResultats(): Observable<BackResultatDto[]> {
    return this.http.get<BackResultatDto[]>('/api/resultats');
  }
}
