import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseKind, CourseLevel, GestionCoursApiService, OnSiteCourseDto } from '../../core/gestion-cours/gestion-cours-api.service';

interface CourseFormModel {
  title: string;
  description: string;
  level: CourseLevel;
  tutorId: number;
  classroomName: string;
}

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseFormComponent implements OnInit {
  private readonly api = inject(GestionCoursApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs = [
    { label: 'Courses', link: '/back/courses' },
    { label: 'Classrooms', link: '/back/courses/classrooms' },
    { label: 'Sessions', link: '/back/courses/sessions' },
    { label: 'Bookings', link: '/back/courses/bookings' }
  ] as const;

  readonly levels: CourseLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  readonly tutorOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'create' | 'edit'>('create');
  readonly kind = signal<CourseKind>('ONLINE');
  readonly courseId = signal<number | null>(null);
  readonly form = signal<CourseFormModel>({
    title: '',
    description: '',
    level: 'A1',
    tutorId: 1,
    classroomName: ''
  });

  readonly headerTitle = computed(() => (this.mode() === 'create' ? 'Create Course' : 'Edit Course'));
  readonly submitLabel = computed(() => (this.saving() ? 'Saving...' : this.mode() === 'create' ? 'Create course' : 'Update course'));
  readonly isOnSite = computed(() => this.kind() === 'ONSITE');

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const kindParam = params.get('kind')?.toUpperCase();
      const idParam = params.get('id');

      if (kindParam === 'ONSITE' || kindParam === 'ONLINE') {
        this.kind.set(kindParam as CourseKind);
      }

      if (idParam) {
        const parsedId = Number(idParam);
        if (Number.isFinite(parsedId)) {
          this.courseId.set(parsedId);
          this.mode.set('edit');
          this.loadCourse(parsedId);
          return;
        }
      }

      this.courseId.set(null);
      this.mode.set('create');
      this.loading.set(false);
      this.error.set(null);
      this.form.set({
        title: '',
        description: '',
        level: 'A1',
        tutorId: 1,
        classroomName: ''
      });
    });
  }

  onKindChange(nextKind: CourseKind): void {
    this.kind.set(nextKind);
    if (nextKind === 'ONLINE') {
      this.form.update((current) => ({ ...current, classroomName: '' }));
    }
  }

  save(): void {
    const form = this.form();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      level: form.level,
      tutorId: Number(form.tutorId)
    };

    if (!payload.title) {
      this.error.set('Title is required.');
      return;
    }

    if (!Number.isFinite(payload.tutorId) || payload.tutorId <= 0) {
      this.error.set('Tutor id must be a positive number.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const request = this.kind() === 'ONLINE'
      ? this.mode() === 'create'
        ? this.api.createOnlineCourse(payload)
        : this.api.updateOnlineCourse(this.courseId() ?? 0, payload)
      : this.mode() === 'create'
        ? this.api.createOnSiteCourse({ ...payload, classroomName: form.classroomName.trim() })
        : this.api.updateOnSiteCourse(this.courseId() ?? 0, { ...payload, classroomName: form.classroomName.trim() });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/back/courses']);
      },
      error: (err) => {
        console.error('Failed to save course', err);
        this.error.set('Unable to save the course. Check the GestionCours backend and try again.');
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    void this.router.navigate(['/back/courses']);
  }

  setTitle(value: string): void {
    this.form.update((current) => ({ ...current, title: value }));
  }

  setDescription(value: string): void {
    this.form.update((current) => ({ ...current, description: value }));
  }

  setLevel(value: CourseLevel): void {
    this.form.update((current) => ({ ...current, level: value }));
  }

  setTutorId(value: string | number): void {
    const parsed = Number(value);
    this.form.update((current) => ({ ...current, tutorId: Number.isFinite(parsed) ? parsed : 0 }));
  }

  setClassroomName(value: string): void {
    this.form.update((current) => ({ ...current, classroomName: value }));
  }

  private loadCourse(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    const request = this.kind() === 'ONLINE' ? this.api.getOnlineCourseById(id) : this.api.getOnSiteCourseById(id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (course) => {
        this.loading.set(false);
        if (!course) {
          this.error.set('Course not found.');
          return;
        }

        this.form.set({
          title: course.title ?? '',
          description: course.description ?? '',
          level: course.level,
          tutorId: course.tutorId,
          classroomName: this.kind() === 'ONSITE' ? (course as OnSiteCourseDto).classroomName ?? '' : ''
        });
      },
      error: (err) => {
        console.error('Failed to load course', err);
        this.error.set('Unable to load the selected course.');
        this.loading.set(false);
      }
    });
  }
}
