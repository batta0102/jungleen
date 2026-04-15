import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { AdmissionApiService, QcmDto, QuestionDto, ChoiceDto } from '../../../core/services/admission-api.service';
import { inject } from '@angular/core';

interface ReviewQuestion {
  id: number;
  content: string;
  choices: ChoiceDto[];
  selectedChoiceIds: readonly number[];
  isCorrect: boolean;
}

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-results.component.html',
  styleUrl: './quiz-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizResultsComponent {
  private readonly admissionApi = inject(AdmissionApiService);

  readonly quiz = input.required<QcmDto>();
  readonly score = input.required<number>();
  readonly total = input.required<number>();
  readonly percentage = input.required<number>();
  readonly timeTaken = input.required<number>();
  readonly sessionId = input.required<number>();
  
  readonly closed = output<void>();

  readonly reviewQuestions = computed(() => {
    const questions = this.quiz().questions ?? [];
    return questions.map((q, idx) => {
      const correctIds = (q.choix ?? [])
        .filter(c => c.estCorrect)
        .map(c => c.id)
        .sort((a, b) => a - b);

      // This is placeholder - in real app, would fetch actual responses from backend
      return {
        id: q.id,
        content: q.contenu,
        choices: (q.choix ?? []).sort((a, b) => a.ordre - b.ordre),
        selectedChoiceIds: [] as number[],
        isCorrect: false
      };
    });
  });

  readonly gradeLetter = computed(() => {
    const pct = this.percentage();
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  });

  readonly gradeColor = computed(() => {
    const pct = this.percentage();
    if (pct >= 80) return 'success';
    if (pct >= 60) return 'warning';
    return 'danger';
  });

  readonly expandedQuestion = signal<number | null>(null);

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  toggleQuestion(questionId: number): void {
    if (this.expandedQuestion() === questionId) {
      this.expandedQuestion.set(null);
    } else {
      this.expandedQuestion.set(questionId);
    }
  }

  close(): void {
    this.closed.emit();
  }

  getChoiceLabel(choice: ChoiceDto): string[] {
    const labels: string[] = [];
    if (choice.estCorrect) {
      labels.push('correct');
    }
    return labels;
  }
}
