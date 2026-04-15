import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-serif text-lg font-semibold text-text">{{ monthTitle }}</h3>
        <div class="space-x-2 text-secondary">
          <button (click)="prevMonth()">‹</button>
          <button (click)="nextMonth()">›</button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-2 text-center text-sm text-secondary mb-2">
        <div *ngFor="let d of dayNames">{{ d }}</div>
      </div>

      <div class="grid grid-cols-7 gap-2 text-center">
        <div *ngFor="let cell of calendarCells" class="py-2">
          <button
            type="button"
            [disabled]="!cell.current"
            [class]="cellClass(cell)"
            (click)="selectDate(cell)"
          >
            <span>{{ cell.date.getDate() }}</span>
            <span
              *ngIf="cell.current && markerCount(cell.date)"
              class="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-primary text-white text-[10px] px-1"
              [attr.aria-label]="markerCount(cell.date) + ' events'"
            >
              {{ markerCount(cell.date) }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CalendarComponent {
  @Input() markers: Record<string, number> = {};
  @Input() selectedDate: string | null = null; // YYYY-MM-DD
  @Output() dateSelected = new EventEmitter<string>();

  dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  month = signal(new Date());

  get monthTitle(): string {
    const d = this.month();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  get calendarCells() {
    const date = new Date(this.month());
    date.setDate(1);
    const startDay = date.getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
    const cells = [] as { date: Date; current: boolean }[];

    // previous month's tail
    for (let i = 0; i < startDay; i++) {
      const prev = new Date(date);
      prev.setDate(i - startDay + 1);
      cells.push({ date: prev, current: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curr = new Date(date.getFullYear(), date.getMonth(), d);
      cells.push({ date: curr, current: true });
    }

    // pad to full weeks
    while (cells.length % 7 !== 0) {
      const next = new Date(date.getFullYear(), date.getMonth(), daysInMonth + (cells.length - startDay) + 1);
      cells.push({ date: next, current: false });
    }

    return cells;
  }

  cellClass(cell: { date: Date; current: boolean }) {
    const today = new Date();
    const isToday = cell.date.toDateString() === today.toDateString();

    const key = this.toKey(cell.date);
    const isSelected = !!this.selectedDate && key === this.selectedDate;

    if (!cell.current) return 'mx-auto inline-flex h-10 w-10 items-center justify-center text-secondary';
    if (isSelected) {
      return 'relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white';
    }
    if (isToday) {
      return 'relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary text-primary';
    }
    return 'relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-light';
  }

  markerCount(date: Date): number {
    return this.markers[this.toKey(date)] ?? 0;
  }

  selectDate(cell: { date: Date; current: boolean }): void {
    if (!cell.current) return;
    this.dateSelected.emit(this.toKey(cell.date));
  }

  private toKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  prevMonth() {
    const d = new Date(this.month());
    d.setMonth(d.getMonth() - 1);
    this.month.set(d);
  }

  nextMonth() {
    const d = new Date(this.month());
    d.setMonth(d.getMonth() + 1);
    this.month.set(d);
  }
}
