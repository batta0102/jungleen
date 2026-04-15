import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible"
      class="toast-container"
      [ngClass]="'toast-' + type"
      [@slideIn]
    >
      <div class="toast-content">
        <span class="toast-message">{{ message }}</span>
        <button 
          class="toast-close"
          (click)="close()"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
      <div class="toast-progress" [style.animation-duration.ms]="duration"></div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      max-width: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .toast-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      gap: 1rem;
    }

    .toast-message {
      flex: 1;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-progress {
      height: 3px;
      animation: progress linear forwards;
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0; }
    }

    /* Toast types */
    .toast-warning {
      background-color: #fff3cd;
      color: #856404;
      border-left: 4px solid #ffc107;
    }

    .toast-critical {
      background-color: #f8d7da;
      color: #721c24;
      border-left: 4px solid #dc3545;
    }

    .toast-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
    }

    .toast-success {
      background-color: #d4edda;
      color: #155724;
      border-left: 4px solid #28a745;
    }

    .toast-warning .toast-progress {
      background-color: #ffc107;
    }

    .toast-critical .toast-progress {
      background-color: #dc3545;
    }

    .toast-info .toast-progress {
      background-color: #17a2b8;
    }

    .toast-success .toast-progress {
      background-color: #28a745;
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastNotificationComponent {
  @Input() message = '';
  @Input() type: 'warning' | 'critical' | 'info' | 'success' = 'info';
  @Input() duration = 5000; // milliseconds
  @Input() isVisible = false;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.isVisible = false;
    this.closed.emit();
  }
}
