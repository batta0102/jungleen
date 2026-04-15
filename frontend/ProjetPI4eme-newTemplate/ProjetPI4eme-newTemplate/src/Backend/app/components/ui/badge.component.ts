import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `,
  styles: []
})
export class AppBadgeComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' = 'primary';

  get badgeClasses(): string {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';

    const variants: Record<string, string> = {
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-secondary/10 text-secondary',
      accent: 'bg-accent/10 text-accent',
      success: 'bg-primary/10 text-primary',      // success mapped to primary teal
      warning: 'bg-warning/20 text-accent'        // warm yellow highlight
    };

    return `${base} ${variants[this.variant]}`;
  }
}
