import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionNotificationService, SessionPopup, SessionProche } from '../../services/session-notification.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.css']
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  private sessionNotificationService = inject(SessionNotificationService);
  
  // Signaux pour l'état
  popups = signal<SessionPopup[]>([]);
  
  // Signal calculé pour les popups visibles
  popupsVisibles = computed(() => 
    this.popups().filter(popup => popup.visible)
  );
  
  ngOnInit(): void {
    console.log('🎯 NotificationPopupComponent initialisé');
    
    // S'abonner aux popups du service
    this.sessionNotificationService.popups.subscribe(popups => {
      this.popups.set(popups);
    });
  }
  
  ngOnDestroy(): void {
    // Arrêter le polling quand le composant est détruit
    this.sessionNotificationService.arreterPolling();
  }
  
  /**
   * Confirme la présence à une session
   */
  confirmerSession(session: SessionProche): void {
    this.sessionNotificationService.confirmerSession(session.sessionId);
  }
  
  /**
   * Marque la session comme vue (ferme la popup)
   */
  marquerVue(session: SessionProche): void {
    this.sessionNotificationService.marquerVue(session.sessionId);
  }
  
  /**
   * Ferme manuellement une popup
   */
  fermerPopup(sessionId: number): void {
    this.sessionNotificationService.marquerVue(sessionId);
  }
  
  /**
   * Obtient la classe CSS selon le niveau d'urgence
   */
  getUrgenceClass(date: string): string {
    const niveau = this.sessionNotificationService.getNiveauUrgence(date);
    switch (niveau) {
      case 'critique': return 'urgence-critique';
      case 'urgent': return 'urgence-urgent';
      default: return 'urgence-normal';
    }
  }
  
  /**
   * Obtient l'icône selon le niveau d'urgence
   */
  getUrgenceIcon(date: string): string {
    const niveau = this.sessionNotificationService.getNiveauUrgence(date);
    switch (niveau) {
      case 'critique': return '🚨';
      case 'urgent': return '⚠️';
      default: return '📅';
    }
  }
  
  /**
   * Formate la date pour l'affichage
   */
  formaterDate(date: string): string {
    return this.sessionNotificationService.formaterDate(date);
  }
  
  /**
   * Obtient le temps restant
   */
  getTempsRestant(date: string): string {
    return this.sessionNotificationService.getTempsRestant(date);
  }
}
