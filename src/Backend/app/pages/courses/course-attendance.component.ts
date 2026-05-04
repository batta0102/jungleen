import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SessionApiService } from '../../../../core/api/services/session-api.service';
import { Session } from '../../../../core/api/models';

@Component({
  selector: 'app-course-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-attendance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseAttendanceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionApi = inject(SessionApiService);

  readonly courseId = signal<string>('');
  readonly courseType = signal<string>('online');

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('courseId');
      const type = params.get('courseType');
      if (!id) {
        this.error.set('Missing course id.');
        return;
      }
      this.courseId.set(id);
      this.courseType.set(type ?? 'online');
      this.loadSessionsForCourse(id);
    });
  }

  loadSessionsForCourse(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.sessionApi.getSessions().subscribe({
      next: (list) => {
        const all = Array.isArray(list) ? list : [];
        const filtered = all.filter((s) => String(s.courseId) === id);
        this.sessions.set(filtered);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load sessions');
        this.sessions.set([]);
        this.loading.set(false);
      }
    });
  }

  openSessionAttendance(session: Session): void {
    this.router.navigate([
      '/back/courses',
      this.courseType(),
      this.courseId(),
      'attendance',
      session.id
    ]);
  }

  backToCourses(): void {
    this.router.navigate(['/back/courses']);
  }
}

