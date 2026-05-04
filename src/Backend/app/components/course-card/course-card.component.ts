import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ProgressResponse } from '../../../../core/api/models/progress.model';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="rounded-xl border border-border p-6 bg-white shadow-sm hover:shadow-md transition-shadow relative h-full flex flex-col justify-between">
      <div class="absolute right-4 top-4">
        <button class="p-1.5 rounded-full hover:bg-light">⋯</button>
      </div>

      <div class="mb-3">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium" [ngClass]="statusClass">{{ status }}</span>
      </div>

      <div>
        <h3 class="font-serif text-2xl font-semibold text-text mb-1">{{ title }}</h3>
        <p class="text-sm text-secondary mb-4">{{ instructor }}</p>
      </div>

      <div>
        <div class="border-t border-border pt-4 mt-4 flex items-center justify-between text-sm text-secondary">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2"><span class="text-sm">👥</span><span>{{ students }} Students</span></div>
            <div class="flex items-center gap-2"><span class="text-sm">📘</span><span>{{ sessions }} Sessions</span></div>
          </div>
          @if (!advancedProgress) {
            <div class="text-sm text-secondary">Progress <span class="font-semibold">{{ progress }}%</span></div>
          }
        </div>

        <!-- Attendance & Progress (student view) -->
        @if (progressLoading) {
          <div class="mt-4 text-sm text-secondary">Loading attendance…</div>
        } @else if (advancedProgress) {
          <div class="mt-4 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-secondary">Attendance</span>
              <span class="font-semibold">{{ attendanceRate }}%</span>
            </div>
            <div class="w-full bg-border rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full transition-[width]" [ngStyle]="{ width: attendanceRate + '%', background: gradient }"></div>
            </div>
            <div class="flex items-center gap-2 mt-2">
              @if (advancedProgress.eligible) {
                <span class="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Eligible</span>
              } @else {
                <span class="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Not Eligible</span>
              }
            </div>
          </div>
        } @else {
          <div class="mt-4">
            <div class="w-full bg-border rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full" [ngStyle]="{ width: progress + '%', background: gradient }"></div>
            </div>
          </div>
        }

        <div class="mt-4 flex flex-wrap gap-2">
          @if (courseId) {
            <a
              [routerLink]="['/back/courses', courseId, 'edit']"
              class="inline-block px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover"
              >View Details</a
            >
          }

          @if (canMarkAttendance && courseId) {
            <a
              [routerLink]="['/back/courses', courseTypeSegment, courseId, 'attendance']"
              class="inline-block px-3 py-1.5 rounded-lg border border-primary text-primary text-sm bg-white hover:bg-primary/5"
              >Mark Attendance</a
            >
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CourseCardComponent {
  @Input() title = '';
  @Input() instructor = '';
  @Input() students = 0;
  @Input() sessions = 0;
  @Input() progress = 0;
  @Input() status: 'Active' | 'Upcoming' | 'Completed' = 'Active';
  @Input() courseId = '';
  @Input() advancedProgress: ProgressResponse | null = null;
  @Input() progressLoading = false;
  /** Course type for routing to attendance view (Online / On-site). */
  @Input() courseType: string | undefined;
  /** Whether current user can mark attendance (role = tutor). */
  @Input() canMarkAttendance = false;

  get attendanceRate(): number {
    const rate = this.advancedProgress?.attendanceRate;
    return typeof rate === 'number' ? Math.round(rate) : 0;
  }

  get gradient(): string {
    // Jungle palette progress bar
    return 'linear-gradient(90deg, #2D5757 0%, #F6BD60 60%)';
  }

  get courseTypeSegment(): string {
    const t = (this.courseType ?? '').toLowerCase();
    if (t.includes('on-site') || t.includes('onsite')) return 'onsite';
    if (t.includes('both')) return 'both';
    return 'online';
  }

  get statusClass(): string {
    switch (this.status) {
      case 'Active':
        return 'bg-warning text-text';
      case 'Upcoming':
        return 'bg-warning/80 text-accent';
      case 'Completed':
        return 'bg-surface text-text-muted border border-border';
      default:
        return 'bg-surface text-text-muted border border-border';
    }
  }
}

