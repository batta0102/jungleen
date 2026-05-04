import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface QuizIntegrityAlert {
  type: 'warning' | 'critical' | 'info' | 'success';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class QuizIntegrityService implements OnDestroy {
  private readonly alertSubject = new Subject<QuizIntegrityAlert>();
  readonly integrityAlert = this.alertSubject.asObservable();

  private tabSwitchCount = 0;
  private isInitialized = false;
  private visibilityHandler?: () => void;

  initializeQuizTracking(sessionId: number, userId: string, quizId: number): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.tabSwitchCount = 0;

    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.tabSwitchCount += 1;

        if (this.tabSwitchCount === 1) {
          this.alertSubject.next({
            type: 'warning',
            message: 'Warning: tab switching detected. One more switch will auto-submit the quiz.'
          });
        } else if (this.tabSwitchCount >= 2) {
          this.alertSubject.next({
            type: 'critical',
            message: 'Critical: multiple tab switches detected. The quiz will be submitted.'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Keep params used for future telemetry integration.
    void sessionId;
    void userId;
    void quizId;
  }

  getTabSwitchCount(): number {
    return this.tabSwitchCount;
  }

  cleanup(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
    this.isInitialized = false;
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.alertSubject.complete();
  }
}
