import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bookings-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="font-serif text-2xl font-semibold text-text">Course Bookings</h2>
          <p class="text-sm text-secondary">Reservations tied to sessions and rooms.</p>
        </div>
        <a routerLink="/back/courses" class="text-sm font-medium text-primary hover:underline">Back to courses</a>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <article class="rounded-xl border border-border p-4">
          <h3 class="text-lg font-semibold text-text">Online bookings</h3>
          <p class="mt-1 text-sm text-secondary">{{ onlineBookings.length }} booking(s) loaded</p>
          <ul class="mt-4 space-y-3">
            <li *ngFor="let booking of onlineBookings" class="rounded-lg bg-slate-50 p-3 text-sm text-secondary">
              {{ booking.title || booking.name || booking.studentName || booking.email || 'Booking record' }}
            </li>
          </ul>
        </article>

        <article class="rounded-xl border border-border p-4">
          <h3 class="text-lg font-semibold text-text">Onsite bookings</h3>
          <p class="mt-1 text-sm text-secondary">{{ onsiteBookings.length }} booking(s) loaded</p>
          <ul class="mt-4 space-y-3">
            <li *ngFor="let booking of onsiteBookings" class="rounded-lg bg-slate-50 p-3 text-sm text-secondary">
              {{ booking.title || booking.name || booking.studentName || booking.email || 'Booking record' }}
            </li>
          </ul>
        </article>
      </div>

      <p *ngIf="loading" class="mt-6 text-sm text-secondary">Loading booking data...</p>
      <p *ngIf="!loading && onlineBookings.length === 0 && onsiteBookings.length === 0" class="mt-6 text-sm text-secondary">No booking records were returned by the API.</p>
    </section>
  `
})
export class BookingsManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  onlineBookings: any[] = [];
  onsiteBookings: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.http.get<any>('/api/v1/online-bookings/all').subscribe({
      next: response => {
        this.onlineBookings = Array.isArray(response) ? response : response?.data ?? response?.payload ?? [];
        this.loading = false;
      },
      error: () => {
        this.onlineBookings = [];
        this.loading = false;
      }
    });

    this.http.get<any>('/api/v1/onsite-bookings/all').subscribe({
      next: response => {
        this.onsiteBookings = Array.isArray(response) ? response : response?.data ?? response?.payload ?? [];
        this.loading = false;
      },
      error: () => {
        this.onsiteBookings = [];
        this.loading = false;
      }
    });
  }
}
