import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (sessionService.warningState().show) {
      <div class="session-overlay" (click)="onOverlayClick($event)">
        <div class="session-modal">
          <div class="session-icon">⏰</div>
          <h2>Session expirant</h2>
          <p>Votre session expire dans <strong>{{ sessionService.warningState().remainingSeconds }} secondes</strong></p>
          <p class="session-subtitle">Voulez-vous prolonger votre session ?</p>
          <div class="session-actions">
            <button class="btn-extend" (click)="extendSession()">
              Oui, prolonger
            </button>
            <button class="btn-logout" (click)="logout()">
              Non, déconnecter
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .session-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    .session-modal {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    }

    .session-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    p {
      margin: 0.5rem 0;
      color: #666;
      font-size: 1rem;
    }

    .session-subtitle {
      color: #888;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .session-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      justify-content: center;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .btn-extend {
      background: #4CAF50;
      color: white;
    }

    .btn-extend:hover {
      background: #45a049;
    }

    .btn-logout {
      background: #f5f5f5;
      color: #666;
    }

    .btn-logout:hover {
      background: #e0e0e0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class SessionWarningComponent {
  readonly sessionService = inject(SessionService);

  extendSession(): void {
    this.sessionService.extendSession();
  }

  logout(): void {
    this.sessionService.stopSession();
    localStorage.removeItem('currentUser');
    window.location.href = '/front';
  }

  onOverlayClick(event: MouseEvent): void {
    // Ne rien faire si on clique sur l'overlay (empêche la fermeture accidentelle)
    event.stopPropagation();
  }
}
