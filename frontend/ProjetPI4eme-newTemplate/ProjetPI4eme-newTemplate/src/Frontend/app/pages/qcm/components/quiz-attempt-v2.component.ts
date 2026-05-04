import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdmissionApiService, ChoiceDto, QcmDto, QuestionDto } from '../../../core/services/admission-api.service';
import { QuizIntegrityService, QuizIntegrityAlert } from '../../../core/services/quiz-integrity.service';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification.component';

interface QuestionState {
  id: number;
  ordre: number;
  content: string;
  choices: ChoiceDto[];
  selectedChoiceIds: number[];
  answered: boolean;
}

@Component({
  selector: 'app-quiz-attempt',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent],
  templateUrl: './quiz-attempt-v2.component.html',
  styleUrl: './quiz-attempt-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizAttemptComponent implements OnInit, OnDestroy {
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly quizIntegrity = inject(QuizIntegrityService);
  
  readonly quiz = input.required<QcmDto>();
  readonly sessionId = input.required<number>();
  readonly startTime = input.required<Date>();
  
  readonly attemptCompleted = output<{
    score: number;
    total: number;
    percentage: number;
    timeTaken: number;
    cheatingDetected: boolean;
  }>();
  
  readonly attemptClosed = output<void>();

  readonly questionStates = signal<QuestionState[]>([]);
  readonly currentQuestionIndex = signal(0);
  readonly timeRemaining = signal(0);
  readonly timePercentage = computed(() => {
    const total = (this.quiz().dureeMinutes || 30) * 60;
    return Math.max(0, Math.min(100, (this.timeRemaining() / total) * 100));
  });
  readonly isTimeWarning = computed(() => this.timeRemaining() <= 300);
  readonly isTimeCritical = computed(() => this.timeRemaining() <= 60);
  readonly showConfirmSubmit = signal(false);
  readonly isSubmitting = signal(false);

  readonly currentQuestion = computed(() => {
    const states = this.questionStates();
    const idx = this.currentQuestionIndex();
    return states[idx] ?? null;
  });

  readonly canGoPrevious = computed(() => this.currentQuestionIndex() > 0);
  readonly canGoNext = computed(() => this.currentQuestionIndex() < this.questionStates().length - 1);
  readonly allAnswered = computed(() => 
    this.questionStates().every(q => q.selectedChoiceIds.length > 0)
  );

  readonly answeredCount = computed(() => 
    this.questionStates().filter(q => q.answered).length
  );

  // Tab switching & integrity tracking
  readonly toastMessage = signal('');
  readonly toastType = signal<'warning' | 'critical' | 'info' | 'success'>('info');
  readonly toastVisible = signal(false);
  readonly toastDuration = signal(5000);
  
  private autoSubmitTriggered = false;
  private integrityViolation = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeQuestions();
    this.initializeQuizIntegrity();
    this.setupIntegrityAlertListener();
    this.startTimer();
  }

  /**
   * Initialize quiz integrity tracking (tab switching detection)
   */
  private initializeQuizIntegrity(): void {
    // Get user info from mock auth (for development)
    const userId = localStorage.getItem('jie_userId') || 'dev-user-123';
    
    this.quizIntegrity.initializeQuizTracking(
      this.sessionId(),
      userId,
      this.quiz().id
    );

    console.log('🛡️ Quiz integrity tracking initialized');
  }

  /**
   * Setup listener for integrity alerts
   */
  private setupIntegrityAlertListener(): void {
    // Subscribe to integrity alerts from the service
    this.quizIntegrity.integrityAlert
      .pipe(takeUntil(this.destroy$))
      .subscribe((alert: QuizIntegrityAlert) => {
        console.log('📢 [COMPONENT] Received integrity alert:', alert.type, alert.message);
        this.showToast(alert.message, alert.type, alert.type === 'critical' ? 3000 : 5000);

        // On critical alert (2nd tab switch), force submit
        if (alert.type === 'critical' && !this.autoSubmitTriggered) {
          this.autoSubmitTriggered = true;
          this.integrityViolation = true;
          console.error('🚨 [COMPONENT] CRITICAL ALERT - SCHEDULING AUTO-SUBMIT');
          setTimeout(() => {
            console.error('🚨 [COMPONENT] TIMEOUT FIRED - CALLING submitAttempt DIRECTLY');
            this.showConfirmSubmit.set(false);
            this.submitAttempt();
          }, 1000);
        }
      });
  }

  /**
   * Force submit quiz without any guards
   */
  private forceSubmitQuiz(): void {
    console.error('💥 [COMPONENT] FORCE SUBMITTING - NO GUARDS - CALL submitAttempt');
    this.submitAttempt();
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: 'warning' | 'critical' | 'info' | 'success' = 'info', duration = 5000): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastDuration.set(duration);
    this.toastVisible.set(true);

    // Auto-hide after duration
    setTimeout(() => {
      this.toastVisible.set(false);
    }, duration);
  }

  /**
   * Handle toast close
   */
  closeToast(): void {
    this.toastVisible.set(false);
  }

  private initializeQuestions(): void {
    const questions = this.quiz().questions ?? [];
    console.log('🎯 INITIALIZING QUIZ:', {
      quizTitle: this.quiz().titre,
      totalQuestions: questions.length,
      quizType: this.quiz().type,
      fullQuizData: this.quiz()
    });

    const states: QuestionState[] = questions.map((q, qIndex) => {
      const choices = (q.choix ?? []).sort((a, b) => a.ordre - b.ordre);
      const state: QuestionState = {
        id: q.id,
        ordre: qIndex,
        content: q.contenu,
        choices: choices,
        selectedChoiceIds: [],
        answered: false
      };
      console.log(`✍️ Question ${qIndex + 1}:`, {
        questionId: q.id,
        content: q.contenu.substring(0, 50),
        choicesCount: choices.length,
        choicesData: choices.map(c => ({
          id: c.id,
          contenu: c.contenu,
          estCorrect: c.estCorrect,
          estCorrectType: typeof c.estCorrect,
          estCorrectValue: JSON.stringify(c.estCorrect)
        })),
        rawQuestionData: q
      });
      
      if (choices.length === 0) {
        console.warn(`⚠️ WARNING: Question ${qIndex + 1} has NO choices!`, {
          questionId: q.id,
          choixIsNull: q.choix === null,
          choixIsUndefined: q.choix === undefined,
          choixValue: q.choix
        });
      }
      
      return state;
    });

    this.questionStates.set(states);
    console.log('✅ All questions initialized:', this.questionStates());
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

  toggleChoice(choiceId: number): void {
    console.log('🖱️ toggleChoice called:', { choiceId, currentQIdx: this.currentQuestionIndex() });

    const quizType = this.quiz().type;
    const currentIdx = this.currentQuestionIndex();

    this.questionStates.update(states => {
      return states.map((q, idx) => {
        if (idx !== currentIdx) {
          return q;
        }

        let nextSelected: number[];

        if (quizType === 'QCM_MULTI') {
          // Checkbox: toggle on/off
          if (q.selectedChoiceIds.includes(choiceId)) {
            nextSelected = q.selectedChoiceIds.filter(cid => cid !== choiceId);
          } else {
            nextSelected = [...q.selectedChoiceIds, choiceId];
          }
        } else {
          // Radio: single selection
          if (q.selectedChoiceIds.includes(choiceId)) {
            nextSelected = [];
          } else {
            nextSelected = [choiceId];
          }
        }

        const updated = {
          ...q,
          selectedChoiceIds: nextSelected,
          answered: nextSelected.length > 0
        };

        console.log('✏️ Question updated:', {
          questionId: q.id,
          previousSelected: q.selectedChoiceIds,
          newSelected: nextSelected,
          answered: updated.answered
        });

        return updated;
      });
    });
  }

  isChoiceSelected(choiceId: number): boolean {
    const current = this.currentQuestion();
    if (!current) return false;
    const isSelected = current.selectedChoiceIds.includes(choiceId);
    return isSelected;
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

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  openConfirmSubmit(): void {
    console.log('🔍 Submit clicked:', {
      allAnswered: this.allAnswered(),
      answeredCount: this.answeredCount(),
      totalQuestions: this.questionStates().length
    });
    this.showConfirmSubmit.set(true);
  }

  cancelSubmit(): void {
    this.showConfirmSubmit.set(false);
  }

  submitAttempt(): void {
    console.error('📤 [submitAttempt] CALLED - Starting submission process');
    
    this.showConfirmSubmit.set(false);
    this.isSubmitting.set(true);

    let score = 0;
    const answers = this.questionStates();

    const answerRequests = answers.map(question => {
      console.log('🔍 Debugging question choices:', {
        questionId: question.id,
        allChoices: question.choices.map(c => ({ 
          id: c.id, 
          contenu: c.contenu, 
          estCorrect: c.estCorrect,
          estCorrectType: typeof c.estCorrect,
          estCorrectValue: JSON.stringify(c.estCorrect)
        }))
      });

      const correctIds = question.choices
        .filter(choice => {
          // Handle multiple possible types for estCorrect
          const estCorrectValue = choice.estCorrect;
          let isCorrect = false;
          
          if (typeof estCorrectValue === 'boolean') {
            isCorrect = estCorrectValue === true;
          } else if (typeof estCorrectValue === 'string') {
            isCorrect = estCorrectValue === 'true' || estCorrectValue === '1';
          } else if (typeof estCorrectValue === 'number') {
            isCorrect = estCorrectValue === 1;
          }
          
          console.log('🔍 Choice filter check:', {
            choiceId: choice.id,
            choiceContenu: choice.contenu,
            estCorrectRaw: choice.estCorrect,
            estCorrectType: typeof choice.estCorrect,
            isCorrect
          });
          return isCorrect;
        })
        .map(choice => choice.id)
        .sort((a, b) => a - b);

      // FALLBACK: If no correct choices found, use the first choice as correct
      if (correctIds.length === 0 && question.choices.length > 0) {
        console.warn('⚠️ No correct choices found, using first choice as fallback:', {
          questionId: question.id,
          firstChoiceId: question.choices[0].id,
          firstChoiceContenu: question.choices[0].contenu
        });
        correctIds.push(question.choices[0].id);
      }

      const selectedIds = [...question.selectedChoiceIds].sort((a, b) => a - b);

      console.log('🔍 IDs comparison:', {
        questionId: question.id,
        selectedIds,
        correctIds,
        selectedCount: selectedIds.length,
        correctCount: correctIds.length,
        selectedChoiceIdsRaw: question.selectedChoiceIds
      });

      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((selectedId, index) => selectedId === correctIds[index]);

      if (isCorrect) {
        score += 1;
      }

      console.log('📊 Question evaluation:', {
        questionId: question.id,
        selectedIds,
        correctIds,
        isCorrect,
        hasCorrectChoices: correctIds.length > 0
      });

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
    const finalScore = this.integrityViolation ? 0 : score;
    const finalPercentage = this.integrityViolation ? 0 : percentage;
    const finalStatut = this.integrityViolation ? 'ANNULEE' : 'TERMINEE';
    const durationSeconds = Math.floor((endDate.getTime() - this.startTime().getTime()) / 1000);

    console.log('📤 Submitting quiz:', {
      score: finalScore,
      total,
      percentage: finalPercentage,
      durationSeconds,
      integrityViolation: this.integrityViolation
    });

    // Use forkJoin to wait for all responses to be created
    forkJoin(answerRequests).subscribe({
      next: () => {
        // All responses created successfully, now update session
        console.log('📤 All responses submitted, now updating session...');
        
        const sessionUpdate: any = {
          dateDebut: this.startTime().toISOString(),
          dateFin: endDate.toISOString(),
          statut: finalStatut,
          scoreTotal: finalScore,
          pourcentage: finalPercentage,
          tempsPasseSecondes: durationSeconds
        };
        
        console.log('📤 Session update payload:', sessionUpdate);
        
        this.admissionApi.updateSessionTest(this.sessionId(), sessionUpdate).subscribe({
          next: (updateResponse) => {
            console.log('✅ Session updated successfully:', updateResponse);
            // Session updated, now create result
            const resultCreate = {
              score: finalScore,
              noteSur: total,
              pourcentage: finalPercentage,
              datePublicationResultat: new Date().toISOString(),
              session: { id: this.sessionId() }
            };
            
            this.admissionApi.createResultat(resultCreate).subscribe({
              next: () => {
                console.log('✅ Quiz submitted successfully!', {
                  score: finalScore,
                  total,
                  percentage: finalPercentage,
                  integrityViolation: this.integrityViolation
                });
                this.destroy$.next();
                this.destroy$.complete();
                this.attemptCompleted.emit({
                  score: finalScore,
                  total,
                  percentage: finalPercentage,
                  timeTaken: durationSeconds,
                  cheatingDetected: this.integrityViolation
                });
              },
              error: (err) => {
                console.error('❌ Error creating result:', err);
                this.isSubmitting.set(false);
              }
            });
          },
          error: (err: any) => {
            console.error('❌ Error updating session:', err);
            console.error('❌ Status:', err.status);
            console.error('❌ Status Text:', err.statusText);
            console.error('❌ Error Body:', err.error);
            console.error('❌ Full Error:', JSON.stringify(err, null, 2));
            this.isSubmitting.set(false);
            alert('Failed to update session: ' + (err.error?.message || err.statusText || 'Unknown error'));
          }
        });
      },
      error: (err) => {
        console.error('❌ Error submitting responses:', err);
        this.isSubmitting.set(false);
      }
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
    this.quizIntegrity.cleanup();
  }
}
