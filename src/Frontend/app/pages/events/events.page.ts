import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DataService } from '../../core/data/data.service';
import { EventModel, PriceType } from '../../core/data/models';
import { UserContextService } from '../../core/user/user-context.service';

type EventsFilter = 'all' | 'online' | 'onsite' | 'free' | 'paid';
type Availability = 'Available' | 'Limited' | 'Sold out';

@Component({
  selector: 'app-events-page',
  imports: [FormsModule],
  templateUrl: './events.page.html',
  styleUrl: './events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventsPage {
  private readonly data = inject(DataService);
  private readonly user = inject(UserContextService);

  readonly events = this.data.events;

  readonly role = this.user.role;
  readonly participation = this.user.participation;

  readonly query = signal('');
  readonly filter = signal<EventsFilter>('all');
  readonly selectedEventId = signal<string | null>(null);

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
      const heroSrc = this.heroSrc(e.id);
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
  }

  selectEvent(eventId: string): void {
    this.selectedEventId.set(eventId);
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

  bookOrBuy(eventId: string): void {
    const row = this.eventRows().find((r) => r.event.id === eventId);
    if (!row) return;
    if (row.availability === 'Sold out') return;
    if (this.isBooked(eventId)) return;
    this.user.bookEvent(eventId);
  }

  priceLabel(priceType: PriceType, priceTnd: number): string {
    return priceType === 'free' ? 'Free (booking required)' : `${priceTnd} TND`;
  }

  trackEventId = (_: number, row: { event: EventModel }): string => row.event.id;

  private isOnline(e: EventModel): boolean {
    return e.location.toLowerCase().includes('online');
  }

  private getTopic(e: EventModel): string {
    const raw = `${e.name} ${e.overview}`.toLowerCase();
    if (raw.includes('writing') || raw.includes('cv') || raw.includes('email')) return 'Writing';
    if (raw.includes('conversation') || raw.includes('speaking')) return 'Speaking';
    if (raw.includes('grammar')) return 'Grammar';
    if (raw.includes('ielts') || raw.includes('toeic') || raw.includes('exam')) return 'Exam Prep';
    return 'Workshop';
  }

  private getPriceTnd(e: EventModel): number {
    if (e.priceType === 'free') return 0;
    const base = this.seedNumber(e.id, 0, 5);
    const options = [45, 60, 75, 90, 110, 150];
    return options[base] ?? 60;
  }

  private getAvailability(e: EventModel): Availability {
    const n = this.seedNumber(e.id, 0, 99);
    if (n < 12) return 'Sold out';
    if (n < 40) return 'Limited';
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
