import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-club-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="border: 3px solid green; padding: 20px; margin: 10px 0; background: #e8f5e8;">
      <h3 style="font-size: 24px; font-weight: bold; color: #333;">{{ title }}</h3>
    </div>
  `,
  styles: []
})
export class ClubCardComponent {
  @Input() title = '';
}
