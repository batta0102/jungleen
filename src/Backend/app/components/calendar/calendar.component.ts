import { Component, signal } from '@angular/core';
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
          <div [class]="cellClass(cell)">{{ cell.date.getDate() }}</div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CalendarComponent {
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
    if (isToday) return 'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white';
    if (!cell.current) return 'text-secondary';
    return 'mx-auto inline-flex h-8 w-8 items-center justify-center';
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
