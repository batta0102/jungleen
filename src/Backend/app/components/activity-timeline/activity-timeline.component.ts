import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TimelineItem { title: string; desc?: string; time?: string; }

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div *ngFor="let item of items" class="flex items-start gap-4">
        <div class="mt-1 h-3 w-3 rounded-full bg-light border border-border"></div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-text">{{ item.title }}</p>
            <p class="text-xs text-secondary">{{ item.time }}</p>
          </div>
          <p *ngIf="item.desc" class="text-sm text-secondary">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ActivityTimelineComponent {
  @Input() items: TimelineItem[] = [];
}
