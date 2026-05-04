import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
  ElementRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RealtimeNotificationService } from '../../../../core/api/services/realtime-notification.service';
import { NotificationStompService } from '../../../../core/api/services/notification-stomp.service';
import { environment } from '../../../../core/api/environment';
import type { RealtimeNotification } from '../../../../core/api/models';
import {
  displayNotificationMessageEn,
  displayNotificationTitleEn
} from '../../../../core/api/utils/notification-display-en';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsApi = inject(RealtimeNotificationService);
  private readonly stomp = inject(NotificationStompService);
  private readonly auth = inject(AuthFacade);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  readonly items = signal<RealtimeNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dropdownOpen = signal(false);

  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);
  readonly testBusy = signal(false);

  constructor() {
    this.stomp.incoming$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((n: RealtimeNotification) => {
        try {
          this.mergeIncoming(n);
        } catch (e) {
          console.error('[NotificationBell] mergeIncoming', e);
        }
      });
    this.notificationsApi.onListRefresh().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.stomp.stompErrors$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg: string) => console.warn('[NotificationBell] STOMP/WebSocket:', msg));
  }

  ngOnInit(): void {
    this.load();
    // Après le premier rendu : évite qu’une exception STOMP/SockJS synchrone casse tout le bootstrap (écran blanc).
    queueMicrotask(() => {
      try {
        this.stomp.connect(this.resolveStompUserId());
      } catch (e) {
        console.error('[NotificationBell] STOMP connect', e);
        this.error.set(e instanceof Error ? e.message : String(e));
      }
    });
  }

  ngOnDestroy(): void {
    this.stomp.disconnect();
  }

  /** STOMP user id (Spring `/user/queue/notifications`); mock auth studentId / tutorId. */
  private resolveStompUserId(): string {
    const sid = this.auth.studentId() ?? null;
    const tid = this.auth.tutorId() ?? null;
    const fromAuth = sid ?? tid;
    if (fromAuth != null && String(fromAuth).trim() !== '') {
      return String(fromAuth).trim();
    }
    return environment.notificationsStompUserId;
  }

  mergeIncoming(n: RealtimeNotification): void {
    const id = Number((n as { id?: unknown }).id);
    if (n == null || !Number.isFinite(id) || id < 1) {
      return;
    }
    const normalized: RealtimeNotification = { ...n, id };
    this.items.update((list) => {
      const idx = list.findIndex((x) => x.id === normalized.id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = normalized;
        return next;
      }
      return [normalized, ...list];
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.dropdownOpen()) return;
    const t = ev.target;
    if (t instanceof Node && !this.host.nativeElement.contains(t)) {
      this.dropdownOpen.set(false);
    }
  }

  toggle(ev: Event): void {
    ev.stopPropagation();
    this.dropdownOpen.update((open) => !open);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notificationsApi
      .getMyNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list: RealtimeNotification[]) => {
          this.items.set(list);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.items.set([]);
          this.loading.set(false);
          this.error.set(err instanceof Error ? err.message : String(err));
        }
      });
  }

  markOne(id: number, ev: Event): void {
    ev.stopPropagation();
    this.notificationsApi
      .markAsRead(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : String(err));
        }
      });
  }

  markAll(ev: Event): void {
    ev.stopPropagation();
    this.notificationsApi
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : String(err));
        }
      });
  }

  /** Demo: POST /api/notifications for the same user as STOMP (mock auth or environment). */
  sendTestDemo(ev: Event): void {
    ev.stopPropagation();
    const uid = Number(this.resolveStompUserId());
    if (!Number.isFinite(uid) || uid < 1) {
      this.error.set('Invalid user for demo notification.');
      return;
    }
    this.error.set(null);
    this.testBusy.set(true);
    this.notificationsApi
      .createNotification({
        userId: uid,
        type: 'RISK_ALERT',
        title: 'Test notification',
        message: 'Created from the bell (POST /api/notifications).'
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.testBusy.set(false);
        },
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : String(err));
          this.testBusy.set(false);
        }
      });
  }

  openFullPage(ev: Event): void {
    ev.stopPropagation();
    this.dropdownOpen.set(false);
    void this.router.navigate(['/back/notifications']);
  }

  /**
   * Row click behavior:
   * - keep existing markAsRead flow for unread notifications
   * - navigate using payload deep-link when possible
   * - fallback to notifications page when payload is missing/invalid
   */
  onRowClick(n: RealtimeNotification, ev: Event): void {
    ev.stopPropagation();
    const targetRoute = this.resolveNotificationRoute(n);
    this.dropdownOpen.set(false);

    if (!n.read) {
      this.notificationsApi
        .markAsRead(n.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.load();
            void this.router.navigate(targetRoute);
          },
          error: (err: unknown) => {
            this.error.set(err instanceof Error ? err.message : String(err));
            // Even if mark-as-read fails, keep navigation for demo continuity.
            void this.router.navigate(targetRoute);
          }
        });
      return;
    }

    void this.router.navigate(targetRoute);
  }

  /** Short label for notification type (UI). */
  typeLabel(type: string | null | undefined): string {
    const t = (type ?? '').trim();
    const labels: Record<string, string> = {
      COURSE_CREATED: 'Course added',
      COURSE_UPDATED: 'Course updated',
      COURSE_DELETED: 'Course deleted',
      ATTENDANCE_UPDATED: 'Attendance',
      SESSION_CANCELLED: 'Session cancelled',
      WAITLIST_PROMOTED: 'Waitlist',
      RISK_ALERT: 'Alert'
    };
    return labels[t] ?? (t ? t.replace(/_/g, ' ') : 'Notification');
  }

  /** Hide title when it only repeats the type badge (after FR→EN mapping). */
  showTitleRow(n: RealtimeNotification): boolean {
    const title = this.titleForDisplay(n).trim();
    if (!title) return false;
    return title !== this.typeLabel(n.type);
  }

  titleForDisplay(n: RealtimeNotification): string {
    return displayNotificationTitleEn(n.title);
  }

  messageForDisplay(n: RealtimeNotification): string {
    return displayNotificationMessageEn(n.message);
  }

  readLabel(read: boolean): string {
    return read ? 'Read' : 'Unread';
  }

  /**
   * Deep-link routing by payloadJson.
   * Supported payloads:
   * - course notifications: { courseId, courseKind?, event? }
   * - classroom notifications: { classroomId, event? }
   */
  private resolveNotificationRoute(n: RealtimeNotification): string[] {
    const payload = this.parsePayloadJson(n.payloadJson);
    if (!payload) return ['/back/notifications'];

    // Classroom payload
    const classroomId = this.toPositiveInt(payload['classroomId']);
    if (classroomId != null) {
      if (String(payload['event'] ?? '').toUpperCase() === 'DELETED') {
        return ['/back/courses/classrooms'];
      }
      return ['/back/courses/classrooms', String(classroomId), 'edit'];
    }

    // Course payload (current route shape requires course kind + id)
    const courseId = this.toPositiveInt(payload['courseId']);
    if (courseId != null) {
      const kindRaw = String(payload['courseKind'] ?? payload['channel'] ?? '').toUpperCase();
      const courseTypeParam =
        kindRaw === 'ONSITE' ? 'On-site' :
        kindRaw === 'ONLINE' ? 'Online' :
        null;
      const eventRaw = String(payload['event'] ?? '').toUpperCase();
      if (courseTypeParam) {
        if (eventRaw === 'DELETED') return ['/back/courses'];
        return ['/back/courses', courseTypeParam, String(courseId), 'edit'];
      }
      return ['/back/courses'];
    }

    return ['/back/notifications'];
  }

  private parsePayloadJson(payloadJson: string | null | undefined): Record<string, unknown> | null {
    if (!payloadJson || payloadJson.trim() === '') return null;
    try {
      const parsed = JSON.parse(payloadJson) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private toPositiveInt(value: unknown): number | null {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
  }
}
