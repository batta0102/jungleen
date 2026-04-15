import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdmissionApiService, QcmDto, SessionTestDto, CertificationCheckResponse } from '../../core/services/admission-api.service';
import { AssessmentSyncService } from '../../core/services/assessment-sync.service';
import { QuizAttemptComponent } from './components/quiz-attempt-v2.component';
import { QuizResultsComponent } from './components/quiz-results.component';

interface QuizHistory {
  id: number;
  title: string;
  score: number;
  total: number;
  percentage: number;
  date: Date;
  timeTaken: number;
}

type QuizPageMode = 'catalog' | 'attempt' | 'results' | 'history';

interface ActiveSession {
  quiz: QcmDto;
  sessionId: number;
  startTime: Date;
}

interface QuizResultData {
  quiz: QcmDto;
  score: number;
  total: number;
  percentage: number;
  timeTaken: number;
  sessionId: number;
}

@Component({
  selector: 'app-qcm-page',
  standalone: true,
  imports: [CommonModule, FormsModule, QuizAttemptComponent, QuizResultsComponent],
  templateUrl: './qcm.page.html',
  styleUrl: './qcm.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QcmPage {
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly assessmentSync = inject(AssessmentSyncService);
  private readonly router = inject(Router);

  readonly qcms = signal<QcmDto[]>([]);
  readonly quizHistory = signal<QuizHistory[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pageMode = signal<QuizPageMode>('catalog');
  readonly activeSession = signal<ActiveSession | null>(null);
  readonly quizResult = signal<QuizResultData | null>(null);

  // User info for certification tracking
  readonly userName = signal(this.loadSaved('jie_userName') || '');
  readonly userEmail = signal(this.loadSaved('jie_userEmail') || '');
  readonly showUserPrompt = signal(false);
  private pendingQuiz: QcmDto | null = null;

  // Certification state
  readonly certificationResult = signal<CertificationCheckResponse | null>(null);
  readonly showCertModal = signal(false);
  readonly certProgress = signal<{qualifyingQuizzes: number; requiredQuizzes: number; quizScores: any[]} | null>(null);

  constructor() {
    this.loadQcms();
    this.loadHistory();
    this.loadCertProgress();
  }

  private loadSaved(key: string): string {
    try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
  }

  private saveSaved(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch {}
  }

  private loadQcms(): void {
    this.loading.set(true);
    this.error.set(null);

    this.admissionApi.getQcms().subscribe({
      next: (items) => {
        this.qcms.set(items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load quizzes. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private loadHistory(): void {
    this.admissionApi.getSessionTests().subscribe({
      next: (sessions) => {
        const history: QuizHistory[] = (sessions ?? []).map(session => ({
          id: session.id,
          title: session.qcm?.titre ?? 'Unknown Quiz',
          score: session.scoreTotal,
          total: session.qcm?.questions?.length ?? 0,
          percentage: session.pourcentage,
          date: new Date(session.dateFin),
          timeTaken: session.tempsPasseSecondes
        }));
        this.quizHistory.set(history.sort((a, b) => b.date.getTime() - a.date.getTime()));
      },
      error: (err) => {
        console.error('Failed to load history:', err);
      }
    });
  }

  private loadCertProgress(): void {
    const email = this.userEmail();
    if (!email) return;

    this.admissionApi.getCertificationProgress(email).subscribe({
      next: (progress) => {
        this.certProgress.set({
          qualifyingQuizzes: progress.qualifyingQuizzes,
          requiredQuizzes: progress.requiredQuizzes,
          quizScores: progress.quizScores ?? []
        });
      },
      error: () => console.log('No certification progress yet')
    });
  }

  startQuiz(quiz: QcmDto): void {
    if (!quiz.questions || quiz.questions.length === 0) {
      this.error.set('This quiz has no questions yet.');
      return;
    }

    // If we don't have user info yet, prompt for it
    if (!this.userEmail() || !this.userName()) {
      this.pendingQuiz = quiz;
      this.showUserPrompt.set(true);
      return;
    }

    this.doStartQuiz(quiz);
  }

  confirmUserInfo(): void {
    if (!this.userEmail() || !this.userName()) return;

    this.saveSaved('jie_userName', this.userName());
    this.saveSaved('jie_userEmail', this.userEmail());
    this.showUserPrompt.set(false);

    if (this.pendingQuiz) {
      this.doStartQuiz(this.pendingQuiz);
      this.pendingQuiz = null;
    }
  }

  cancelUserPrompt(): void {
    this.showUserPrompt.set(false);
    this.pendingQuiz = null;
  }

  private doStartQuiz(quiz: QcmDto): void {
    const now = new Date();
    const inDuration = new Date(now.getTime() + (quiz.dureeMinutes ?? 30) * 60 * 1000);

    this.admissionApi
      .createSessionTest({
        dateDebut: now.toISOString(),
        dateFin: inDuration.toISOString(),
        statut: 'EN_COURS',
        scoreTotal: 0,
        pourcentage: 0,
        tempsPasseSecondes: 0,
        qcm: { id: quiz.id },
        userName: this.userName(),
        userEmail: this.userEmail()
      })
      .subscribe({
        next: (session) => {
          this.activeSession.set({
            quiz,
            sessionId: session.id,
            startTime: now
          });
          this.pageMode.set('attempt');
        },
        error: (err) => {
          console.error('Could not start quiz session:', err);
          this.error.set('Could not start quiz. Please try again.');
        }
      });
  }

  onAttemptCompleted(result: { score: number; total: number; percentage: number; timeTaken: number }): void {
    const quiz = this.activeSession()?.quiz;
    if (!quiz) return;

    this.quizResult.set({
      quiz,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      timeTaken: result.timeTaken,
      sessionId: this.activeSession()!.sessionId
    });
    this.pageMode.set('results');
    this.assessmentSync.notifyRefresh();
    this.loadHistory();

    // Check certification eligibility after completing a quiz
    this.checkCertification();
  }

  private checkCertification(): void {
    const email = this.userEmail();
    const name = this.userName();
    if (!email) return;

    this.admissionApi.checkCertification(email, name).subscribe({
      next: (response) => {
        this.certificationResult.set(response);
        if (response.certified) {
          this.showCertModal.set(true);
        }
        this.loadCertProgress();
      },
      error: (err) => {
        console.error('Certification check failed:', err);
      }
    });
  }

  closeCertModal(): void {
    this.showCertModal.set(false);
  }

  onAttemptClosed(): void {
    this.activeSession.set(null);
    this.pageMode.set('catalog');
  }

  onResultsClosed(): void {
    this.quizResult.set(null);
    this.activeSession.set(null);
    this.pageMode.set('catalog');
    this.loadQcms();
  }

  showHistory(): void {
    this.pageMode.set('history');
  }

  backToCatalog(): void {
    this.pageMode.set('catalog');
  }
}
