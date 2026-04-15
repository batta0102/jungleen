import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { EventModel } from '../../core/data/models';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrl: './event-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '[class.open]': 'open()'
  }
})
export class EventModalComponent {
  readonly open = input<boolean>(false);
  readonly event = input<EventModel | null>(null);
  readonly isBooked = input<boolean>(false);
  readonly isPaymentProcessing = input<boolean>(false);

  readonly rsvpClicked = output<void>();
  readonly payClicked = output<void>();
  readonly closed = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly lastActive = signal<HTMLElement | null>(null);

  readonly descriptionExpanded = signal(false);

  constructor() {
    effect(() => {
      if (this.open()) this.afterOpen();
    });
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    this.close();
  }

  afterOpen(): void {
    this.lastActive.set(document.activeElement as HTMLElement);
    queueMicrotask(() => {
      const el = this.host.nativeElement.querySelector('[data-autofocus]') as HTMLElement | null;
      el?.focus();
    });
  }

  close(): void {
    this.closed.emit();
    queueMicrotask(() => this.lastActive()?.focus());
  }

  toggleDescription(): void {
    this.descriptionExpanded.set(!this.descriptionExpanded());
  }

  onRsvpClick(e: Event): void {
    e.stopPropagation();
    this.rsvpClicked.emit();
  }

  onPayClick(e: Event): void {
    e.stopPropagation();
    this.payClicked.emit();
  }

  getEventTypeLabel(): string {
    const event = this.event();
    if (!event) return '';
    return event.location?.toLowerCase().includes('online') ? 'Online' : 'Onsite';
  }

  getVenueInfo(): string {
    const event = this.event();
    if (!event || !event.venue) return event?.location || '';
    return event.venue.name;
  }

  getVenueCapacity(): string {
    const event = this.event();
    if (!event?.venue?.capacity) return '';
    return `Capacity: ${event.venue.capacity}`;
  }

  getPriceLabel(): string {
    const event = this.event();
    if (!event) return '';
    if (event.priceType === 'free') return 'Free (RSVP required)';
    const price = event.price ?? 60;
    return `${price} TND`;
  }

  getAttendeeInfo(): string {
    const event = this.event();
    if (!event?.maxCapacity) return '';
    const current = event.currentAttendees ?? 0;
    const max = event.maxCapacity;
    const available = Math.max(0, max - current);
    return `${available} spots available`;
  }
}
