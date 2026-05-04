import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { AdvancedApiService } from '../../../../core/api/services/advanced-api.service';
import { SessionApiService } from '../../../../core/api/services/session-api.service';
import { BookingApiService } from '../../../../core/api/services/booking-api.service';
import { ClassroomApiService } from '../../../../core/api/services/classroom-api.service';
import { Course, ProgressResponse, Session, Booking, Classroom } from '../../../../core/api/models';
import { AppEmptyStateComponent } from '../ui/empty-state.component';
import { UserContextService } from '../../../../Frontend/app/core/user/user-context.service';

const STUDENT_ID_KEY = 'studentId';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AppEmptyStateComponent],
  templateUrl: './course-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseListComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly sessionApi = inject(SessionApiService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly classroomApi = inject(ClassroomApiService);
  private readonly advancedApi = inject(AdvancedApiService);
  private readonly userContext = inject(UserContextService);

  courses = signal<Course[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  /** Progress from GET /advanced/progress (key = courseId). Only when role = student. */
  progressMap = signal<Record<string, ProgressResponse | null>>({});
  /** Per-card loading for progress (key = courseId). */
  progressLoadingMap = signal<Record<string, boolean>>({});

  /** Advanced check modal state */
  advancedCheckOpen = signal(false);
  advancedCheckCourse: Course | null = null;
  advancedCheckConflicts = signal<string[]>([]);
  advancedCheckCapacityWarnings = signal<string[]>([]);

  /** Filter by course type (All / Online / On-site) */
  filterType = signal<'Online' | 'On-site' | null>(null);

  filteredCourses = computed(() => {
    const type = this.filterType();
    const list = this.courses();
    if (!type) return list;
    return list.filter((c) => (c.type ?? '') === type);
  });

  /** Statistiques dérivées des cours (tous, pas filtrés). */
  readonly stats = computed(() => {
    const list = this.courses();
    const total = list.length;
    const online = list.filter((c) => (c.type ?? '') === 'Online').length;
    const onsite = list.filter((c) => (c.type ?? '') === 'On-site').length;
    const byLevel: Record<string, number> = {};
    list.forEach((c) => {
      const level = (c.level ?? 'N/A').toString();
      byLevel[level] = (byLevel[level] ?? 0) + 1;
    });
    const levels = Object.entries(byLevel).sort(([a], [b]) => a.localeCompare(b));
    return { total, online, onsite, byLevel: levels };
  });

  readonly role = this.userContext.role;

  setFilterType(type: 'Online' | 'On-site' | null): void {
    this.filterType.set(type);
  }

  /** Classroom display for course (placeholder: backend may expose or derive from sessions). */
  courseClassroom(_c: Course): string {
    return '-';
  }

  /** studentId from localStorage or AuthService; same key as backoffice. */
  getStudentId(): string | null {
    try {
      return localStorage.getItem(STUDENT_ID_KEY)?.trim() || null;
    } catch {
      return null;
    }
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  /** Open Advanced Check report for a given course (no role / user logic). */
  openAdvancedCheck(course: Course): void {
    this.advancedCheckCourse = course;
    this.advancedCheckOpen.set(true);
    this.loadAdvancedCheckData(course);
  }

  closeAdvancedCheck(): void {
    this.advancedCheckOpen.set(false);
    this.advancedCheckCourse = null;
    this.advancedCheckConflicts.set([]);
    this.advancedCheckCapacityWarnings.set([]);
  }

  private loadAdvancedCheckData(course: Course): void {
    const courseId = course.id;
    // Load related data in parallel using existing services.
    this.sessionApi.getSessions().subscribe({
      next: (sessions) => {
        const courseSessions = (sessions ?? []).filter((s) => String(s.courseId) === String(courseId));
        this.computeAdvancedReport(course, courseSessions);
      },
      error: () => {
        this.advancedCheckConflicts.set(['Failed to load sessions for this course.']);
      }
    });

    // Optionally, load bookings and classrooms to enrich capacity checks.
    this.bookingApi.getBookings({ courseId: String(courseId) }).subscribe({
      next: (allBookings) => {
        const forCourse = (allBookings ?? []).filter((b) => String(b.courseId) === String(courseId));
        this.appendCapacityFromBookings(course, forCourse);
      },
      error: () => {
        this.advancedCheckCapacityWarnings.update((list) => [
          ...list,
          'Failed to load bookings for this course.'
        ]);
      }
    });

    this.classroomApi.getClassrooms().subscribe({
      next: (classrooms) => {
        this.appendCapacityFromClassrooms(course, classrooms ?? []);
      },
      error: () => {
        this.advancedCheckCapacityWarnings.update((list) => [
          ...list,
          'Failed to load classrooms.'
        ]);
      }
    });
  }

  private computeAdvancedReport(course: Course, sessions: Session[]): void {
    const conflicts: string[] = [];
    // Simple naive conflict detection: same startDate && same classroomId.
    const byKey: Record<string, Session[]> = {};
    for (const s of sessions) {
      const key = `${s.startDate ?? ''}_${s.classroomId ?? ''}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(s);
    }
    Object.values(byKey)
      .filter((list) => list.length > 1)
      .forEach((list) => {
        const ids = list.map((s) => s.id).join(', ');
        conflicts.push(`Conflicting sessions for course ${course.title}: [${ids}] share same time/classroom.`);
      });
    this.advancedCheckConflicts.set(conflicts);
  }

  private appendCapacityFromBookings(course: Course, bookings: Booking[]): void {
    const warnings: string[] = [];
    const totalBookings = bookings.length;
    if (course.students != null && totalBookings > course.students) {
      warnings.push(
        `Bookings (${totalBookings}) exceed declared students capacity (${course.students}).`
      );
    }
    if (warnings.length) {
      this.advancedCheckCapacityWarnings.update((prev) => [...prev, ...warnings]);
    }
  }

  private appendCapacityFromClassrooms(course: Course, classrooms: Classroom[]): void {
    // Here we only append a generic note; detailed mapping requires session->classroom join.
    if (!classrooms.length) return;
    this.advancedCheckCapacityWarnings.update((prev) => [
      ...prev,
      `Classrooms are available for capacity checks (${classrooms.length} total).`
    ]);
  }

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.progressMap.set({});
    this.progressLoadingMap.set({});
    this.courseApi.getCourses().subscribe({
      next: (list) => {
        const courseList = Array.isArray(list) ? list : [];
        this.courses.set(courseList);
        this.loading.set(false);
        if (this.role() === 'student') {
          this.loadProgressForCourses(courseList);
        }
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load courses');
        this.courses.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadProgressForCourses(courseList: Course[]): void {
    const studentId = this.getStudentId();
    if (!studentId) return;
    const idList = courseList.map((c) => this.courseId(c));
    this.progressLoadingMap.set(Object.fromEntries(idList.map((id) => [id, true])));
    const courseTypeParam = (c: Course): string => (c.type === 'On-site' ? 'On-site' : 'Online');
    const requests = courseList.map((c) =>
      this.advancedApi.getProgress(courseTypeParam(c), c.id, studentId)
    );
    forkJoin(requests).subscribe({
      next: (results) => {
        const map: Record<string, ProgressResponse | null> = {};
        courseList.forEach((c, i) => {
          map[this.courseId(c)] = results[i] ?? null;
        });
        this.progressMap.set(map);
        this.progressLoadingMap.set({});
      },
      error: () => {
        this.progressLoadingMap.set({});
      }
    });
  }

  deleteCourse(id: string | number): void {
    if (!confirm('Are you sure you want to delete this course?')) return;
    const idStr = String(id);
    this.courseApi.deleteCourse(id).subscribe({
      next: () => {
        this.courses.update((list) => list.filter((c) => String(c.id) !== idStr));
      },
      error: (err) => this.error.set(err?.message ?? 'Delete failed')
    });
  }

  /** Normalize id for routerLink (backend may return number). */
  courseId(c: Course): string {
    return String(c.id);
  }
}
