import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between mb-4">
          <h3 class="font-serif text-lg font-semibold text-text">{{ title }}</h3>
          <div class="h-9 w-9 rounded-lg bg-light flex items-center justify-center text-secondary">
            <span class="text-xl">{{ icon }}</span>
          </div>
        </div>
        <p class="text-sm text-secondary mb-4">{{ description }}</p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2 text-xs text-secondary">
          <span>{{ progress }}% Complete</span>
          <button class="text-primary text-sm">→</button>
        </div>
        <div class="w-full bg-border rounded-full h-2 overflow-hidden">
          <div class="h-2 rounded-full" [ngStyle]="{ width: progress + '%', background: gradient }"></div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModuleCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '📘';
  @Input() progress = 0;

  get gradient(): string {
    // Jungle palette: dark teal into warm highlight
    return 'linear-gradient(90deg, #2D5757 0%, #F6BD60 60%)';
  }
}
