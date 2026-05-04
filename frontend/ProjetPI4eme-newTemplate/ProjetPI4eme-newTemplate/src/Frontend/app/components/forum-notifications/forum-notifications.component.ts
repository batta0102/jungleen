import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ForumAdvancedService, ForumNotification } from '../../services/forum-advanced.service';

@Component({
  selector: 'app-forum-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forum-notifications.component.html',
  styleUrls: ['./forum-notifications.component.scss']
})
export class ForumNotificationsComponent implements OnInit, OnDestroy {
  notifications: ForumNotification[] = [];
  unreadCount = 0;
  isOpen = false;
  loading = false;
  
  private subscriptions = new Subscription();

  constructor(
    private forumAdvancedService: ForumAdvancedService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les notifications
   */
  private loadNotifications(): void {
    const notificationsSub = this.forumAdvancedService.getNotifications().subscribe({
      next: (notifications: ForumNotification[]) => {
        this.notifications = notifications;
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des notifications:', error);
      }
    });

    this.subscriptions.add(notificationsSub);
  }

  /**
   * Bascule l'affichage des notifications
   */
  toggleNotifications(): void {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.markAllAsRead();
    }
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    this.forumAdvancedService.markNotificationAsRead(notificationId).subscribe({
      next: () => {
        console.log('✅ Notification marquée comme lue');
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du marquage comme lu:', error);
      }
    });
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    this.forumAdvancedService.markAllNotificationsAsRead().subscribe({
      next: () => {
        console.log('✅ Toutes les notifications marquées comme lues');
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du marquage de toutes comme lues:', error);
      }
    });
  }

  /**
   * Met à jour le compteur de notifications non lues
   */
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  /**
   * Navigue vers l'URL de la notification
   */
  goToNotification(notification: ForumNotification): void {
    this.router.navigate([notification.actionUrl]);
    this.markAsRead(notification.id);
    this.isOpen = false;
  }

  /**
   * Formate la date de la notification
   */
  formatDate(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    } else {
      return notificationDate.toLocaleDateString('fr-FR');
    }
  }

  /**
   * Retourne l'icône selon le type de notification
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'mention': return '@';
      case 'moderation': return '🚨';
      default: return '📢';
    }
  }

  /**
   * Retourne le texte selon le type de notification
   */
  getNotificationText(notification: ForumNotification): string {
    switch (notification.type) {
      case 'comment':
        return `${notification.userName} a commenté votre message`;
      case 'like':
        return `${notification.userName} a aimé votre message`;
      case 'mention':
        return `${notification.userName} vous a mentionné`;
      case 'moderation':
        return `Nouveau signalement à modérer`;
      default:
        return 'Notification du forum';
    }
  }

  /**
   * Efface toutes les notifications
   */
  clearAllNotifications(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les notifications ?')) {
      this.notifications = [];
      this.unreadCount = 0;
      this.cdr.detectChanges();
    }
  }

  /**
   * Ferme le panneau des notifications
   */
  closeNotifications(): void {
    this.isOpen = false;
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByNotificationId(index: number, notification: ForumNotification): string {
    return notification.id;
  }
}
