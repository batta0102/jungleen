import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { timeout, finalize } from 'rxjs/operators';

import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { BookingApiService } from '../../../../core/api/services/booking-api.service';
import { SessionApiService } from '../../../../core/api/services/session-api.service';
import { ClassroomApiService } from '../../../../core/api/services/classroom-api.service';
import { Course, Session, Classroom } from '../../../../core/api/models';
import { UserContextService } from '../../core/user/user-context.service';
import { CourseService } from '../../core/services/course.service';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TYPES = ['Online', 'On-site'];

/** Fallback when API is down or returns empty — so the page is never blank. */
const SAMPLE_COURSES: Course[] = [
  { id: 'demo-1', title: 'A2 Foundations', instructor: 'Dr. Sarah Martin', description: 'Build your basics: greetings, daily life, simple past and future.', level: 'A2', type: 'Online', priceOnline: 450, priceOnsite: 600, rating: 4.5, reviewCount: 120 },
  { id: 'demo-2', title: 'B1 Business English', instructor: 'Prof. Jean Dubois', description: 'Emails, meetings, and professional vocabulary.', level: 'B1', type: 'On-site', priceOnline: 650, priceOnsite: 800, rating: 4.7, reviewCount: 89 },
  { id: 'demo-3', title: 'B2 Conversation & Debate', instructor: 'Dr. Alice Chen', description: 'Fluency and argumentation in real-life situations.', level: 'B2', type: 'Online', priceOnline: 750, priceOnsite: 900, rating: 4.6, reviewCount: 64 },
  { id: 'demo-4', title: 'C1 Advanced Writing', instructor: 'Dr. Mark Lee', description: 'Essays, reports, and formal writing.', level: 'C1', type: 'On-site', priceOnline: 850, priceOnsite: 1000, rating: 4.8, reviewCount: 42 },
  { id: 'demo-5', title: 'IELTS Preparation', instructor: 'Dr. Sarah Martin', description: 'Strategies and practice for the IELTS exam.', level: 'B2', type: 'Online', priceOnline: 700, priceOnsite: 850, rating: 4.9, reviewCount: 156 },
  { id: 'demo-6', title: 'English for Beginners (A1)', instructor: 'Dr. Alice Chen', description: 'Your first steps: alphabet, numbers, simple phrases.', level: 'A1', type: 'Online', priceOnline: 350, priceOnsite: 500, rating: 4.4, reviewCount: 203 },
];

