import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class AppCardComponent {
}
