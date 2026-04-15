import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
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
          <div class="text-sm text-secondary">Progress <span class="font-semibold">{{ progress }}%</span></div>
        </div>

        <div class="mt-4">
          <div class="w-full bg-border rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full" [ngStyle]="{ width: progress + '%', background: gradient }"></div>
          </div>
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

  get gradient(): string {
    // Jungle palette progress bar
    return 'linear-gradient(90deg, #2D5757 0%, #F6BD60 60%)';
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

