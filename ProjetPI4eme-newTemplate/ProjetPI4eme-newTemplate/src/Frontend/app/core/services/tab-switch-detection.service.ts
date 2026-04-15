import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

export interface TabSwitchEvent {
  timestamp: Date;
  eventType: 'visibility_change' | 'window_blur' | 'window_focus';
  isHidden: boolean;
}

@Injectable({ providedIn: 'root' })
export class TabSwitchDetectionService {
  // State signals
  private readonly tabSwitchCount = signal(0);
  private readonly isTabVisible = signal(!document.hidden);
  private readonly lastSwitchTime = signal<Date | null>(null);
  private readonly destroy$ = new Subject<void>();
  private readonly tabSwitchWarning$ = new Subject<TabSwitchEvent>();

  // Computed state
  readonly tabSwitchWarning = this.tabSwitchWarning$.asObservable();
  readonly tabSwitchCountValue = this.tabSwitchCount;
  readonly isWarningTriggered = computed(() => this.tabSwitchCount() >= 1);
  readonly isAutoSubmitTriggered = computed(() => this.tabSwitchCount() >= 2);

  // Configuration
  private readonly SWITCH_DELAY_MS = 1000; // 1 second delay to avoid false positives
  private readonly isMobileDevice = this.detectMobileDevice();

  constructor() {
    this.setupDetection();
  }

  /**
   * Initialize tab switch detection
   */
  private setupDetection(): void {
    // Skip detection on mobile devices
    if (this.isMobileDevice) {
      console.log('📱 Tab switch detection disabled on mobile device');
      return;
    }

    // Detect visibility changes (tab switching)
    fromEvent(document, 'visibilitychange')
      .pipe(
        debounceTime(this.SWITCH_DELAY_MS),
        tap(() => this.handleVisibilityChange()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Detect window blur (loses focus)
    fromEvent(window, 'blur')
      .pipe(
        debounceTime(this.SWITCH_DELAY_MS / 2),
        tap(() => this.handleWindowBlur()),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Detect window focus (gains focus)
    fromEvent(window, 'focus')
      .pipe(
        tap(() => this.handleWindowFocus()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Handle document visibility change (tab switch)
   */
  private handleVisibilityChange(): void {
    const isHidden = document.hidden;
    this.isTabVisible.set(!isHidden);

    if (isHidden) {
      this.recordTabSwitch('visibility_change', true);
    }
  }

  /**
   * Handle window blur (user moves to another window)
   */
  private handleWindowBlur(): void {
    this.recordTabSwitch('window_blur', true);
  }

  /**
   * Handle window focus (user returns to window)
   */
  private handleWindowFocus(): void {
    this.isTabVisible.set(true);
  }

  /**
   * Record and process a tab switch event
   */
  private recordTabSwitch(
    eventType: 'visibility_change' | 'window_blur' | 'window_focus',
    isHidden: boolean
  ): void {
    if (!isHidden && eventType !== 'visibility_change') return; // Only count actual switches

    const now = new Date();
    this.lastSwitchTime.set(now);
    this.tabSwitchCount.update(count => count + 1);

    const event: TabSwitchEvent = {
      timestamp: now,
      eventType,
      isHidden
    };

    console.log(`⚠️ Tab switch detected (#{this.tabSwitchCount()})`, event);
    this.tabSwitchWarning$.next(event);
  }

  /**
   * Get current tab switch count
   */
  getTabSwitchCount(): number {
    return this.tabSwitchCount();
  }

  /**
   * Reset tab switch counter
   */
  resetTabSwitchCount(): void {
    this.tabSwitchCount.set(0);
    this.lastSwitchTime.set(null);
    console.log('🔄 Tab switch counter reset');
  }

  /**
   * Get tab visibility status
   */
  isTabHidden(): boolean {
    return !this.isTabVisible();
  }

  /**
   * Detect if device is mobile
   */
  private detectMobileDevice(): boolean {
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tabSwitchWarning$.complete();
  }

  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      tabSwitchCount: this.tabSwitchCount(),
      isTabVisible: this.isTabVisible(),
      lastSwitchTime: this.lastSwitchTime(),
      isMobileDevice: this.isMobileDevice,
      isWarningTriggered: this.isWarningTriggered(),
      isAutoSubmitTriggered: this.isAutoSubmitTriggered()
    };
  }
}
