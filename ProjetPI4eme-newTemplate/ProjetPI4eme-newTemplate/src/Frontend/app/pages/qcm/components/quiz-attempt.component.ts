import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, effect } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AdmissionApiService, ChoiceDto, QcmDto, QuestionDto } from '../../../core/services/admission-api.service';

interface QuestionState {
  id: number;
  content: string;
  choices: ChoiceDto[];
  selectedChoiceIds: number[];
  answered: boolean;
}

@Component({
  selector: 'app-quiz-attempt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-attempt.component.html',
  styleUrl: './quiz-attempt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizAttemptComponent {
  private readonly admissionApi = inject(AdmissionApiService);
  
  readonly quiz = input.required<QcmDto>();
  readonly sessionId = input.required<number>();
  readonly startTime = input.required<Date>();
  
  readonly attemptCompleted = output<{
    score: number;
    total: number;
    percentage: number;
    timeTaken: number;
  }>();
  
  readonly attemptClosed = output<void>();

  readonly questionStates = signal<QuestionState[]>([]);
  readonly currentQuestionIndex = signal(0);
  readonly timeRemaining = signal(0);
  readonly timePercentage = computed(() => {
    const total = (this.quiz().dureeMinutes || 30) * 60;
    return Math.max(0, Math.min(100, (this.timeRemaining() / total) * 100));
  });
  readonly isTimeWarning = computed(() => this.timeRemaining() <= 300); // 5 minutes
  readonly isTimeCritical = computed(() => this.timeRemaining() <= 60); // 1 minute
  readonly showConfirmSubmit = signal(false);
  readonly isSubmitting = signal(false);

  readonly currentQuestion = computed(() => {
    const states = this.questionStates();
    return states[this.currentQuestionIndex()] ?? null;
  });

  readonly canGoPrevious = computed(() => this.currentQuestionIndex() > 0);
  readonly canGoNext = computed(() => this.currentQuestionIndex() < this.questionStates().length - 1);
  readonly allAnswered = computed(() => 
    this.questionStates().every(q => q.selectedChoiceIds.length > 0)
  );

  readonly answeredCount = computed(() => 
    this.questionStates().filter(q => q.answered).length
  );

  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const quiz = this.quiz();
      if (quiz?.questions && quiz.questions.length > 0) {
        this.initializeQuestions();
        this.startTimer();
      }
    });
  }

  private initializeQuestions(): void {
    const questions = this.quiz().questions ?? [];
    console.log('INITIALIZING QUESTIONS:', { totalQuestions: questions.length });
    
    this.questionStates.set(
      questions.map(q => {
        const state = {
          id: q.id,
          content: q.contenu,
          choices: (q.choix ?? []).sort((a, b) => a.ordre - b.ordre),
          selectedChoiceIds: [],
          answered: false
        };
        console.log('Question state:', { questionId: q.id, choicesCount: state.choices.length });
        return state;
      })
    );
    
    console.log('ALL QUESTION STATES INITIALIZED:', this.questionStates());
  }

  private startTimer(): void {
    const durationSeconds = (this.quiz().dureeMinutes || 30) * 60;
    this.timeRemaining.set(durationSeconds);

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.timeRemaining.update(t => {
          if (t <= 1) {
            this.submitAttempt();
            return 0;
          }
          return t - 1;
        });
      });
  }

  onChoiceChange(event: Event, choiceId: number): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    
    console.log('onChoiceChange called:', { choiceId, checked });
    
    const quizType = this.quiz().type;
    const currentIdx = this.currentQuestionIndex();

    this.questionStates.update(states => {
      const updated = states.map((q, idx) => {
        if (idx !== currentIdx) {
          return q;
        }

        if (quizType === 'QCM_MULTI') {
          // Multiple selection: checkbox behavior
          let nextSelected: number[];
          
          if (checked) {
            // Add this choice
            nextSelected = [...new Set([...q.selectedChoiceIds, choiceId])];
          } else {
            // Remove this choice
            nextSelected = q.selectedChoiceIds.filter(id => id !== choiceId);
          }
          
          console.log('QCM_MULTI updated:', { 
            questionId: q.id, 
            previousSelected: q.selectedChoiceIds, 
            newSelected: nextSelected 
          });
          
          return { 
            ...q, 
            selectedChoiceIds: nextSelected, 
            answered: nextSelected.length > 0 
          };
        } else {
          // Single selection: radio button behavior
          const nextSelected = checked ? [choiceId] : [];
          
          console.log('QCM_SINGLE updated:', { 
            questionId: q.id, 
            newSelected: nextSelected 
          });
          
          return {
            ...q,
            selectedChoiceIds: nextSelected,
            answered: nextSelected.length > 0
          };
        }
      });
      
      console.log('All question states after update:', updated);
      return updated;
    });
  }

  goToPrevious(): void {
    if (this.canGoPrevious()) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  goToNext(): void {
    if (this.canGoNext()) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questionStates().length) {
      this.currentQuestionIndex.set(index);
    }
  }

  isChoiceSelected(choiceId: number): boolean {
    const current = this.currentQuestion();
    if (!current) {
      return false;
    }
    const selected = current.selectedChoiceIds.includes(choiceId);
    // console.log('isChoiceSelected:', { choiceId, currentQ: current.id, selectedIds: current.selectedChoiceIds, selected });
    return selected;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  openConfirmSubmit(): void {
    if (!this.allAnswered()) {
      // Optionally allow submission with unanswered questions
      // For now, enforce all questions answered
      return;
    }
    this.showConfirmSubmit.set(true);
  }

  cancelSubmit(): void {
    this.showConfirmSubmit.set(false);
  }

  submitAttempt(): void {
    this.showConfirmSubmit.set(false);
    this.isSubmitting.set(true);

    let score = 0;
    const answers = this.questionStates();

    const answerRequests = answers.map(question => {
      const correctIds = question.choices
        .filter(choice => choice.estCorrect)
        .map(choice => choice.id)
        .sort((a, b) => a - b);

      const selectedIds = [...question.selectedChoiceIds].sort((a, b) => a - b);

      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((selectedId, index) => selectedId === correctIds[index]);

      if (isCorrect) {
        score += 1;
      }

      return this.admissionApi.createReponse({
        estCorrect: isCorrect,
        scoreObtenu: isCorrect ? 1 : 0,
        question: { id: question.id },
        choixSelectionnes: selectedIds.map(id => ({ id })),
        sessionTest: { id: this.sessionId() }
      });
    });

    const endDate = new Date();
    const total = answers.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const durationSeconds = Math.floor((endDate.getTime() - this.startTime().getTime()) / 1000);

    // Execute all answer submissions in parallel, then update session
    Promise.all(answerRequests.map(req => req.toPromise()))
      .then(() => {
        const sessionUpdate = {
          dateDebut: this.startTime().toISOString(),
          dateFin: endDate.toISOString(),
          statut: 'TERMINEE',
          scoreTotal: score,
          pourcentage: percentage,
          tempsPasseSecondes: durationSeconds,
          qcm: { id: this.quiz().id }
        };
        
        return this.admissionApi.updateSessionTest(this.sessionId(), sessionUpdate).toPromise();
      })
      .then(() => {
        const resultCreate = {
          score,
          noteSur: total,
          pourcentage: percentage,
          datePublicationResultat: new Date().toISOString(),
          session: { id: this.sessionId() }
        };
        
        return this.admissionApi.createResultat(resultCreate).toPromise();
      })
      .then(() => {
        this.destroy$.next();
        this.destroy$.complete();
        this.attemptCompleted.emit({
          score,
          total,
          percentage,
          timeTaken: durationSeconds
        });
      })
      .catch(err => {
        console.error('Error submitting attempt:', err);
        this.isSubmitting.set(false);
      });
  }

  close(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.attemptClosed.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
