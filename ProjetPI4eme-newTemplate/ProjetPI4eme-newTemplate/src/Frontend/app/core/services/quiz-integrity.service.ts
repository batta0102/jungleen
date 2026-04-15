import { Injectable, inject } from '@angular/core';
import { TabSwitchDetectionService, TabSwitchEvent } from './tab-switch-detection.service';
import { AdmissionApiService, QuizEventCreateRequest } from './admission-api.service';
import { Subject } from 'rxjs';

export interface QuizIntegrityAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
  tabSwitchCount?: number;
}

@Injectable({ providedIn: 'root' })
export class QuizIntegrityService {
  private readonly tabSwitchService = inject(TabSwitchDetectionService);
  private readonly admissionApi = inject(AdmissionApiService);

  // Observable for alerts
  readonly integrityAlert = new Subject<QuizIntegrityAlert>();
  
  // Observable to trigger auto-submit
  readonly autoSubmitTriggered = new Subject<void>();

  // Current session context
  private currentSessionId: number | null = null;
  private currentUserId: string | null = null;
  private currentQuizId: number | null = null;
  private previousTabSwitchCount = 0;

  constructor() {
    this.setupTabSwitchListener();
  }

  /**
   * Initialize quiz integrity tracking
   */
  initializeQuizTracking(sessionId: number, userId: string, quizId: number): void {
    this.currentSessionId = sessionId;
    this.currentUserId = userId;
    this.currentQuizId = quizId;
    this.previousTabSwitchCount = 0;

    console.log('✅ Quiz integrity tracking initialized', {
      sessionId,
      userId,
      quizId
    });
  }

  /**
   * Setup listener for tab switch events
   */
  private setupTabSwitchListener(): void {
    this.tabSwitchService.tabSwitchWarning.subscribe((event: TabSwitchEvent) => {
      this.handleTabSwitch(event);
    });
  }

  /**
   * Handle tab switch events
   */
  private handleTabSwitch(event: TabSwitchEvent): void {
    const tabSwitchCount = this.tabSwitchService.getTabSwitchCount();
    
    console.log('🔍 Tab switch handler called:', {
      eventType: event.eventType,
      currentCount: tabSwitchCount,
      previousCount: this.previousTabSwitchCount
    });

    // Only process if count actually changed
    if (tabSwitchCount === this.previousTabSwitchCount) {
      console.log('ℹ️ Tab switch count unchanged, skipping');
      return;
    }

    this.previousTabSwitchCount = tabSwitchCount;

    // Record event to backend
    if (this.currentSessionId && this.currentUserId && this.currentQuizId) {
      this.recordQuizEvent({
        userId: this.currentUserId,
        quizId: this.currentQuizId,
        eventType: 'TAB_SWITCH',
        timestamp: event.timestamp.toISOString(),
        details: `Tab switch #${tabSwitchCount}`,
        sessionTestId: this.currentSessionId
      });
    }

    // First switch → warning
    if (tabSwitchCount === 1) {
      console.warn('⚠️ First tab switch detected');
      this.publishAlert({
        type: 'warning',
        message: '⚠️ WARNING: Tab switching detected. Leaving the quiz again will result in automatic submission.',
        timestamp: new Date(),
        tabSwitchCount
      });
    }
    
    // Second switch → critical (MUST TRIGGER AUTO-SUBMIT)
    if (tabSwitchCount >= 2) {
      console.error('🚨 CRITICAL: Second tab switch detected - AUTO-SUBMITTING NOW');
      this.publishAlert({
        type: 'critical',
        message: '🚨 CRITICAL: Quiz integrity violated. Your quiz will be automatically submitted.',
        timestamp: new Date(),
        tabSwitchCount
      });
      
      // Emit auto-submit signal
      setTimeout(() => {
        console.error('☠️ Triggering auto-submit from integrity service');
        this.autoSubmitTriggered.next();
      }, 500);
    }
  }

  /**
   * Record quiz event to backend
   */
  private recordQuizEvent(request: QuizEventCreateRequest): void {
    this.admissionApi.recordQuizEvent(request).subscribe({
      next: (response) => {
        console.log('✅ Quiz event recorded:', response);
      },
      error: (error) => {
        console.error('❌ Error recording quiz event:', error);
      }
    });
  }

  /**
   * Publish alert to subscribers
   */
  private publishAlert(alert: QuizIntegrityAlert): void {
    console.log('🚨 Integrity Alert:', alert);
    this.integrityAlert.next(alert);
  }

  /**
   * Get current tab switch count
   */
  getTabSwitchCount(): number {
    return this.tabSwitchService.getTabSwitchCount();
  }

  /**
   * Check if quiz should auto-submit
   */
  shouldAutoSubmit(): boolean {
    return this.tabSwitchService.isAutoSubmitTriggered();
  }

  /**
   * Reset tracking
   */
  resetTracking(): void {
    this.tabSwitchService.resetTabSwitchCount();
    this.currentSessionId = null;
    this.currentUserId = null;
    this.currentQuizId = null;
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      tabSwitchService: this.tabSwitchService.getDebugInfo(),
      currentSession: {
        sessionId: this.currentSessionId,
        userId: this.currentUserId,
        quizId: this.currentQuizId
      }
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.tabSwitchService.cleanup();
    this.integrityAlert.complete();
  }
}
