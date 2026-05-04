import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingApiService } from '../../../../core/api/services/booking-api.service';
import { CourseApiService } from '../../../../core/api/services/course-api.service';
import { Booking, Course } from '../../../../core/api/models';

@Component({
  selector: 'app-bookings-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bookings-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingsManagementComponent {
  private readonly bookingApi = inject(BookingApiService);
  private readonly courseApi = inject(CourseApiService);

  bookings = signal<Booking[]>([]);
  courses = signal<Course[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  courseMap = computed(() => {
    const map: Record<string, string> = {};
    this.courses().forEach((c) => (map[String(c.id)] = c.title ?? '-'));
    return map;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.bookingApi.getBookings().subscribe({
      next: (list) => {
        this.bookings.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load bookings');
        this.bookings.set([]);
        this.loading.set(false);
      }
    });
    this.courseApi.getCourses().subscribe({ next: (list) => this.courses.set(Array.isArray(list) ? list : []), error: () => {} });
  }

  deleteBooking(id: string | number): void {
    if (!confirm('Delete this booking?')) return;
    this.bookings.update((list) => list.filter((b) => b.id !== id));
  }

  id(b: Booking): string {
    return String(b.id ?? b.courseId);
  }
}
