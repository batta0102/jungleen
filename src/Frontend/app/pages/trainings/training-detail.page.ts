import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';

import { DataService } from '../../core/data/data.service';
import { TrainingModel, TrainingSection } from '../../core/data/models';
import { EnrollmentMode, UserContextService } from '../../core/user/user-context.service';
import { downloadTextFile } from '../../shared/utils/download';
import { CourseApiService } from '../../../../core/api/services/course-api.service';

function courseToTraining(c: { id: string | number; title: string; instructor?: string }): TrainingModel {
  return {
    id: String(c.id),
    name: c.title,
    learningObjectives: [c.instructor].filter(Boolean),
    chapters: []
  };
}

/** Fallback for demo courses when API is not available (same ids as SAMPLE_COURSES on list page). */
const DEMO_TRAININGS: Record<string, TrainingModel> = {
  'demo-1': courseToTraining({ id: 'demo-1', title: 'A2 Foundations', instructor: 'Dr. Sarah Martin' }),
  'demo-2': courseToTraining({ id: 'demo-2', title: 'B1 Business English', instructor: 'Prof. Jean Dubois' }),
  'demo-3': courseToTraining({ id: 'demo-3', title: 'B2 Conversation & Debate', instructor: 'Dr. Alice Chen' }),
  'demo-4': courseToTraining({ id: 'demo-4', title: 'C1 Advanced Writing', instructor: 'Dr. Mark Lee' }),
  'demo-5': courseToTraining({ id: 'demo-5', title: 'IELTS Preparation', instructor: 'Dr. Sarah Martin' }),
  'demo-6': courseToTraining({ id: 'demo-6', title: 'English for Beginners (A1)', instructor: 'Dr. Alice Chen' }),
};

@Component({
  selector: 'app-training-detail-page',
  imports: [ReactiveFormsModule],
  templateUrl: './training-detail.page.html',
  styleUrl: './training-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly data = inject(DataService);
  private readonly user = inject(UserContextService);
  private readonly fb = inject(FormBuilder);
  private readonly courseApi = inject(CourseApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly trainingId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('trainingId') ?? '')),
    { initialValue: '' }
  );

  readonly apiCourse = signal<TrainingModel | null>(null);

  constructor() {
    effect(() => {
      const id = this.trainingId();
      this.apiCourse.set(null);
      if (!id) return;
      if (this.data.getTrainingById(id)) return;
      if (id.startsWith('demo-') && DEMO_TRAININGS[id]) {
        this.apiCourse.set(DEMO_TRAININGS[id]);
        return;
      }
      this.courseApi
        .getCourseById(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (course) => this.apiCourse.set(courseToTraining(course)),
          error: () => this.apiCourse.set(null)
        });
    });
  }

  readonly training = computed<TrainingModel | undefined>(() => {
    const id = this.trainingId();
    return this.data.getTrainingById(id) ?? this.apiCourse() ?? undefined;
  });
  readonly role = this.user.role;
  readonly enrolled = computed(() => this.user.participation().enrolledTrainingIds.includes(this.trainingId()));
  readonly enrollmentMode = computed(() => {
    const id = this.trainingId();
    if (!id) return null;
    return this.user.getEnrollmentMode(id);
  });

  readonly expandedSectionKey = signal<string | null>(null);
  readonly showCertificate = signal(false);

  readonly progress = computed(() => {
    const t = this.training();
    if (!t) return { completed: 0, total: 0, percent: 0 };
    const total = t.chapters.reduce((acc, ch) => acc + ch.sections.length, 0);
    const completed = t.chapters.reduce(
      (acc, ch) =>
        acc + ch.sections.filter((s) => this.data.isSectionComplete(t.id, ch.id, s.id)).length,
      0
    );
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  });

  readonly tutorChapterForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  readonly tutorSectionForm = this.fb.group({
    chapterId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3)]]
    ,
    objective: ['', [Validators.required, Validators.minLength(5)]],
    hasVideo: [true],
    hasText: [true],
    hasQuiz: [false]
  });

  back(): void {
    void this.router.navigate(['/front/trainings']);
  }

  toggleSection(tid: string, chapterId: string, sectionId: string, checked: boolean): void {
    this.data.setSectionComplete(tid, chapterId, sectionId, checked);
  }

  toggleContent(trainingId: string, chapterId: string, sectionId: string): void {
    const key = `${trainingId}:${chapterId}:${sectionId}`;
    this.expandedSectionKey.set(this.expandedSectionKey() === key ? null : key);
  }

  isExpanded(trainingId: string, chapterId: string, sectionId: string): boolean {
    return this.expandedSectionKey() === `${trainingId}:${chapterId}:${sectionId}`;
  }

  enroll(mode: EnrollmentMode): void {
    const id = this.trainingId();
    if (!id) return;
    this.user.enrollTraining(id, mode);
  }

  toggleCertificateView(): void {
    this.showCertificate.update((prev) => !prev);
  }

  pricesTnd(): { online: number; onsite: number } {
    const t = this.training();
    if (!t) return { online: 0, onsite: 0 };
    const raw = `${t.id} ${t.name}`.toLowerCase();
    const level: 'beginner' | 'intermediate' | 'advanced' =
      raw.includes('c1') || raw.includes('c2')
        ? 'advanced'
        : raw.includes('b1') || raw.includes('b2')
          ? 'intermediate'
          : 'beginner';

    const online = level === 'beginner' ? 450 : level === 'intermediate' ? 650 : 850;
    return { online, onsite: online + 150 };
  }

  certificateContent(): string {
    const t = this.training();
    if (!t) return '';
    const { percent } = this.progress();
    const date = new Date().toISOString().slice(0, 10);
    return `Jungle in English\n\nCertificate of Completion\n\nThis certifies that the learner has completed:\n${t.name}\n\nProgress: ${percent}%\n\nIssued on: ${date}\n`;
  }

  downloadCertificate(): void {
    const t = this.training();
    if (!t) return;
    downloadTextFile(`certificate-${t.id}.txt`, this.certificateContent());
  }

  addChapter(): void {
    const t = this.training();
    if (!t) return;
    if (this.tutorChapterForm.invalid) {
      this.tutorChapterForm.markAllAsTouched();
      return;
    }
    this.data.addTrainingChapter(t.id, this.tutorChapterForm.value.title ?? '');
    this.tutorChapterForm.reset();
  }

  addSection(): void {
    const t = this.training();
    if (!t) return;
    if (this.tutorSectionForm.invalid) {
      this.tutorSectionForm.markAllAsTouched();
      return;
    }
    const chapterId = this.tutorSectionForm.value.chapterId ?? '';
    const title = this.tutorSectionForm.value.title ?? '';
    const objective = this.tutorSectionForm.value.objective ?? '';
    const contentTypes: TrainingSection['contentTypes'] = [];
    if (this.tutorSectionForm.value.hasVideo) contentTypes.push('video');
    if (this.tutorSectionForm.value.hasText) contentTypes.push('text');
    if (this.tutorSectionForm.value.hasQuiz) contentTypes.push('quiz');
    this.data.addTrainingSection(t.id, chapterId, title, objective, contentTypes);
    this.tutorSectionForm.patchValue({ title: '', objective: '' });
  }
}
