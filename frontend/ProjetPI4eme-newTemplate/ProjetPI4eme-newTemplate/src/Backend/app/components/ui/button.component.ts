import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled || isLoading"
      [type]="type">
      <span *ngIf="isLoading" class="mr-2 inline-block animate-spin">
        ⏳
      </span>
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class AppButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-danger text-white hover:bg-danger/90 shadow-sm',                      // main CTA: C84630
      secondary: 'bg-light text-text hover:bg-border border border-border',             // subtle secondary
      outline: 'border border-border bg-transparent text-text hover:bg-light hover:border-primary hover:text-primary',
      ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-light',
      accent: 'bg-accent text-white hover:bg-accent-hover shadow-sm'                    // accent actions
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base'
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }
}
