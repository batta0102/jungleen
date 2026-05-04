import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { environment } from '../environment';
import type { RealtimeNotification } from '../models';
import { normalizeRealtimeNotification } from './realtime-notification.service';

/**
 * STOMP + SockJS to the same host as the app (dev: Angular proxy → `/ws`).
 * Backend maps the session from STOMP CONNECT header {@code userId} — match REST/debug user id.
 *
 * Ne pas injecter DestroyRef ici (service root) : en zoneless / certains contextes, une erreur
 * d’injection ou un cycle peut faire écran blanc. Le composant cloche appelle disconnect() au destroy.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStompService {
  private client: Client | null = null;
  private readonly connectedSubject = new ReplaySubject<boolean>(1);
  private readonly errorSubject = new Subject<string>();

  /** Server-pushed notifications (JSON body same shape as REST). */
  private readonly incomingSubject = new Subject<RealtimeNotification>();

  readonly incoming$: Observable<RealtimeNotification> = this.incomingSubject.asObservable();
  readonly connected$: Observable<boolean> = this.connectedSubject.asObservable();
  readonly stompErrors$: Observable<string> = this.errorSubject.asObservable();

  constructor() {
    this.connectedSubject.next(false);
  }

  /**
   * Open STOMP session if needed. {@code userId} must match Spring
   * {@code convertAndSendToUser(String.valueOf(userId), ...)} (e.g. `notificationsStompUserId`).
   */
  connect(userId: string): void {
    const uid = userId?.trim();
    if (!uid) {
      this.errorSubject.next('NotificationStomp: empty userId');
      return;
    }

    this.disconnect();

    const wsUrl = `${environment.stompSockJsUrl}`;
    const client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
      connectHeaders: {
        userId: uid
      },
      debug: () => {
        /* enable only when debugging: console.log(str) */
      }
    });

    client.onConnect = () => {
      this.connectedSubject.next(true);
      client.subscribe('/user/queue/notifications', (message: IMessage) => {
        try {
          const raw = JSON.parse(message.body) as unknown;
          this.incomingSubject.next(normalizeRealtimeNotification(raw));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          this.errorSubject.next(`STOMP parse: ${msg}`);
        }
      });
    };

    client.onStompError = (frame) => {
      const hint = frame.headers['message'] ?? frame.body;
      this.errorSubject.next(`STOMP error: ${hint}`);
      this.connectedSubject.next(false);
    };

    client.onWebSocketError = (event) => {
      this.errorSubject.next(`WebSocket error: ${event.type}`);
      this.connectedSubject.next(false);
    };

    client.onDisconnect = () => {
      this.connectedSubject.next(false);
    };

    this.client = client;
    try {
      client.activate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.errorSubject.next(`STOMP activate: ${msg}`);
      this.client = null;
    }
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
    this.connectedSubject.next(false);
  }
}
