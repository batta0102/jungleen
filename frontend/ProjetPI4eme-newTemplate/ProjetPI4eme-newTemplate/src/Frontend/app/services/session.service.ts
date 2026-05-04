import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface SessionWarning {
  show: boolean;
  remainingSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly router = inject(Router);

  // Durée de session: 30 minutes
  private readonly SESSION_DURATION = 30 * 60 * 1000;
  // Avertissement 2 minutes avant expiration
  private readonly WARNING_BEFORE_EXPIRE = 2 * 60 * 1000;

  private sessionTimer: any = null;
  private warningTimer: any = null;

  readonly warningState = signal<SessionWarning>({
    show: false,
    remainingSeconds: 0
  });

  /**
   * Démarrer la session au login
   */
  startSession(): void {
    this.clearTimers();

    // Timer pour afficher l'avertissement
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.SESSION_DURATION - this.WARNING_BEFORE_EXPIRE);

    // Timer pour déconnexion automatique
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.SESSION_DURATION);

    console.log('⏱️ Session démarrée (30 min)');
  }

  /**
   * Arrêter la session
   */
  stopSession(): void {
    this.clearTimers();
    this.warningState.set({ show: false, remainingSeconds: 0 });
    console.log('⏹️ Session arrêtée');
  }

  /**
   * Prolonger la session (reset des timers)
   */
  extendSession(): void {
    this.warningState.set({ show: false, remainingSeconds: 0 });
    this.startSession();
    console.log('🔄 Session prolongée');
  }

  /**
   * Afficher le warning
   */
  private showWarning(): void {
    const warningSeconds = Math.floor(this.WARNING_BEFORE_EXPIRE / 1000);
    this.warningState.set({
      show: true,
      remainingSeconds: warningSeconds
    });

    // Mettre à jour le compte à rebours chaque seconde
    let remaining = warningSeconds;
    const countdown = setInterval(() => {
      remaining--;
      if (remaining > 0 && this.warningState().show) {
        this.warningState.set({
          show: true,
          remainingSeconds: remaining
        });
      } else {
        clearInterval(countdown);
      }
    }, 1000);

    console.log('⚠️ Session expire bientôt - Warning affiché');
  }

  /**
   * Expirer la session (déconnexion)
   */
  private expireSession(): void {
    this.warningState.set({ show: false, remainingSeconds: 0 });

    // Nettoyer le stockage
    localStorage.removeItem('currentUser');

    console.log('🔒 Session expirée - Déconnexion automatique');

    // Rediriger vers l'accueil
    this.router.navigate(['/front']);
  }

  /**
   * Nettoyer tous les timers
   */
  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}
