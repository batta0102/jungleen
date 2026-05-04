import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CourseKind,
  CourseLevel,
  GestionCoursApiService,
  OnlineCourseDto,
  OnSiteCourseDto
} from '../../core/gestion-cours/gestion-cours-api.service';

type CourseType = 'Online' | 'On-Site';

interface CourseRow {
  id: number;
  kind: CourseKind;
  title: string;
  level: CourseLevel;
  type: CourseType;
  description: string;
  classroom: string;
  tutorId: number;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursesComponent implements OnInit {
  private readonly api = inject(GestionCoursApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs = [
    { id: 'courses', label: 'Courses', link: '/back/courses' },
    { id: 'classrooms', label: 'Classrooms', link: '/back/courses/classrooms' },
    { id: 'sessions', label: 'Sessions', link: '/back/courses/sessions' },
    { id: 'bookings', label: 'Bookings', link: '/back/courses/bookings' }
  ] as const;

  readonly pageSize = 2;
  readonly page = signal(1);
  readonly activeTab = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly levelFilter = signal('all');
  readonly typeFilter = signal<'all' | CourseType>('all');
  readonly sortBy = signal<'title-asc'>('title-asc');
  readonly courses = signal<CourseRow[]>([]);

  readonly router = inject(Router);

  ngOnInit(): void {
    this.loadCourses();
  }

  readonly filteredCourses = computed(() => {
    const query = this.search().trim().toLowerCase();
    const level = this.levelFilter();
    const type = this.typeFilter();

    const filtered = this.courses().filter((course) => {
      const matchesQuery =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        String(course.tutorId).includes(query);

      const matchesLevel = level === 'all' || course.level === level;
      const matchesType = type === 'all' || course.type === type;

      return matchesQuery && matchesLevel && matchesType;
    });

    if (this.sortBy() === 'title-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredCourses().length / this.pageSize)));

  readonly pagedCourses = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredCourses().slice(start, start + this.pageSize);
  });

  readonly totalCourses = computed(() => this.courses().length);
  readonly onlineCourses = computed(() => this.courses().filter((course) => course.kind === 'ONLINE').length);
  readonly onsiteCourses = computed(() => this.courses().filter((course) => course.kind === 'ONSITE').length);
  readonly activeClassrooms = computed(() => new Set(this.courses().filter((course) => course.classroom && course.classroom !== '-').map((course) => course.classroom)).size);
  readonly tutors = computed(() => new Set(this.courses().map((course) => course.tutorId)).size);

  readonly displayRange = computed(() => {
    const total = this.filteredCourses().length;
    if (total === 0) {
      return 'Displaying 0 - 0 of 0 courses';
    }

    const start = (this.page() - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `Displaying ${start} - ${end} of ${total} courses`;
  });

  readonly isNewCourseView = computed(() => this.router.url.includes('/courses/create') || this.router.url.includes('/courses/new'));
  readonly isEditCourseView = computed(() => this.router.url.includes('/courses/') && this.router.url.includes('/edit'));
  readonly isSessionsView = computed(() => this.router.url.includes('/courses/sessions'));
  readonly isClassroomsView = computed(() => this.router.url.includes('/courses/classrooms'));
  readonly isBookingsView = computed(() => this.router.url.includes('/courses/bookings'));
  readonly isAttendanceView = computed(() => this.router.url.includes('/courses/') && this.router.url.includes('/attendance'));

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin([this.api.listOnlineCourses(), this.api.listOnSiteCourses()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([onlineCourses, onSiteCourses]) => {
          this.courses.set([
            ...onlineCourses.map((course) => this.toRow(course, 'ONLINE')),
            ...onSiteCourses.map((course) => this.toRow(course, 'ONSITE'))
          ]);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load GestionCours data', err);
          this.courses.set([]);
          this.error.set('Failed to load GestionCours courses.');
          this.loading.set(false);
        }
      });
  }

  refresh(): void {
    this.page.set(1);
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  openCreateCourse(): void {
    void this.router.navigate(['/back/courses/create']);
  }

  editCourse(course: CourseRow): void {
    void this.router.navigate(['/back/courses/create'], { queryParams: { kind: course.kind.toLowerCase(), id: course.id } });
  }

  deleteCourse(course: CourseRow): void {
    const confirmMessage = `Delete ${course.title}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    const request = course.kind === 'ONLINE' ? this.api.deleteOnlineCourse(course.id) : this.api.deleteOnSiteCourse(course.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadCourses(),
      error: (err) => {
        console.error('Failed to delete course', err);
        this.error.set('Failed to delete course.');
      }
    });
  }

  trackByCourse(_: number, course: CourseRow): number {
    return course.id;
  }

  get routeContextVisible(): boolean {
    return this.isNewCourseView() || this.isEditCourseView() || this.isSessionsView() || this.isClassroomsView() || this.isBookingsView() || this.isAttendanceView();
  }

  get routeContextMessage(): string {
    if (this.isNewCourseView()) return 'The create-course route is active. Use this shell to wire the full GestionCours form flow.';
    if (this.isEditCourseView()) return 'The edit-course route is active. Load the selected course and reuse the add/edit form here.';
    if (this.isSessionsView()) return 'The sessions route is active. This is where active online and onsite sessions should be inspected.';
    if (this.isClassroomsView()) return 'The classroom associations route is active. This should surface the course-to-room mapping.';
    if (this.isBookingsView()) return 'The bookings route is active. This should surface course reservations and enrollment associations.';
    if (this.isAttendanceView()) return 'The attendance route is active. This is where course and session attendance detail should be displayed.';
    return '';
  }

  get currentStep(): number {
    return this.activeTab() + 1;
  }

  get totalSteps(): number {
    return this.tabs.length;
  }

  previousStep(): void {
    this.activeTab.set(Math.max(0, this.activeTab() - 1));
  }

  nextStep(): void {
    this.activeTab.set(Math.min(this.tabs.length - 1, this.activeTab() + 1));
  }

  setTab(index: number): void {
    this.activeTab.set(Math.min(Math.max(0, index), this.tabs.length - 1));
    void this.router.navigate([this.tabs[index]?.link ?? '/back/courses']);
  }

  private toRow(course: OnlineCourseDto, kind: 'ONLINE'): CourseRow;
  private toRow(course: OnSiteCourseDto, kind: 'ONSITE'): CourseRow;
  private toRow(course: OnlineCourseDto | OnSiteCourseDto, kind: CourseKind): CourseRow {
    return {
      id: course.id,
      kind,
      title: course.title,
      level: course.level,
      type: kind === 'ONLINE' ? 'Online' : 'On-Site',
      description: course.description ?? '-',
      classroom: kind === 'ONSITE' ? (course as OnSiteCourseDto).classroomName ?? '-' : '-',
      tutorId: course.tutorId
    };
  }
}
