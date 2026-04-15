import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventDto } from '../../core/events/event-admin-api.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-medium" [ngClass]="typeClass">{{ event.type }}</span>
          <h3 class="font-serif text-2xl font-semibold text-text mt-2 mb-1">{{ event.title }}</h3>
        </div>
        <span class="text-sm font-medium" [ngClass]="statusClass">{{ event.status }}</span>
      </div>

      <div class="space-y-2 text-sm text-secondary mb-4">
        <div class="flex items-center gap-2">
          <span>📅</span>
          <span>{{ dateLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>🕐</span>
          <span>{{ timeLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>📍</span>
          <span>{{ locationLabel }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="edit.emit(event)"
          class="flex-1 py-3 rounded-lg font-medium transition-colors border border-border hover:bg-light"
        >
          Edit
        </button>
          <button
            type="button"
            (click)="exportCsv.emit(event)"
            class="flex-1 py-3 rounded-lg font-medium transition-colors border border-primary text-primary hover:bg-light"
          >
            Download CSV
          </button>
        <button
          type="button"
          (click)="remove.emit(event)"
          class="flex-1 py-3 rounded-lg font-medium transition-colors bg-primary text-white hover:bg-primary-hover"
        >
          Delete
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class EventCardComponent {
  @Input({ required: true }) event!: EventDto;
  @Output() edit = new EventEmitter<EventDto>();
  @Output() remove = new EventEmitter<EventDto>();
  @Output() exportCsv = new EventEmitter<EventDto>();

  get typeClass(): string {
    return this.event.type === 'ONLINE'
      ? 'bg-blue-50 text-blue-700'
      : 'bg-green-50 text-green-700';
  }

  get statusClass(): string {
    const s = (this.event.status ?? '').toLowerCase();
    if (s.includes('cancel')) return 'text-red-600';
    if (s.includes('close') || s.includes('full')) return 'text-red-600';
    if (s.includes('open') || s.includes('active')) return 'text-green-600';
    return 'text-secondary';
  }

  get dateLabel(): string {
    const d = new Date(this.event.startDate);
    if (Number.isNaN(d.getTime())) return this.event.startDate;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  get timeLabel(): string {
    const start = new Date(this.event.startDate);
    const end = new Date(this.event.endDate);
    const startLabel = Number.isNaN(start.getTime())
      ? this.event.startDate
      : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endLabel = Number.isNaN(end.getTime())
      ? this.event.endDate
      : end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${startLabel} - ${endLabel}`;
  }

  get locationLabel(): string {
    if (this.event.type === 'ONLINE') {
      const url = (this.event as any).meetingUrl as string | undefined;
      return url?.trim() ? url : 'Online';
    }

    const venueName = (this.event as any).venueName as string | undefined;
    const venueAddress = (this.event as any).venueAddress as string | undefined;
    if (venueName && venueAddress) return `${venueName} — ${venueAddress}`;
    if (venueName) return venueName;
    if (venueAddress) return venueAddress;
    return 'Onsite';
  }
}
