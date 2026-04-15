import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-medium" [ngClass]="typeClass">{{ type }}</span>
          <h3 class="font-serif text-2xl font-semibold text-text mt-2 mb-1">{{ title }}</h3>
        </div>
        <span class="text-sm font-medium" [ngClass]="statusClass">{{ status }}</span>
      </div>

      <div class="space-y-2 text-sm text-secondary mb-4">
        <div class="flex items-center gap-2">
          <span>📅</span>
          <span>{{ date }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>🕐</span>
          <span>{{ time }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span>📍</span>
          <span>{{ location }}</span>
        </div>
      </div>

      <button [ngClass]="buttonClass" class="w-full py-3 rounded-lg font-medium transition-colors">
        {{ buttonText }}
      </button>
    </div>
  `,
  styles: []
})
export class EventCardComponent {
  @Input() type: 'Workshop' | 'Cultural' | 'Field Trip' = 'Workshop';
  @Input() title = '';
  @Input() date = '';
  @Input() time = '';
  @Input() location = '';
  @Input() status: 'Open' | 'Full' = 'Open';
  @Input() buttonText = 'Register';

  get typeClass(): string {
    switch (this.type) {
      case 'Workshop':
        return 'bg-blue-50 text-blue-700';
      case 'Cultural':
        return 'bg-orange-50 text-orange-700';
      case 'Field Trip':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  }

  get statusClass(): string {
    switch (this.status) {
      case 'Open':
        return 'text-green-600';
      case 'Full':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  get buttonClass(): string {
    if (this.buttonText.includes('Cancel')) {
      return 'border border-primary text-primary hover:bg-light';
    }
    if (this.buttonText === 'Waitlist') {
      return 'bg-light text-text hover:bg-border';
    }
    return 'bg-primary text-white hover:bg-primary-hover';
  }
}
