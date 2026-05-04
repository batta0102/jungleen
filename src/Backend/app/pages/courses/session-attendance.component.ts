import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdvancedApiService } from '../../../../core/api/services/advanced-api.service';
import { SessionAttendanceResponse } from '../../../../core/api/models';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-attendance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionAttendanceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly advancedApi = inject(AdvancedApiService);

  readonly courseId = signal<string>('');
  readonly courseType = signal<string>('online');
  readonly sessionId = signal<string>('');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly attendance = signal<SessionAttendanceResponse | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const courseId = params.get('courseId');
      const courseType = params.get('courseType');
      const sessionId = params.get('sessionId');
      if (!courseId || !sessionId) {
        this.error.set('Missing identifiers for session attendance.');
        return;
      }
      this.courseId.set(courseId);
      this.courseType.set(courseType ?? 'online');
      this.sessionId.set(sessionId);
      this.loadAttendance(sessionId);
    });
  }

  loadAttendance(sessionId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.advancedApi.getSessionAttendance(sessionId).subscribe({
      next: (res) => {
        this.attendance.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load attendance');
        this.loading.set(false);
      }
    });
  }

  markAttendance(): void {
    const sessionId = this.sessionId();
    if (!sessionId) return;
    this.loading.set(true);
    this.error.set(null);
    this.advancedApi.markAttendance({ sessionId }).subscribe({
      next: (res) => {
        this.attendance.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to mark attendance');
        this.loading.set(false);
      }
    });
  }

  backToCourseAttendance(): void {
    this.router.navigate([
      '/back/courses',
      this.courseType(),
      this.courseId(),
      'attendance'
    ]);
  }
}

