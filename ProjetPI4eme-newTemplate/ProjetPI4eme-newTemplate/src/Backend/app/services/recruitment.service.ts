import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RecruitmentStatus =
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
  statut?: RecruitmentStatus;
  commentaireAdmin?: string;
  poste?: JobOfferDto;
  aiScore?: number;
  aiDecision?: string;
}

export interface CVAnalysisResultDto {
  score: number;
  decision: string;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string[];
  experienceYears: number;
  educationLevel: string;
  experienceScore: number;
  skillsScore: number;
  educationScore: number;
}

export interface InterviewDto {
  id: number;
  dateInterview: string;
  type: string;
  resultat?: string;
  commentaire?: string;
  meetLink?: string;
  candidature?: CandidatureDto;
}

export interface InterviewPayload {
  dateInterview: string;
  type: string;
  resultat: string;
  commentaire: string;
  meetLink?: string;
  candidature: { id: number };
}

@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private readonly http = inject(HttpClient);

  getOffers(): Observable<JobOfferDto[]> {
    return this.http.get<JobOfferDto[]>('/api/poste/all');
  }

  createOffer(payload: JobOfferPayload): Observable<JobOfferDto> {
    return this.http.post<JobOfferDto>('/api/poste/add', payload);
  }

  updateOffer(id: number, payload: JobOfferPayload): Observable<JobOfferDto> {
    return this.http.put<JobOfferDto>(`/api/poste/update/${id}`, payload);
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`/api/poste/delete/${id}`);
  }

  getCandidatures(): Observable<CandidatureDto[]> {
    return this.http.get<CandidatureDto[]>('/api/candidature/all');
  }

  updateStatus(id: number, statut: RecruitmentStatus): Observable<CandidatureDto> {
    return this.http.put<CandidatureDto>(`/api/candidature/statut/${id}?statut=${statut}`, {});
  }

  updateComment(id: number, commentaireAdmin: string): Observable<CandidatureDto> {
    return this.http.put<CandidatureDto>(`/api/candidature/update/${id}`, { commentaireAdmin });
  }

  getInterviews(): Observable<InterviewDto[]> {
    return this.http.get<InterviewDto[]>('/api/interview/all');
  }

  createInterview(payload: InterviewPayload): Observable<InterviewDto> {
    return this.http.post<InterviewDto>('/api/interview/add', payload);
  }

  analyzeCv(candidatureId: number): Observable<CVAnalysisResultDto> {
    return this.http.post<CVAnalysisResultDto>(`/api/candidature/${candidatureId}/analyze-cv`, {});
  }
}
