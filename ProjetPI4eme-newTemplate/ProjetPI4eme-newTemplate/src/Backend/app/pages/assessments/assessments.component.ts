import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, retry } from 'rxjs';
import { AppTabsComponent, type Tab } from '../../components/ui/tabs.component';
import { AppBadgeComponent } from '../../components/ui/badge.component';
import { AssessmentService, BackQcmDto, BackQuestionDto, BackResultatDto, BackSessionTestDto } from '../../services/assessment.service';
import { AdmissionAnalyticsComponent } from '../../components/analytics/admission-analytics.component';

interface Assessment {
  id: number;
  title: string;
  questions: number;
  duration: string;
  status: 'published' | 'draft';
  participants: number;
  avgScore: number;
}

interface Result {
  id: number;
  student: string;
  score: number;
}

interface EditableChoice {
  id?: number;
  contenu: string;
  estCorrect: boolean;
  ordre: number;
}

interface EditableQuestion {
  id?: number;
  contenu: string;
  choix: EditableChoice[];
}

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, AppTabsComponent, AppBadgeComponent, AdmissionAnalyticsComponent],
  templateUrl: './assessments.component.html',
  styleUrls: ['./assessments.component.scss']
})
export class AssessmentsComponent {
  private readonly assessmentService = inject(AssessmentService);

