import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification, NotificationType } from '../../services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.read).length;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Toggle le centre de notifications
   */
  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Fermer le centre de notifications
   */
  close(): void {
    this.isOpen = false;
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  /**
   * Supprimer une notification
   */
  removeNotification(notification: Notification): void {
    this.notificationService.removeNotification(notification.id);
  }

  /**
   * Vider toutes les notifications
   */
  clearAll(): void {
    this.notificationService.clearAllNotifications();
  }

  /**
   * Exécuter l'action d'une notification
   */
  executeAction(notification: Notification): void {
    if (notification.action) {
      notification.action.callback();
      this.close();
    }
  }

  /**
   * Obtenir les classes CSS selon le type
   */
  getNotificationClasses(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'border-green-200 bg-green-50';
      case NotificationType.ERROR:
        return 'border-red-200 bg-red-50';
      case NotificationType.WARNING:
        return 'border-yellow-200 bg-yellow-50';
      case NotificationType.INFO:
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  }

  /**
   * Obtenir l'icône selon le type
   */
  getIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return '✅';
      case NotificationType.ERROR:
        return '❌';
      case NotificationType.WARNING:
        return '⚠️';
      case NotificationType.INFO:
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  /**
   * Formater la date de la notification
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Moins d'une minute
      return 'À l\'instant';
    } else if (diff < 3600000) { // Moins d'une heure
      return `Il y a ${Math.floor(diff / 60000)} min`;
    } else if (diff < 86400000) { // Moins d'un jour
      return `Il y a ${Math.floor(diff / 3600000)} h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  /**
   * Obtenir le texte du badge de compteur
   */
  getBadgeText(): string {
    if (this.unreadCount > 99) {
      return '99+';
    }
    return this.unreadCount.toString();
  }

  /**
   * Vérifier s'il y a des notifications non lues
   */
  hasUnreadNotifications(): boolean {
    return this.unreadCount > 0;
  }

  /**
   * Obtenir les notifications récentes (dernières 10)
   */
  getRecentNotifications(): Notification[] {
    return this.notifications.slice(0, 10);
  }

  /**
   * Vérifier si le centre est vide
   */
  isEmpty(): boolean {
    return this.notifications.length === 0;
  }
}