@Component({
  selector: 'app-trainings-page',
  imports: [RouterLink, NgOptimizedImage, FormsModule],
  templateUrl: './trainings.page.html',
  styleUrl: './trainings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingsPage implements OnInit {
  private readonly courseApi = inject(CourseApiService);
  private readonly courseService = inject(CourseService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly sessionApi = inject(SessionApiService);
  private readonly classroomApi = inject(ClassroomApiService);
  private readonly user = inject(UserContextService);

  readonly role = this.user.role;
  readonly participation = this.user.participation;
  readonly enrollTraining = (id: string, mode: 'online' | 'onsite') => this.user.enrollTraining(id, mode);

  /** Toujours afficher au moins les cours de démo si l'API est vide ou indisponible. */
  readonly courses = signal<Course[]>(SAMPLE_COURSES);
  readonly sessions = signal<Session[]>([]);
  readonly classrooms = signal<Classroom[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly usingFallback = signal(true);

  /** Sessions grouped by courseId for display on each course card. */
  readonly sessionsByCourseId = computed(() => {
    const map: Record<string, Session[]> = {};
    this.sessions().forEach((s) => {
      const key = String(s.courseId);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  });
  readonly classroomNameById = computed(() => {
    const map: Record<string, string> = {};
    this.classrooms().forEach((c) => (map[String(c.id)] = c.name ?? '-'));
    return map;
  });

  readonly search = signal('');
  readonly filterLevel = signal<string>('');
  readonly filterType = signal<string>('');
  readonly sortBy = signal<'title' | 'rating' | 'price'>('title');

  readonly levels = LEVELS;
  readonly types = TYPES;

  readonly filteredCourses = computed(() => {
    const list = this.courses();
    let q = this.search().trim().toLowerCase();
    const level = this.filterLevel();
    const type = this.filterType();
    let out = list;
    if (q) out = out.filter((c) => (c.title ?? '').toLowerCase().includes(q));
    if (level) out = out.filter((c) => (c.level ?? '') === level);
    if (type) out = out.filter((c) => (c.type ?? '').toString() === type);
    const sort = this.sortBy();
    out = [...out].sort((a, b) => {
      if (sort === 'title') return (a.title ?? '').localeCompare(b.title ?? '');
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      const pa = a.priceOnline ?? a.priceOnsite ?? 0;
      const pb = b.priceOnline ?? b.priceOnsite ?? 0;
      return pa - pb;
    });
    return out;
  });

  readonly pageSize = 6;
  readonly page = signal(1);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredCourses().length / this.pageSize)));
  readonly pagedCourses = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredCourses().slice(start, start + this.pageSize);
  });
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('[TrainingsPage] Calling API... loadCourses() → CourseService.getAllCourses()');
    this.courseService
      .getAllCourses()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading.set(false);
          console.log('[TrainingsPage] loadCourses() finalize → loading.set(false)');
        })
      )
      .subscribe({
        next: (list) => {
          const data = this.normalizeCourseList(list);
          console.log('[TrainingsPage] API next: count=', data.length, 'body=', list, 'normalized=', data);
          if (data.length > 0) {
            this.courses.set(data);
            this.usingFallback.set(false);
          } else {
            this.courses.set(SAMPLE_COURSES);
            this.usingFallback.set(true);
          }
        },
        error: (err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.message ?? err?.error?.message ?? 'Unknown error';
          const body = err?.error ?? err?.body;
          console.error('[TrainingsPage] API error: status=', status, 'message=', message, 'body=', body, 'full err=', err);
          this.courses.set(SAMPLE_COURSES);
          this.usingFallback.set(true);
          this.error.set(err?.message ?? 'Unable to load courses right now.');
        }
      });
    this.sessionApi.getSessions().subscribe({
      next: (list) => this.sessions.set(this.normalizeList(list)),
      error: () => this.sessions.set([])
    });
    this.classroomApi.getClassrooms().subscribe({
      next: (list) => this.classrooms.set(this.normalizeList(list)),
      error: () => this.classrooms.set([])
    });
  }

  /** Accepte tableau direct ou réponse Spring { content: [] } / { data: [] }. */
  private normalizeCourseList(raw: unknown): Course[] {
    if (Array.isArray(raw)) return raw as Course[];
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.content)) return o.content as Course[];
      if (Array.isArray(o.data)) return o.data as Course[];
    }
    return [];
  }

  private normalizeList<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.content)) return o.content as T[];
      if (Array.isArray(o.data)) return o.data as T[];
    }
    return [];
  }

  getSessionsForCourse(courseId: string | number): Session[] {
    return this.sessionsByCourseId()[String(courseId)] ?? [];
  }

  getClassroomName(id: string | number | undefined): string {
    if (id == null) return '-';
    return this.classroomNameById()[String(id)] ?? '-';
  }

  formatSessionDate(s: Session): string {
    const d = s.startDate ?? s.startTime;
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(d);
    }
  }

  enroll(courseId: string | number, type: 'Online' | 'On-site'): void {
    const idStr = String(courseId);
    const mode = type === 'Online' ? 'online' : 'onsite';
    if (this.usingFallback()) {
      this.user.enrollTraining(idStr, mode);
      return;
    }
    this.bookingApi.createBooking({ courseId: courseId, type }).subscribe({
      next: () => this.user.enrollTraining(idStr, mode),
      error: (err) => this.error.set(err?.message ?? 'Enrollment failed')
    });
  }

  isEnrolled(courseId: string | number): boolean {
    return this.participation().enrolledTrainingIds.includes(String(courseId));
  }

  setPage(p: number): void {
    this.page.set(Math.max(1, Math.min(p, this.pageCount())));
  }

  trackById(_: number, c: Course): string {
    return String(c.id);
  }

  /** For tutor: navigate to sessions (if you add a route). */
  mySessions(): void {
    this.sessionApi.getSessions({ tutorId: 'me' }).subscribe({
      next: () => {},
      error: () => {}
    });
    // If you have a /front/trainings/sessions page, router.navigate(['/front/trainings', 'sessions'])
  }
}
