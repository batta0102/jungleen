import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionApiService } from '../../../../core/api/services/session-api.service';
import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { ClassroomApiService } from '../../../../core/api/services/classroom-api.service';
import { Session, Course, Classroom } from '../../../../core/api/models';

@Component({
  selector: 'app-sessions-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sessions-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionsManagementComponent {
  private readonly sessionApi = inject(SessionApiService);
  private readonly courseApi = inject(CourseApiService);
  private readonly classroomApi = inject(ClassroomApiService);

  sessions = signal<Session[]>([]);
  courses = signal<Course[]>([]);
  classrooms = signal<Classroom[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  courseMap = computed(() => {
    const map: Record<string, string> = {};
    this.courses().forEach((c) => (map[String(c.id)] = c.title ?? '-'));
    return map;
  });
  classroomMap = computed(() => {
    const map: Record<string, string> = {};
    this.classrooms().forEach((c) => (map[String(c.id)] = c.name ?? '-'));
    return map;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.sessionApi.getSessions().subscribe({
      next: (list) => {
        this.sessions.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load sessions');
        this.sessions.set([]);
        this.loading.set(false);
      }
    });
    this.courseApi.getCourses().subscribe({ next: (list) => this.courses.set(Array.isArray(list) ? list : []), error: () => {} });
    this.classroomApi.getClassrooms().subscribe({ next: (list) => this.classrooms.set(Array.isArray(list) ? list : []), error: () => {} });
  }

  deleteSession(id: string | number): void {
    if (!confirm('Delete this session?')) return;
    this.sessionApi.deleteSession(id).subscribe({
      next: () => this.sessions.update((list) => list.filter((s) => s.id !== id)),
      error: (err) => this.error.set(err?.message ?? 'Delete failed')
    });
  }

  formatDate(d: string | undefined): string {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  id(s: Session): string {
    return String(s.id);
  }
}
