import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 class="font-serif text-2xl font-semibold text-text">Session Attendance</h2>
      <p class="mt-2 text-secondary">Course type: {{ courseType }} | Course ID: {{ courseId }} | Session ID: {{ sessionId }}</p>
      <a routerLink="/back/courses" class="mt-4 inline-block text-sm font-medium text-primary hover:underline">Back to courses</a>
    </section>
  `
})
export class SessionAttendanceComponent {
  courseType = 'unknown';
  courseId = 'unknown';
  sessionId = 'unknown';

  constructor(private readonly route: ActivatedRoute) {
    this.courseType = this.route.snapshot.paramMap.get('courseType') ?? 'unknown';
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? 'unknown';
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? 'unknown';
  }
}
