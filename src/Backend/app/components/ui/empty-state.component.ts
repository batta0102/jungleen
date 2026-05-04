import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4">
      <div class="text-center">
        <div class="mx-auto w-16 h-16 text-secondary/30 mb-4">
          {{ emoji }}
        </div>
        <h3 class="text-lg font-semibold text-text mb-2">{{ title }}</h3>
        <p class="text-secondary mb-6">{{ description }}</p>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class AppEmptyStateComponent {
  @Input() title = 'No items found';
  @Input() description = 'This section is empty';
  @Input() emoji = '📭';
}
