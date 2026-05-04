import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sessions-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-serif text-2xl font-semibold text-text">Active Sessions</h2>
          <p class="text-sm text-secondary">Online and onsite sessions from GestionCours.</p>
        </div>
        <a routerLink="/back/courses" class="text-sm font-medium text-primary hover:underline">Back to courses</a>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-2">
        <div class="rounded-xl border border-border p-4">
          <h3 class="text-lg font-semibold text-text">Online sessions</h3>
          <ul class="mt-4 space-y-3">
            <li *ngFor="let session of onlineSessions" class="rounded-lg bg-slate-50 p-3">
              <div class="font-medium text-text">{{ session.title || session.name || ('Session ' + (session.id || session.sessionId || '?')) }}</div>
              <div class="text-sm text-secondary">{{ session.description || session.startDate || session.date || 'No details available' }}</div>
            </li>
          </ul>
        </div>

        <div class="rounded-xl border border-border p-4">
          <h3 class="text-lg font-semibold text-text">Onsite sessions</h3>
          <ul class="mt-4 space-y-3">
            <li *ngFor="let session of onsiteSessions" class="rounded-lg bg-slate-50 p-3">
              <div class="font-medium text-text">{{ session.title || session.name || ('Session ' + (session.id || session.sessionId || '?')) }}</div>
              <div class="text-sm text-secondary">{{ session.description || session.startDate || session.date || 'No details available' }}</div>
            </li>
          </ul>
        </div>
      </div>

      <p *ngIf="loading" class="mt-6 text-sm text-secondary">Loading session data...</p>
      <p *ngIf="!loading && onlineSessions.length === 0 && onsiteSessions.length === 0" class="mt-6 text-sm text-secondary">No sessions were returned by the API.</p>
    </section>
  `
})
export class SessionsManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  onlineSessions: any[] = [];
  onsiteSessions: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.http.get<any>('/api/v1/online-sessions/all').subscribe({
      next: response => {
        this.onlineSessions = Array.isArray(response) ? response : response?.data ?? response?.payload ?? [];
        this.loading = false;
      },
      error: () => {
        this.onlineSessions = [];
        this.loading = false;
      }
    });

    this.http.get<any>('/api/v1/onsite-sessions/all').subscribe({
      next: response => {
        this.onsiteSessions = Array.isArray(response) ? response : response?.data ?? response?.payload ?? [];
        this.loading = false;
      },
      error: () => {
        this.onsiteSessions = [];
        this.loading = false;
      }
    });
  }
}
