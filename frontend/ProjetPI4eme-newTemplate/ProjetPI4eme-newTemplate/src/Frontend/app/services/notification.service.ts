import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

// Types de notifications
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum NotificationEvent {
  BUDDY_REQUEST_SENT = 'BUDDY_REQUEST_SENT',
  BUDDY_REQUEST_ACCEPTED = 'BUDDY_REQUEST_ACCEPTED',
  BUDDY_REQUEST_REJECTED = 'BUDDY_REQUEST_REJECTED',
  SESSION_PLANNED = 'SESSION_PLANNED',
  SESSION_CONFIRMED = 'SESSION_CONFIRMED',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  BUDDY_TERMINATED = 'BUDDY_TERMINATED'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  event?: NotificationEvent;
  duration?: number;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

export interface ToastConfig {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private currentToast = new BehaviorSubject<Notification | null>(null);
  private toastQueue = new Subject<Notification>();
  
  // Durées par défaut (en millisecondes)
  private readonly DEFAULT_DURATIONS = {
    [NotificationType.SUCCESS]: 4000,
    [NotificationType.ERROR]: 6000,
    [NotificationType.WARNING]: 5000,
    [NotificationType.INFO]: 3000
  };

  constructor() {
    // Gérer la file d'attente des toasts
    this.toastQueue.subscribe(notification => {
      this.showToast(notification);
    });
  }

  /**
   * Obtenir toutes les notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  /**
   * Obtenir le toast actuel
   */
  getCurrentToast(): Observable<Notification | null> {
    return this.currentToast.asObservable();
  }

  /**
   * Afficher un toast
   */
  showToast(config: ToastConfig): void {
    const notification: Notification = {
      id: this.generateId(),
      type: config.type,
      title: config.title,
      message: config.message,
      duration: config.duration || this.DEFAULT_DURATIONS[config.type],
      timestamp: new Date(),
      read: false,
      action: config.action
    };

    // Ajouter à la liste des notifications
    const currentNotifications = this.notifications.value;
    this.notifications.next([notification, ...currentNotifications]);

    // Afficher le toast
    this.currentToast.next(notification);

    // Auto-dismiss après la durée
    setTimeout(() => {
      this.dismissToast(notification.id);
    }, notification.duration);
  }

  /**
   * Méthodes spécifiques pour les événements buddy
   */
  showBuddyRequestSent(partnerName: string): void {
    this.showToast({
      type: NotificationType.SUCCESS,
      title: '🎉 Demande de buddy envoyée !',
      message: `Votre demande a été envoyée à ${partnerName}. Vous serez notifié dès qu'il répondra.`,
      action: {
        label: 'Voir mes buddies',
        callback: () => this.navigateToBuddies()
      }
    });
  }

  showBuddyRequestAccepted(partnerName: string): void {
    this.showToast({
      type: NotificationType.SUCCESS,
      title: '✅ Demande de buddy acceptée !',
      message: `${partnerName} a accepté votre demande. Vous êtes maintenant buddies !`,
      action: {
        label: 'Voir les détails',
        callback: () => this.navigateToBuddies()
      }
    });
  }

  showBuddyRequestRejected(partnerName: string): void {
    this.showToast({
      type: NotificationType.WARNING,
      title: '❌ Demande de buddy refusée',
      message: `${partnerName} a malheureusement refusé votre demande. Vous pouvez essayer avec un autre partenaire.`,
      action: {
        label: 'Trouver un autre buddy',
        callback: () => this.navigateToBuddyRequest()
      }
    });
  }

  showSessionPlanned(partnerName: string, date: Date): void {
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.showToast({
      type: NotificationType.INFO,
      title: '📅 Session planifiée !',
      message: `Session avec ${partnerName} planifiée pour le ${formattedDate}.`,
      action: {
        label: 'Voir les détails',
        callback: () => this.navigateToBuddyDetail()
      }
    });
  }

  showSessionConfirmed(partnerName: string): void {
    this.showToast({
      type: NotificationType.SUCCESS,
      title: '✅ Session confirmée !',
      message: `${partnerName} a confirmé la session. Préparez-vous pour votre session d'apprentissage !`,
      action: {
        label: 'Voir les détails',
        callback: () => this.navigateToBuddyDetail()
      }
    });
  }

  showSessionCancelled(partnerName: string): void {
    this.showToast({
      type: NotificationType.WARNING,
      title: '❌ Session annulée',
      message: `${partnerName} a annulé la session. Vous pouvez planifier une nouvelle session.`,
      action: {
        label: 'Planifier une session',
        callback: () => this.navigateToPlanSession()
      }
    });
  }

  showSessionCompleted(partnerName: string): void {
    this.showToast({
      type: NotificationType.SUCCESS,
      title: '🏁 Session terminée !',
      message: `Session avec ${partnerName} terminée avec succès. N'oubliez pas de confirmer votre satisfaction !`,
      action: {
        label: 'Confirmer la satisfaction',
        callback: () => this.navigateToBuddyDetail()
      }
    });
  }

  showBuddyTerminated(partnerName: string): void {
    this.showToast({
      type: NotificationType.INFO,
      title: '🏁 Buddy terminé',
      message: `Votre buddy avec ${partnerName} est maintenant terminé. Merci pour votre participation !`,
      action: {
        label: 'Trouver un nouveau buddy',
        callback: () => this.navigateToBuddyRequest()
      }
    });
  }

  /**
   * Notifications génériques
   */
  showSuccess(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.showToast({
      type: NotificationType.SUCCESS,
      title,
      message,
      action
    });
  }

  showError(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.showToast({
      type: NotificationType.ERROR,
      title,
      message,
      duration: 8000, // Plus long pour les erreurs
      action
    });
  }

  showWarning(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.showToast({
      type: NotificationType.WARNING,
      title,
      message,
      action
    });
  }

  showInfo(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.showToast({
      type: NotificationType.INFO,
      title,
      message,
      action
    });
  }

  /**
   * Dismiss un toast manuellement
   */
  dismissToast(notificationId: string): void {
    const currentToast = this.currentToast.value;
    if (currentToast && currentToast.id === notificationId) {
      this.currentToast.next(null);
    }
  }

  /**
   * Dismiss tous les toasts
   */
  dismissAllToasts(): void {
    this.currentToast.next(null);
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notifications.next(updatedNotifications);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
    this.notifications.next(updatedNotifications);
  }

  /**
   * Supprimer une notification
   */
  removeNotification(notificationId: string): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
    this.notifications.next(updatedNotifications);
  }

  /**
   * Supprimer toutes les notifications
   */
  clearAllNotifications(): void {
    this.notifications.next([]);
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(): number {
    return this.notifications.value.filter(n => !n.read).length;
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Méthodes de navigation (à adapter selon votre routing)
   */
  private navigateToBuddies(): void {
    // Adapter selon votre configuration de routing
    window.location.href = '/buddies';
  }

  private navigateToBuddyRequest(): void {
    window.location.href = '/admin/buddies/requests';
  }

  private navigateToBuddyDetail(): void {
    // Adapter pour naviguer vers la page de détails du buddy appropriée
    // Vous pourriez stocker le dernier buddy consulté et naviguer vers celui-ci
    window.location.href = '/buddies';
  }

  private navigateToPlanSession(): void {
    // Adapter pour naviguer vers la page de planification
    window.location.href = '/buddies';
  }

  /**
   * Créer une notification à partir d'un événement
   */
  createNotificationFromEvent(event: NotificationEvent, data: any): void {
    switch (event) {
      case NotificationEvent.BUDDY_REQUEST_SENT:
        this.showBuddyRequestSent(data.partnerName);
        break;
      case NotificationEvent.BUDDY_REQUEST_ACCEPTED:
        this.showBuddyRequestAccepted(data.partnerName);
        break;
      case NotificationEvent.BUDDY_REQUEST_REJECTED:
        this.showBuddyRequestRejected(data.partnerName);
        break;
      case NotificationEvent.SESSION_PLANNED:
        this.showSessionPlanned(data.partnerName, data.date);
        break;
      case NotificationEvent.SESSION_CONFIRMED:
        this.showSessionConfirmed(data.partnerName);
        break;
      case NotificationEvent.SESSION_CANCELLED:
        this.showSessionCancelled(data.partnerName);
        break;
      case NotificationEvent.SESSION_COMPLETED:
        this.showSessionCompleted(data.partnerName);
        break;
      case NotificationEvent.BUDDY_TERMINATED:
        this.showBuddyTerminated(data.partnerName);
        break;
      default:
        console.warn('Événement de notification non géré:', event);
    }
  }
}
