import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FailedQuestionStatDto {
  questionId: number;
  questionContent: string;
  quizTitle: string;
  failCount: number;
  totalAttempts: number;
  failureRate: number;
}

export interface WeakAreaStatDto {
  area: string;
  attempts: number;
  accuracy: number;
}

export interface ProgressPointDto {
  period: string;
  averageScore: number;
  attempts: number;
}

export interface TopicAverageDto {
  topic: string;
  averageScore: number;
  attempts: number;
}

export interface AdmissionAnalyticsResponseDto {
  mostFailedQuestions: FailedQuestionStatDto[];
  weakGrammarAreas: WeakAreaStatDto[];
  progressOverTime: ProgressPointDto[];
  averageScoreByTopic: TopicAverageDto[];
}

@Injectable({
  providedIn: 'root'
})
export class AdmissionAnalyticsService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<AdmissionAnalyticsResponseDto> {
    return this.http.get<AdmissionAnalyticsResponseDto>('/api/analytics/admission');
  }
}
