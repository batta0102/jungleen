import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsAdminApiService } from '../../core/events/analytics-admin-api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {
  private readonly api = inject(AnalyticsAdminApiService);

  loading = signal(true);
  error = signal<string | null>(null);

  participants = signal<any | null>(null);
  attendanceRate = signal<any | null>(null);
  popular = signal<any | null>(null);
  venueUtilization = signal<any | null>(null);
  engagement = signal<any | null>(null);
  trends = signal<any | null>(null);
  report = signal<any | null>(null);

  predictionEventId = signal<number | null>(null);
  prediction = signal<any | null>(null);

  availablePredictionEventIds = computed<number[]>(() => {
    const rows = this.participants()?.events ?? [];
    return rows
      .map((row: any) => Number(row.eventId))
      .filter((id: number) => Number.isFinite(id) && id > 0);
  });

  availablePredictionEvents = computed<Array<{id: number; title: string}>>(() => {
    const rows = this.participants()?.events ?? [];
    return rows
      .filter((row: any) => Number.isFinite(Number(row.eventId)) && Number(row.eventId) > 0)
      .map((row: any) => ({
        id: Number(row.eventId),
        title: row.eventTitle || `Event #${row.eventId}`
      }));
  });

  maxParticipants = computed(() => {
    const rows = this.participants()?.events ?? [];
    const max = rows.reduce((acc: number, row: any) => Math.max(acc, row.participants ?? 0), 0);
    return max || 1;
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getParticipants().subscribe({
      next: (data) => {
        this.participants.set(data);
        const ids = (data?.events ?? [])
          .map((row: any) => Number(row.eventId))
          .filter((id: number) => Number.isFinite(id) && id > 0);
        if (!this.predictionEventId() && ids.length > 0) {
          this.predictionEventId.set(ids[0]);
        }
      },
      error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load participants analytics'))
    });
    this.api.getAttendanceRate().subscribe({ next: (data) => this.attendanceRate.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load attendance rate')) });
    this.api.getPopularEvents().subscribe({ next: (data) => this.popular.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load popular events')) });
    this.api.getVenueUtilization().subscribe({ next: (data) => this.venueUtilization.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load venue utilization')) });
    this.api.getEngagement().subscribe({ next: (data) => this.engagement.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load engagement data')) });
    this.api.getTrends().subscribe({ next: (data) => this.trends.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load trends')) });
    this.api.getEventsReport().subscribe({ next: (data) => this.report.set(data), error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to load report')), complete: () => this.loading.set(false) });
  }

  predict(): void {
    const id = this.predictionEventId();
    if (!id) {
      this.error.set('No event available for prediction. Create at least one event first.');
      return;
    }

    this.error.set(null);

    this.api.predictAttendance(id).subscribe({
      next: (data) => this.prediction.set(data),
      error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to predict attendance'))
    });
  }

  downloadReportCsv(): void {
    this.api.downloadEventsReportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'events-analytics-report.csv';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => this.error.set(this.extractErrorMessage(err, 'Failed to download report CSV'))
    });
  }

  participantsBarWidth(participants: number): string {
    const max = this.maxParticipants();
    const ratio = Math.max(0, Math.min(100, (participants / max) * 100));
    return `${ratio}%`;
  }

  getEventTitle(eventId: number): string {
    const evt = this.availablePredictionEvents().find(e => e.id === eventId);
    return evt?.title || `Event #${eventId}`;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}
