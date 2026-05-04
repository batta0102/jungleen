import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" *ngIf="isVisible" [ngClass]="type" role="status" aria-live="polite">
      <span class="toast__message">{{ message }}</span>
      <button type="button" class="toast__close" (click)="onClose()" aria-label="Close notification">x</button>
    </div>
  `,
  styles: [
    `
      .toast {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        max-width: 420px;
        padding: 0.75rem 0.9rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        color: #fff;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }
      .toast.info { background: #2563eb; }
      .toast.success { background: #059669; }
      .toast.warning { background: #d97706; }
      .toast.critical { background: #dc2626; }
      .toast__message { line-height: 1.3; }
      .toast__close {
        background: transparent;
        border: 0;
        color: inherit;
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastNotificationComponent {
  @Input() message = '';
  @Input() type: 'warning' | 'critical' | 'info' | 'success' = 'info';
  @Input() isVisible = false;
  @Input() duration = 5000;

  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }
}
