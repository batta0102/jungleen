import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CandidatureStatus =
  | 'EN_ATTENTE'
  | 'CV_VALIDE'
  | 'INTERVIEW_PLANIFIEE'
  | 'INTERVIEW_ACCEPTEE'
  | 'INTERVIEW_REFUSEE'
  | 'TEST_EN_ATTENTE'
  | 'CERTIFIE'
  | 'REFUSE';

export interface JobOfferDto {
  id: number;
  titre: string;
  contenu?: string;
  description?: string;
  niveauRequis?: string;
  experienceRequise?: number;
  datePublication?: string;
  actif: boolean;
}

export interface JobOfferPayload {
  titre: string;
  contenu: string;
  description: string;
  niveauRequis: string;
  experienceRequise: number;
  datePublication: string;
  actif: boolean;
}

export interface CandidatureDto {
  id: number;
  dateSoumission?: string;
  nom: string;
  email: string;
  cv: string;
  statut?: CandidatureStatus;
  commentaireAdmin?: string;
  poste?: JobOfferDto;
}

export interface CandidaturePayload {
  nom: string;
  email: string;
  cv: string;
  poste: { id: number };
}

@Injectable({ providedIn: 'root' })
export class CareerCenterApiService {
  private readonly http = inject(HttpClient);

  getJobOffers(): Observable<JobOfferDto[]> {
    return this.http.get<JobOfferDto[]>('/api/poste/all');
  }

  createJobOffer(payload: JobOfferPayload): Observable<JobOfferDto> {
    return this.http.post<JobOfferDto>('/api/poste/add', payload);
  }

  updateJobOffer(id: number, payload: JobOfferPayload): Observable<JobOfferDto> {
    return this.http.put<JobOfferDto>(`/api/poste/update/${id}`, payload);
  }

  deleteJobOffer(id: number): Observable<void> {
    return this.http.delete<void>(`/api/poste/delete/${id}`);
  }

  getCandidatures(): Observable<CandidatureDto[]> {
    return this.http.get<CandidatureDto[]>('/api/candidature/all');
  }

  createCandidature(payload: CandidaturePayload): Observable<CandidatureDto> {
    return this.http.post<CandidatureDto>('/api/candidature/add', payload);
  }

  updateCandidatureStatus(id: number, statut: CandidatureStatus): Observable<CandidatureDto> {
    return this.http.put<CandidatureDto>(`/api/candidature/statut/${id}?statut=${statut}`, {});
  }

  updateCandidatureComment(id: number, commentaireAdmin: string): Observable<CandidatureDto> {
    return this.http.put<CandidatureDto>(`/api/candidature/update/${id}`, { commentaireAdmin });
  }
}
