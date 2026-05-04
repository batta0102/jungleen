import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification, NotificationType } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  currentToast: Notification | null = null;
  private subscription: Subscription | null = null;
  private timeoutId: any = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getCurrentToast().subscribe(toast => {
      this.currentToast = toast;
      
      if (toast) {
        // Auto-dismiss après la durée spécifiée
        this.timeoutId = setTimeout(() => {
          this.dismiss();
        }, toast.duration);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  /**
   * Dismiss le toast manuellement
   */
  dismiss(): void {
    if (this.currentToast) {
      this.notificationService.dismissToast(this.currentToast.id);
      this.currentToast = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Exécute l'action du toast
   */
  executeAction(): void {
    if (this.currentToast?.action) {
      this.currentToast.action.callback();
      this.dismiss();
    }
  }

  /**
   * Obtient les classes CSS selon le type de notification
   */
  getToastClasses(): string {
    if (!this.currentToast) return '';
    
    const baseClasses = 'fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out z-50';
    
    switch (this.currentToast.type) {
      case NotificationType.SUCCESS:
        return `${baseClasses} border-green-500`;
      case NotificationType.ERROR:
        return `${baseClasses} border-red-500`;
      case NotificationType.WARNING:
        return `${baseClasses} border-yellow-500`;
      case NotificationType.INFO:
        return `${baseClasses} border-blue-500`;
      default:
        return `${baseClasses} border-gray-500`;
    }
  }

  /**
   * Obtient l'icône selon le type
   */
  getIcon(): string {
    if (!this.currentToast) return '';
    
    switch (this.currentToast.type) {
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
   * Obtient la classe de couleur du titre
   */
  getTitleClass(): string {
    if (!this.currentToast) return '';
    
    switch (this.currentToast.type) {
      case NotificationType.SUCCESS:
        return 'text-green-800';
      case NotificationType.ERROR:
        return 'text-red-800';
      case NotificationType.WARNING:
        return 'text-yellow-800';
      case NotificationType.INFO:
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  /**
   * Obtient la classe de couleur du message
   */
  getMessageClass(): string {
    if (!this.currentToast) return '';
    
    switch (this.currentToast.type) {
      case NotificationType.SUCCESS:
        return 'text-green-700';
      case NotificationType.ERROR:
        return 'text-red-700';
      case NotificationType.WARNING:
        return 'text-yellow-700';
      case NotificationType.INFO:
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  /**
   * Vérifie si le toast est visible
   */
  isVisible(): boolean {
    return this.currentToast !== null;
  }
}
