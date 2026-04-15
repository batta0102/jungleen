import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AdmissionApiService, QcmDto } from '../../core/services/admission-api.service';
import { QuizAttemptComponent } from '../qcm/components/quiz-attempt-v2.component';

type CandidatePageMode = 'intro' | 'quiz-list' | 'attempt' | 'result';

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
}

@Component({
  selector: 'app-candidate-quiz-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, QuizAttemptComponent],
  templateUrl: './candidate-quiz.page.html',
  styleUrl: './candidate-quiz.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateQuizPage {
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly router = inject(Router);

  readonly PASS_THRESHOLD = 50;

  // Page state
  readonly pageMode = signal<CandidatePageMode>('intro');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Candidate info
  readonly candidateName = signal('');
  readonly candidateEmail = signal('');

  // Quiz state
  readonly candidateQuizzes = signal<QcmDto[]>([]);
  readonly activeSession = signal<ActiveSession | null>(null);
  readonly quizResult = signal<QuizResultData | null>(null);

  // Result
  readonly passed = signal(false);

  submitCandidateInfo(): void {
    if (!this.candidateName().trim() || !this.candidateEmail().trim()) return;

    this.loading.set(true);
    this.error.set(null);

    this.admissionApi.getCandidateQcms().subscribe({
      next: (quizzes) => {
        this.candidateQuizzes.set(quizzes ?? []);
        this.loading.set(false);
        if (quizzes && quizzes.length > 0) {
          this.pageMode.set('quiz-list');
        } else {
          this.error.set('No admission quizzes are available at the moment. Please check back later.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load quizzes. Please try again.');
      }
    });
  }

  startQuiz(quiz: QcmDto): void {
    if (!quiz.questions || quiz.questions.length === 0) {
      this.error.set('This quiz has no questions yet.');
      return;
    }

    this.error.set(null);
    const now = new Date();
    const endTime = new Date(now.getTime() + (quiz.dureeMinutes ?? 30) * 60 * 1000);

    this.admissionApi
      .createSessionTest({
        dateDebut: now.toISOString(),
        dateFin: endTime.toISOString(),
        statut: 'EN_COURS',
        scoreTotal: 0,
        pourcentage: 0,
        tempsPasseSecondes: 0,
        qcm: { id: quiz.id },
        userName: this.candidateName(),
        userEmail: this.candidateEmail()
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
        error: () => {
          this.error.set('Could not start the quiz. Please try again.');
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
      timeTaken: result.timeTaken
    });

    this.passed.set(result.percentage >= this.PASS_THRESHOLD);
    this.pageMode.set('result');
  }

  onAttemptClosed(): void {
    this.activeSession.set(null);
    this.pageMode.set('quiz-list');
  }

  goToLogin(): void {
    this.router.navigate(['/front/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/front/signup']);
  }

  retryQuiz(): void {
    this.quizResult.set(null);
    this.activeSession.set(null);
    this.pageMode.set('quiz-list');
  }

  backToIntro(): void {
    this.pageMode.set('intro');
    this.candidateQuizzes.set([]);
  }
}
