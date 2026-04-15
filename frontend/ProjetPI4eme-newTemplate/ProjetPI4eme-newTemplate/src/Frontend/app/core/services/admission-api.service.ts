import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuestionDto {
  id: number;
  contenu: string;
  choix?: ChoiceDto[];
}

export interface ChoiceDto {
  id: number;
  contenu: string;
  estCorrect: boolean;
  ordre: number;
}

export interface QcmDto {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  cible: string;
  dureeMinutes: number;
  tentativesMax: number;
  noteMax: number;
  questions?: QuestionDto[];
}

export interface SessionTestDto {
  id: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  scoreTotal: number;
  pourcentage: number;
  tempsPasseSecondes: number;
  qcm?: QcmDto;
}

export interface SessionTestCreateRequest {
  dateDebut: string;
  dateFin: string;
  statut: string;
  scoreTotal: number;
  pourcentage: number;
  tempsPasseSecondes: number;
  qcm: { id: number };
  userName?: string;
  userEmail?: string;
}

export interface SessionTestUpdateRequest {
  dateDebut: string;
  dateFin: string;
  statut: string;
  scoreTotal: number;
  pourcentage: number;
  tempsPasseSecondes: number;
  qcm: { id: number };
  userName?: string;
  userEmail?: string;
}

export interface ReponseDonneeCreateRequest {
  estCorrect: boolean;
  scoreObtenu: number;
  question: { id: number };
  choixSelectionnes: { id: number }[];
  sessionTest: { id: number };
}

export interface ReponseDonneeDto {
  id: number;
  estCorrect: boolean;
  scoreObtenu: number;
}

export interface ResultatCreateRequest {
  score: number;
  noteSur: number;
  pourcentage: number;
  datePublicationResultat: string;
  session: { id: number };
}

export interface ResultatDto {
  id: number;
  score: number;
  noteSur: number;
  pourcentage: number;
  datePublicationResultat: string;
  session?: SessionTestDto;
}

export interface CertificationCheckResponse {
  certified: boolean;
  message: string;
  certificate?: {
    id: number;
    certificateNumber: string;
    subject: string;
    averageScore: number;
    dateIssued: string;
    quizTitles: string;
    userName: string;
  };
  qualifyingQuizzes?: number;
  requiredQuizzes?: number;
  scoreThreshold?: number;
  quizScores?: Array<{
    qcmId: number;
    qcmTitle: string;
    bestScore: number;
    qualifies: boolean;
  }>;
}

export interface CertificationProgressResponse {
  hasCertificate: boolean;
  certificate?: any;
  qualifyingQuizzes: number;
  requiredQuizzes: number;
  scoreThreshold: number;
  quizScores: Array<{
    qcmId: number;
    qcmTitle: string;
    bestScore: number;
    qualifies: boolean;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AdmissionApiService {
  private readonly http = inject(HttpClient);

  getQcms(): Observable<QcmDto[]> {
    return this.http.get<QcmDto[]>('/api/qcms');
  }

  getCandidateQcms(): Observable<QcmDto[]> {
    return this.http.get<QcmDto[]>('/api/qcms/candidate');
  }

  getSessionTests(): Observable<SessionTestDto[]> {
    return this.http.get<SessionTestDto[]>('/api/session-tests');
  }

  createSessionTest(payload: SessionTestCreateRequest): Observable<SessionTestDto> {
    return this.http.post<SessionTestDto>('/api/session-tests', payload);
  }

  updateSessionTest(id: number, payload: SessionTestUpdateRequest): Observable<SessionTestDto> {
    return this.http.put<SessionTestDto>(`/api/session-tests/${id}`, payload);
  }

  createReponse(payload: ReponseDonneeCreateRequest): Observable<ReponseDonneeDto> {
    return this.http.post<ReponseDonneeDto>('/api/reponses', payload);
  }

  createResultat(payload: ResultatCreateRequest): Observable<ResultatDto> {
    return this.http.post<ResultatDto>('/api/resultats', payload);
  }

  getResultats(): Observable<ResultatDto[]> {
    return this.http.get<ResultatDto[]>('/api/resultats');
  }

  // Certification endpoints
  checkCertification(userEmail: string, userName: string): Observable<CertificationCheckResponse> {
    return this.http.post<CertificationCheckResponse>('/api/certification/check', { userEmail, userName });
  }

  getCertificationProgress(email: string): Observable<CertificationProgressResponse> {
    return this.http.get<CertificationProgressResponse>(`/api/certification/progress?email=${encodeURIComponent(email)}`);
  }
}
