import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClassroomDto, GestionCoursApiService } from '../../core/gestion-cours/gestion-cours-api.service';

@Component({
  selector: 'app-classrooms-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './classrooms-management.component.html',
  styleUrls: ['./classrooms-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassroomsManagementComponent implements OnInit {
  private readonly api = inject(GestionCoursApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs = [
    { label: 'Courses', link: '/back/courses' },
    { label: 'Classrooms', link: '/back/courses/classrooms' },
    { label: 'Sessions', link: '/back/courses/sessions' },
    { label: 'Bookings', link: '/back/courses/bookings' }
  ] as const;

  readonly classrooms = signal<ClassroomDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly filteredClassrooms = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.classrooms().filter((classroom) => {
      if (!query) return true;
      return (
        classroom.name.toLowerCase().includes(query) ||
        classroom.type.toLowerCase().includes(query) ||
        String(classroom.capacity).includes(query) ||
        (classroom.featuresDescription ?? '').toLowerCase().includes(query)
      );
    });
  });

  readonly totalCount = computed(() => this.classrooms().length);
  readonly premiumCount = computed(() => this.classrooms().filter((classroom) => classroom.type === 'PREMIUM').length);
  readonly meetingCount = computed(() => this.classrooms().filter((classroom) => classroom.type === 'MEETING').length);

  ngOnInit(): void {
    this.loadClassrooms();
  }

  loadClassrooms(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.listClassrooms().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (classrooms) => {
        this.classrooms.set(classrooms);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load classrooms', err);
        this.classrooms.set([]);
        this.error.set('Unable to load classrooms from GestionCours.');
        this.loading.set(false);
      }
    });
  }

  createClassroom(): void {
    void this.router.navigate(['/back/courses/classrooms/create']);
  }

  editClassroom(classroom: ClassroomDto): void {
    void this.router.navigate(['/back/courses/classrooms/create'], { queryParams: { id: classroom.id } });
  }

  deleteClassroom(classroom: ClassroomDto): void {
    if (!confirm(`Delete classroom ${classroom.name}?`)) {
      return;
    }

    this.api.deleteClassroom(classroom.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadClassrooms(),
      error: (err) => {
        console.error('Failed to delete classroom', err);
        this.error.set('Unable to delete the classroom.');
      }
    });
  }
}
