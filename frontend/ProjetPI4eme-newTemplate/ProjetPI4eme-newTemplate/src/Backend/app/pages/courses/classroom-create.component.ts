import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClassroomRequest, ClassroomType, GestionCoursApiService } from '../../core/gestion-cours/gestion-cours-api.service';

interface ClassroomFormModel {
  name: string;
  capacity: number;
  type: ClassroomType;
  featuresDescription: string;
  sketchfabModelUid: string;
}

@Component({
  selector: 'app-classroom-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './classroom-create.component.html',
  styleUrls: ['./classroom-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassroomCreateComponent implements OnInit {
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

  readonly types: ClassroomType[] = ['STANDARD', 'PREMIUM', 'MEETING'];
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'create' | 'edit'>('create');
  readonly classroomId = signal<number | null>(null);
  readonly form = signal<ClassroomFormModel>({
    name: '',
    capacity: 20,
    type: 'STANDARD',
    featuresDescription: '',
    sketchfabModelUid: ''
  });

  readonly headerTitle = computed(() => (this.mode() === 'create' ? 'Create Classroom' : 'Edit Classroom'));
  readonly submitLabel = computed(() => (this.saving() ? 'Saving...' : this.mode() === 'create' ? 'Create classroom' : 'Update classroom'));

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const parsedId = Number(idParam);
        if (Number.isFinite(parsedId)) {
          this.classroomId.set(parsedId);
          this.mode.set('edit');
          this.loadClassroom(parsedId);
          return;
        }
      }

      this.classroomId.set(null);
      this.mode.set('create');
      this.form.set({
        name: '',
        capacity: 20,
        type: 'STANDARD',
        featuresDescription: '',
        sketchfabModelUid: ''
      });
      this.loading.set(false);
      this.error.set(null);
    });
  }

  save(): void {
    const form = this.form();
    const payload: ClassroomRequest = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      type: form.type,
      featuresDescription: form.featuresDescription.trim(),
      sketchfabModelUid: form.sketchfabModelUid.trim()
    };

    if (!payload.name) {
      this.error.set('Classroom name is required.');
      return;
    }

    if (!Number.isFinite(payload.capacity) || payload.capacity <= 0) {
      this.error.set('Capacity must be a positive number.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const request = this.mode() === 'create'
      ? this.api.createClassroom(payload)
      : this.api.updateClassroom(this.classroomId() ?? 0, payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/back/courses/classrooms']);
      },
      error: (err) => {
        console.error('Failed to save classroom', err);
        this.error.set('Unable to save the classroom.');
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    void this.router.navigate(['/back/courses/classrooms']);
  }

  setName(value: string): void {
    this.form.update((current) => ({ ...current, name: value }));
  }

  setCapacity(value: string | number): void {
    const parsed = Number(value);
    this.form.update((current) => ({ ...current, capacity: Number.isFinite(parsed) ? parsed : 0 }));
  }

  setType(value: ClassroomType): void {
    this.form.update((current) => ({ ...current, type: value }));
  }

  setFeaturesDescription(value: string): void {
    this.form.update((current) => ({ ...current, featuresDescription: value }));
  }

  setSketchfabModelUid(value: string): void {
    this.form.update((current) => ({ ...current, sketchfabModelUid: value }));
  }

  private loadClassroom(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.listClassrooms().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (classrooms) => {
        const classroom = classrooms.find((item) => item.id === id);
        this.loading.set(false);
        if (!classroom) {
          this.error.set('Classroom not found.');
          return;
        }

        this.form.set({
          name: classroom.name ?? '',
          capacity: classroom.capacity ?? 20,
          type: classroom.type ?? 'STANDARD',
          featuresDescription: classroom.featuresDescription ?? '',
          sketchfabModelUid: classroom.sketchfabModelUid ?? ''
        });
      },
      error: (err) => {
        console.error('Failed to load classroom', err);
        this.error.set('Unable to load the selected classroom.');
        this.loading.set(false);
      }
    });
  }
}
