import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-club-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex h-full">
      <!-- Left side icon area -->
      <div [ngClass]="bgColorClass" class="w-32 flex items-center justify-center flex-shrink-0">
        <span class="text-5xl">{{ icon }}</span>
      </div>

      <!-- Right side content -->
      <div class="flex-1 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-serif text-2xl font-semibold text-text mb-2">{{ title }}</h3>
          <p class="text-sm text-secondary mb-4">{{ description }}</p>
        </div>

        <div class="flex items-center justify-between gap-4 text-sm text-secondary border-t border-border pt-4 mt-4">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2"><span>👥</span><span>{{ members }}</span></div>
            <div class="flex items-center gap-2"><span>📍</span><span>{{ location }}</span></div>
          </div>
          <button class="text-primary font-medium">Join</button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ClubCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '👥';
  @Input() members = '0';
  @Input() location = '';
  @Input() color: 'blue' | 'green' | 'purple' | 'yellow' = 'blue';

  get bgColorClass(): string {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      yellow: 'bg-yellow-100'
    };
    return colors[this.color] || 'bg-light';
  }
}