  activeTab = signal('quizzes');
  loading = signal(true);
  error = signal<string | null>(null);
  createOpen = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);
  createSuccess = signal<string | null>(null);
  manageOpen = signal(false);
  managing = signal(false);
  manageError = signal<string | null>(null);
  managedQuizId = signal<number | null>(null);
  
  tabs: Tab[] = [
    { id: 'quizzes', label: 'My Quizzes' },
    { id: 'results', label: 'Results' },
    { id: 'statistics', label: 'Statistics' }
  ];

  qcms = signal<BackQcmDto[]>([]);
  sessions = signal<BackSessionTestDto[]>([]);
  resultats = signal<BackResultatDto[]>([]);

  newQuizTitle = signal('');
  newQuizContent = signal('');
  newQuizType = signal<'QCM_SINGLE' | 'QCM_MULTI' | 'VRAI_FAUX'>('QCM_SINGLE');
  newQuizTarget = signal<'STUDENT' | 'CANDIDATE'>('STUDENT');
  newQuizDuration = signal(30);
  newQuizAttempts = signal(1);
  newQuizNoteMax = signal(20);
  publishNow = signal(true);
  createQuestions = signal<EditableQuestion[]>([]);

  editQuizTitle = signal('');
  editQuizContent = signal('');
  editQuizType = signal<'QCM_SINGLE' | 'QCM_MULTI' | 'VRAI_FAUX'>('QCM_SINGLE');
  editQuizTarget = signal<'STUDENT' | 'CANDIDATE'>('STUDENT');
  editQuizDuration = signal(30);
  editQuizAttempts = signal(1);
  editQuizNoteMax = signal(20);
  editPublishNow = signal(true);
  editQuestions = signal<EditableQuestion[]>([]);

  assessments = computed<Assessment[]>(() => {
    const qcms = this.qcms();
    const sessions = this.sessions();
    const resultats = this.resultats();

    return qcms.map((qcm) => {
      const qcmSessions = sessions.filter((session) => session.qcm?.id === qcm.id);
      const qcmResults = resultats.filter((result) => result.session?.qcm?.id === qcm.id);
      const avgScore = qcmResults.length > 0
        ? Math.round(qcmResults.reduce((sum, row) => sum + row.pourcentage, 0) / qcmResults.length)
        : 0;

      return {
        id: qcm.id,
        title: qcm.titre,
        questions: qcm.questions?.length ?? 0,
        duration: `${qcm.dureeMinutes ?? 0} min`,
        status: qcm.datePublication ? 'published' : 'draft',
        participants: qcmSessions.length,
        avgScore
      };
    });
  });

  results = computed<Result[]>(() => {
    const sorted = [...this.resultats()].sort((a, b) => b.id - a.id).slice(0, 8);
    return sorted.map((result) => ({
      id: result.id,
      student: `Session #${result.session?.id ?? '-'}`,
      score: Math.round(result.pourcentage)
    }));
  });

  passRate = computed(() => {
    const rows = this.resultats();
    if (rows.length === 0) return 0;
    const passed = rows.filter((result) => result.pourcentage >= 70).length;
    return Math.round((passed / rows.length) * 100);
  });

  testsCompleted = computed(() => this.sessions().filter((session) => session.statut === 'TERMINEE').length);

  averageScore = computed(() => {
    const rows = this.resultats();
    if (rows.length === 0) return 0;
    return Number((rows.reduce((sum, row) => sum + row.pourcentage, 0) / rows.length).toFixed(1));
  });

  constructor() {
    this.loadData();
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  openCreateQuiz(): void {
    this.createError.set(null);
    this.createSuccess.set(null);
    this.newQuizTitle.set('');
    this.newQuizContent.set('');
    this.newQuizType.set('QCM_SINGLE');
    this.newQuizTarget.set('STUDENT');
    this.newQuizDuration.set(30);
    this.newQuizAttempts.set(1);
    this.newQuizNoteMax.set(20);
    this.publishNow.set(true);
    this.createQuestions.set([
      {
        contenu: '',
        choix: [
          { contenu: '', estCorrect: false, ordre: 1 },
          { contenu: '', estCorrect: false, ordre: 2 }
        ]
      }
    ]);
    this.createOpen.set(true);
  }

  closeCreateQuiz(): void {
    this.createOpen.set(false);
    this.createError.set(null);
    this.createQuestions.set([]);
  }

  addCreateQuestion(): void {
    this.createQuestions.update((prev) => [
      ...prev,
      {
        contenu: '',
        choix: [
          { contenu: '', estCorrect: false, ordre: 1 },
          { contenu: '', estCorrect: false, ordre: 2 }
        ]
      }
    ]);
  }

  removeCreateQuestion(index: number): void {
    this.createQuestions.update((prev) => prev.filter((_, i) => i !== index));
  }

  updateCreateQuestionContent(index: number, value: string): void {
    this.createQuestions.update((prev) =>
      prev.map((question, i) => (i === index ? { ...question, contenu: value } : question))
    );
  }

  addCreateChoice(questionIndex: number): void {
    this.createQuestions.update((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          choix: [...question.choix, { contenu: '', estCorrect: false, ordre: question.choix.length + 1 }]
        };
      })
    );
  }

  removeCreateChoice(questionIndex: number, choiceIndex: number): void {
    this.createQuestions.update((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        const nextChoices = question.choix
          .filter((_, i) => i !== choiceIndex)
          .map((choice, i) => ({ ...choice, ordre: i + 1 }));
        return { ...question, choix: nextChoices };
      })
    );
  }

  updateCreateChoiceContent(questionIndex: number, choiceIndex: number, value: string): void {
    this.createQuestions.update((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        return {
          ...question,
          choix: question.choix.map((choice, cIndex) =>
            cIndex === choiceIndex ? { ...choice, contenu: value } : choice
          )
        };
      })
    );
  }

  setCreateChoiceCorrect(questionIndex: number, choiceIndex: number, checked: boolean): void {
    const quizType = this.newQuizType();
    this.createQuestions.update((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;

        if (quizType === 'QCM_SINGLE' || quizType === 'VRAI_FAUX') {
          return {
            ...question,
            choix: question.choix.map((choice, cIndex) => ({
              ...choice,
              estCorrect: cIndex === choiceIndex ? checked : false
            }))
          };
        }

        return {
          ...question,
          choix: question.choix.map((choice, cIndex) =>
            cIndex === choiceIndex ? { ...choice, estCorrect: checked } : choice
          )
        };
      })
    );
  }

  openManageQuiz(id: number): void {
    const quiz = this.qcms().find((row) => row.id === id);
    if (!quiz) {
      this.manageError.set('Quiz not found.');
      return;
    }

    this.managedQuizId.set(id);
    this.editQuizTitle.set(quiz.titre ?? '');
    this.editQuizContent.set(quiz.contenu ?? '');
    this.editQuizType.set((quiz.type as 'QCM_SINGLE' | 'QCM_MULTI' | 'VRAI_FAUX') ?? 'QCM_SINGLE');
    this.editQuizTarget.set((quiz.cible as 'STUDENT' | 'CANDIDATE') ?? 'STUDENT');
    this.editQuizDuration.set(quiz.dureeMinutes ?? 30);
    this.editQuizAttempts.set(quiz.tentativesMax ?? 1);
    this.editQuizNoteMax.set(quiz.noteMax ?? 20);
    this.editPublishNow.set(!!quiz.datePublication);
    this.editQuestions.set(
      (quiz.questions ?? []).map((question, questionIndex) => ({
        id: question.id,
        contenu: question.contenu ?? '',
        choix: (question.choix ?? []).map((choice, choiceIndex) => ({
          id: choice.id,
          contenu: choice.contenu ?? '',
          estCorrect: !!choice.estCorrect,
          ordre: choice.ordre ?? choiceIndex + 1
        }))
      }))
    );

    if (this.editQuestions().length === 0) {
      this.addQuestion();
    }

    this.manageError.set(null);
    this.createSuccess.set(null);
    this.manageOpen.set(true);
  }

  closeManageQuiz(): void {
    this.manageOpen.set(false);
    this.manageError.set(null);
    this.managedQuizId.set(null);
    this.editQuestions.set([]);
  }

  addQuestion(): void {
    this.editQuestions.update((prev) => [
      ...prev,
      {
        contenu: '',
        choix: [
          { contenu: '', estCorrect: false, ordre: 1 },
          { contenu: '', estCorrect: false, ordre: 2 }
        ]
      }
    ]);
  }

  removeQuestion(index: number): void {
    this.editQuestions.update((prev) => prev.filter((_, i) => i !== index));
  }

  updateQuestionContent(index: number, value: string): void {
    this.editQuestions.update((prev) =>
      prev.map((question, i) => (i === index ? { ...question, contenu: value } : question))
    );
  }

  addChoice(questionIndex: number): void {
    this.editQuestions.update((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          choix: [...question.choix, { contenu: '', estCorrect: false, ordre: question.choix.length + 1 }]
        };
      })
    );
  }

  removeChoice(questionIndex: number, choiceIndex: number): void {
    this.editQuestions.update((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        const nextChoices = question.choix
          .filter((_, i) => i !== choiceIndex)
          .map((choice, i) => ({ ...choice, ordre: i + 1 }));
        return { ...question, choix: nextChoices };
      })
    );
  }

  updateChoiceContent(questionIndex: number, choiceIndex: number, value: string): void {
    this.editQuestions.update((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        return {
          ...question,
          choix: question.choix.map((choice, cIndex) =>
            cIndex === choiceIndex ? { ...choice, contenu: value } : choice
          )
        };
      })
    );
  }

  setChoiceCorrect(questionIndex: number, choiceIndex: number, checked: boolean): void {
    const quizType = this.editQuizType();
    this.editQuestions.update((prev) =>
      prev.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;

        if (quizType === 'QCM_SINGLE' || quizType === 'VRAI_FAUX') {
          return {
            ...question,
            choix: question.choix.map((choice, cIndex) => ({
              ...choice,
              estCorrect: cIndex === choiceIndex ? checked : false
            }))
          };
        }

        return {
          ...question,
          choix: question.choix.map((choice, cIndex) =>
            cIndex === choiceIndex ? { ...choice, estCorrect: checked } : choice
          )
        };
      })
    );
  }

  saveManagedQuiz(): void {
    const id = this.managedQuizId();
    if (!id) {
      this.manageError.set('No quiz selected.');
      return;
    }

    const title = this.editQuizTitle().trim();
    const content = this.editQuizContent().trim();

    if (!title || !content) {
      this.manageError.set('Title and description are required.');
      return;
    }

    const normalizedQuestions = this.editQuestions()
      .map((question) => ({
        id: question.id,
        contenu: question.contenu.trim(),
        choix: question.choix
          .map((choice, index) => ({
            id: choice.id,
            contenu: choice.contenu.trim(),
            estCorrect: choice.estCorrect,
            ordre: index + 1
          }))
          .filter((choice) => !!choice.contenu)
      }))
      .filter((question) => !!question.contenu);

    if (normalizedQuestions.length === 0) {
      this.manageError.set('At least one question is required.');
      return;
    }

    const selectedType = this.editQuizType();
    for (const question of normalizedQuestions) {
      if (question.choix.length < 2) {
        this.manageError.set('Each question must have at least 2 choices.');
        return;
      }

      const correctCount = question.choix.filter((choice) => choice.estCorrect).length;
      if ((selectedType === 'QCM_SINGLE' || selectedType === 'VRAI_FAUX') && correctCount !== 1) {
        this.manageError.set('For QCM_SINGLE and VRAI_FAUX, each question must have exactly 1 correct choice.');
        return;
      }

      if (selectedType === 'QCM_MULTI' && correctCount < 1) {
        this.manageError.set('For QCM_MULTI, each question must have at least 1 correct choice.');
        return;
      }
    }

    this.managing.set(true);
    this.manageError.set(null);

    this.assessmentService
      .updateQcm(id, {
        titre: title,
        contenu: content,
        type: this.editQuizType(),
        cible: this.editQuizTarget(),
        dureeMinutes: this.editQuizDuration(),
        tentativesMax: this.editQuizAttempts(),
        noteMax: this.editQuizNoteMax(),
        datePublication: this.editPublishNow() ? new Date().toISOString() : undefined,
        questions: normalizedQuestions as BackQuestionDto[]
      })
      .subscribe({
        next: (updated) => {
          this.qcms.update((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
          this.manageOpen.set(false);
          this.managedQuizId.set(null);
          this.createSuccess.set(`Quiz "${updated.titre}" updated.`);
          this.managing.set(false);
        },
        error: () => {
          this.manageError.set('Failed to update quiz.');
          this.managing.set(false);
        }
      });
  }

  createQuiz(): void {
    const title = this.newQuizTitle().trim();
    const content = this.newQuizContent().trim();

    if (!title || !content) {
      this.createError.set('Title and description are required.');
      return;
    }

    const normalizedQuestions = this.createQuestions()
      .map((question) => ({
        id: question.id,
        contenu: question.contenu.trim(),
        choix: question.choix
          .map((choice, index) => ({
            id: choice.id,
            contenu: choice.contenu.trim(),
            estCorrect: choice.estCorrect,
            ordre: index + 1
          }))
          .filter((choice) => !!choice.contenu)
      }))
      .filter((question) => !!question.contenu);

    if (normalizedQuestions.length === 0) {
      this.createError.set('At least one question is required.');
      return;
    }

    const selectedType = this.newQuizType();
    for (const question of normalizedQuestions) {
      if (question.choix.length < 2) {
        this.createError.set('Each question must have at least 2 choices.');
        return;
      }

      const correctCount = question.choix.filter((choice) => choice.estCorrect).length;
      if ((selectedType === 'QCM_SINGLE' || selectedType === 'VRAI_FAUX') && correctCount !== 1) {
        this.createError.set('For QCM_SINGLE and VRAI_FAUX, each question must have exactly 1 correct choice.');
        return;
      }

      if (selectedType === 'QCM_MULTI' && correctCount < 1) {
        this.createError.set('For QCM_MULTI, each question must have at least 1 correct choice.');
        return;
      }
    }

    this.creating.set(true);
    this.createError.set(null);
    this.createSuccess.set(null);

    this.assessmentService
      .createQcm({
        titre: title,
        contenu: content,
        type: this.newQuizType(),
        cible: this.newQuizTarget(),
        dureeMinutes: this.newQuizDuration(),
        tentativesMax: this.newQuizAttempts(),
        noteMax: this.newQuizNoteMax(),
        datePublication: this.publishNow() ? new Date().toISOString() : undefined,
        questions: normalizedQuestions as BackQuestionDto[]
      })
      .subscribe({
        next: (created) => {
          this.qcms.update((prev) => [created, ...prev]);
          this.newQuizTitle.set('');
          this.newQuizContent.set('');
          this.newQuizType.set('QCM_SINGLE');
          this.newQuizTarget.set('STUDENT');
          this.newQuizDuration.set(30);
          this.newQuizAttempts.set(1);
          this.newQuizNoteMax.set(20);
          this.publishNow.set(true);
          this.createQuestions.set([]);
          this.createOpen.set(false);
          this.createSuccess.set(`Quiz "${created.titre}" created.`);
          this.creating.set(false);
        },
        error: () => {
          this.createError.set('Failed to create quiz.');
          this.creating.set(false);
        }
      });
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      qcms: this.assessmentService.getQcms().pipe(
        retry({ count: 2, delay: 400 }),
        catchError((error) => {
          console.error('Failed to load QCMs', error);
          return of([] as BackQcmDto[]);
        })
      ),
      sessions: this.assessmentService.getSessionTests().pipe(
        retry({ count: 2, delay: 400 }),
        catchError((error) => {
          console.error('Failed to load session tests', error);
          return of([] as BackSessionTestDto[]);
        })
      ),
      resultats: this.assessmentService.getResultats().pipe(
        retry({ count: 2, delay: 400 }),
        catchError((error) => {
          console.error('Failed to load results', error);
          return of([] as BackResultatDto[]);
        })
      )
    }).subscribe({
      next: ({ qcms, sessions, resultats }) => {
        this.qcms.set(qcms ?? []);
        this.sessions.set(sessions ?? []);
        this.resultats.set(resultats ?? []);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load assessments from backend', error);
        this.error.set('Failed to load assessments from backend.');
        this.loading.set(false);
      }
    });
  }
}

