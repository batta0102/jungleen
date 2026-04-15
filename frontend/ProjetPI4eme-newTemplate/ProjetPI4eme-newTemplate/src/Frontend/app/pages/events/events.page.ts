import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DataService } from '../../core/data/data.service';
import { EventModel, PriceType } from '../../core/data/models';
import { EventApiService } from '../../core/events/event-api.service';
import { UserContextService } from '../../core/user/user-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventModalComponent } from '../../shared/event-modal/event-modal.component';
import { PaymentModalComponent } from '../../shared/payment-modal/payment-modal.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

type EventsFilter = 'all' | 'online' | 'onsite' | 'free' | 'paid';
type Availability = 'Available' | 'Limited' | 'Sold out';

@Component({
  selector: 'app-events-page',
  imports: [FormsModule, EventModalComponent, PaymentModalComponent, PaginationComponent],
  templateUrl: './events.page.html',
  styleUrl: './events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventsPage {
  private readonly data = inject(DataService);
  private readonly api = inject(EventApiService);
  private readonly user = inject(UserContextService);
  private readonly auth = inject(AuthService);

  readonly events = this.data.events;
  readonly currentUser = this.auth.currentUser;

  constructor() {
    // Prefer live API when available; keep sample data as fallback.
    this.api.listEvents().subscribe({
      next: (events) => {
        if (events?.length) this.data.setEvents(events);
      },
      error: () => {
        // ignore: keep sample events
      }
    });

    effect(() => {
      const current = this.currentUser();
      if (!current) {
        this.user.setBookedEvents([]);
        return;
      }

      if (!this.auth.isAccessTokenValid()) {
        // Token is expired/missing: skip authenticated sync endpoint to avoid noisy 401s.
        return;
      }

      this.api.listMyRegisteredEventIds(current.id, current.email).subscribe({
        next: (ids) => {
          const backendIds = ids.map((id) => String(id));
          const localIds = this.participation().bookedEventIds;
          const merged = Array.from(new Set([...localIds, ...backendIds]));
          this.user.setBookedEvents(merged);
        },
        error: () => {
          // keep local state if sync fails
        }
      });
    });
  }

  readonly role = this.user.role;
  readonly participation = this.user.participation;

  readonly query = signal('');
  readonly filter = signal<EventsFilter>('all');
  readonly selectedEventId = signal<string | null>(null);
  readonly showEventModal = signal(false);
  readonly showPaymentModal = signal(false);
  readonly isPaymentProcessing = signal(false);

  // Pagination
  readonly page = signal(1);
  readonly pageSize = 2; // 3x3 grid
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.eventRows().length / this.pageSize)));
  readonly pagedEventRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.eventRows().slice(start, start + this.pageSize);
  });

  setPage(p: number): void {
    if (p >= 1 && p <= this.pageCount()) {
      this.page.set(p);
    }
  }

  readonly filters: Array<{ key: EventsFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'online', label: 'Online' },
    { key: 'onsite', label: 'Onsite' },
    { key: 'free', label: 'Free' },
    { key: 'paid', label: 'Paid' }
  ];

  readonly eventRows = computed(() => {
    const role = this.role();
    const q = this.query().trim().toLowerCase();
    const activeFilter = this.filter();

    const visible = this.events().filter((e) => (role === 'student' ? e.visibility === 'public' : true));

    const rows = visible.map((e) => {
      const mode = this.isOnline(e) ? ('online' as const) : ('onsite' as const);
      const topic = this.getTopic(e);
      const heroSrc = e.image || this.heroSrc(e.id);
      const priceTnd = this.getPriceTnd(e);
      const availability = this.getAvailability(e);
      const searchable = `${e.name} ${topic} ${e.overview} ${e.expectedOutcomes.join(' ')}`.toLowerCase();
      return { event: e, mode, topic, heroSrc, priceTnd, availability, searchable };
    });

    const filtered = rows
      .filter((r) => (q ? r.searchable.includes(q) : true))
      .filter((r) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'online') return r.mode === 'online';
        if (activeFilter === 'onsite') return r.mode === 'onsite';
        if (activeFilter === 'free') return r.event.priceType === 'free';
        return r.event.priceType === 'paid';
      })
      .filter((r) => this.isUpcoming(r.event.date));

    return filtered.sort((a, b) => a.event.date.localeCompare(b.event.date));
  });

  readonly selectedRow = computed(() => {
    const rows = this.eventRows();
    if (rows.length === 0) return null;
    const id = this.selectedEventId();
    const found = id ? rows.find((r) => r.event.id === id) : undefined;
    return found ?? rows[0];
  });

  setFilter(key: EventsFilter): void {
    this.filter.set(key);
    this.selectedEventId.set(null);
    this.showEventModal.set(false);
  }

  selectEvent(eventId: string): void {
    this.selectedEventId.set(eventId);
    this.showEventModal.set(true);
  }

  closeEventModal(): void {
    this.showEventModal.set(false);
  }

  bookOrBuy(eventId: string): void {
    const row = this.eventRows().find((r) => r.event.id === eventId);
    if (!row) return;
    if (row.availability === 'Sold out') return;
    if (this.isBooked(eventId)) return;

    const user = this.currentUser();
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    // Call API to register for event
    this.api.registerForEvent(Number(eventId), user.name, user.email, user.id).subscribe({
      next: () => {
        // Update local state after successful registration
        this.user.bookEvent(eventId);
        console.log('Successfully registered for event');
      },
      error: (err) => {
        if (err?.status === 409) {
          this.user.bookEvent(eventId);
          console.log('Already registered for event, syncing local booked state');
          return;
        }
        console.error('Failed to register for event:', err);
        alert('Failed to register for event. Please try again.');
      }
    });
  }

  onRsvpClick(eventId: string): void {
    const user = this.currentUser();
    if (!user) {
      console.warn('User not logged in');
      return;
    }

    // Call API to register for event
    this.api.registerForEvent(Number(eventId), user.name, user.email, user.id).subscribe({
      next: () => {
        // Update local state after successful registration
        this.user.bookEvent(eventId);
        console.log('Successfully registered for event');
      },
      error: (err) => {
        if (err?.status === 409) {
          this.user.bookEvent(eventId);
          console.log('Already registered for event, syncing local booked state');
          return;
        }
        console.error('Failed to register for event:', err);
        alert('Failed to register for event. Please try again.');
      }
    });
  }

  onPayClick(): void {
    this.showPaymentModal.set(true);
  }

  onPaymentComplete(data: { method: string; transactionId: string }): void {
    const eventId = this.selectedEventId();
    const user = this.currentUser();
    
    if (eventId && user) {
      // Call API to register for event after payment
      this.api.registerForEvent(Number(eventId), user.name, user.email, user.id).subscribe({
        next: () => {
          // Update local state after successful registration
          this.user.bookEvent(eventId);
          this.showPaymentModal.set(false);
          console.log(`Payment successful via ${data.method}. Transaction ID: ${data.transactionId}`);
          console.log('Successfully registered for event');
          alert('Payment successful! You are now registered for this event.');
        },
        error: (err: any) => {
          console.error('Failed to register for event:', err);
          // Handle 409 Conflict (already registered) gracefully
          if (err?.status === 409) {
            this.user.bookEvent(eventId);
            this.showPaymentModal.set(false);
            alert('Payment successful! You are now registered for this event.');
            return;
          }
          alert('Payment successful but registration failed. Please contact support.');
        }
      });
    }
  }

  isSelected(eventId: string): boolean {
    return this.selectedRow()?.event.id === eventId;
  }

  isBooked(eventId: string): boolean {
    return this.participation().bookedEventIds.includes(eventId);
  }

  primaryActionLabel(e: EventModel): string {
    return e.priceType === 'free' ? 'Book for Free' : 'Buy Ticket';
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  priceLabel(priceType: PriceType, priceTnd: number): string {
    return priceType === 'free' ? 'Free (booking required)' : `${priceTnd} TND`;
  }

  trackEventId = (_: number, row: { event: EventModel }): string => row.event.id;

  private isOnline(e: EventModel): boolean {
    return e.location.toLowerCase().includes('online');
  }

  private getTopic(e: EventModel): string {
    // Use category from backend if available
    if (e.category) return e.category;
    
    // Fallback to keyword-based detection
    const raw = `${e.name} ${e.overview}`.toLowerCase();
    if (raw.includes('writing') || raw.includes('cv') || raw.includes('email')) return 'Writing';
    if (raw.includes('conversation') || raw.includes('speaking')) return 'Speaking';
    if (raw.includes('grammar')) return 'Grammar';
    if (raw.includes('ielts') || raw.includes('toeic') || raw.includes('exam')) return 'Exam Prep';
    return 'Workshop';
  }

  private getPriceTnd(e: EventModel): number {
    if (e.priceType === 'free') return 0;
    if (typeof e.price === 'number' && !Number.isNaN(e.price)) return e.price;
    const base = this.seedNumber(e.id, 0, 5);
    const options = [45, 60, 75, 90, 110, 150];
    return options[base] ?? 60;
  }

  private getAvailability(e: EventModel): Availability {
    const max = e.maxCapacity;
    const current = e.currentAttendees ?? 0;

    if (typeof max === 'number' && max > 0) {
      if (current >= max) return 'Sold out';
      const remaining = max - current;
      if (remaining <= 5) return 'Limited';
      return 'Available';
    }

    return 'Available';
  }

  private heroSrc(seed: string): string {
    const images = ['/englishimg1.jpg', '/englishimg2.png', '/jungleabout.png', '/contactusjungle.png'];
    return images[this.seedNumber(seed, 0, images.length - 1)];
  }

  private seedNumber(seed: string, min: number, max: number): number {
    const n = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return min + (n % Math.max(1, max - min + 1));
  }

  private isUpcoming(dateIso: string): boolean {
    // dateIso is YYYY-MM-DD in sample data.
    const todayIso = new Date().toISOString().slice(0, 10);
    return dateIso >= todayIso;
  }
}
