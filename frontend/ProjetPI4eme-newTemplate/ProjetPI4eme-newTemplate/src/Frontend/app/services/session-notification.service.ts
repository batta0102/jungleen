import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { switchMap, catchError, takeUntil, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface SessionProche {
  sessionId: number;
  sujet: string;
  date: string;
  heure: string;
  duree: number;
  lieu: string;
  notes: string;
}

export interface SessionPopup {
  id: string;
  session: SessionProche;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SessionNotificationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  // État des notifications de session
  private sessionsProchesSubject = new BehaviorSubject<SessionProche[]>([]);
  public sessionsProches = this.sessionsProchesSubject.asObservable();
  
  // État des popups actives
  private popupsSubject = new BehaviorSubject<SessionPopup[]>([]);
  public popups = this.popupsSubject.asObservable();
  
  // Configuration du polling
  private readonly POLLING_INTERVAL = 30000; // 30 secondes
  private readonly API_BASE_URL = '/api';
  
  // Gestion des abonnements
  private pollingSubscription: any = null;
  
  constructor() {
    console.log('🔔 SessionNotificationService initialisé');
    this.startPolling();
  }
  
  /**
   * Démarre le polling pour vérifier les sessions proches
   */
  private startPolling(): void {
    console.log('⏰ Démarrage de la vérification des sessions toutes les 30s');
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL).pipe(
      switchMap(() => this.checkSessionsProches()),
      catchError(error => {
        console.error('❌ Erreur lors de la vérification des sessions:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  /**
   * Vérifie les sessions proches pour l'utilisateur courant
   */
  checkSessionsProches(): Observable<SessionProche[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('Pas d\'utilisateur connecté, skip vérification sessions');
      return of([]);
    }
    
    console.log(`Vérification des sessions proches pour l'utilisateur ${userId}`);
    
    return this.http.get<SessionProche[]>(`${this.API_BASE_URL}/notifications/sessions-proches/${userId}`).pipe(
      tap(sessions => {
        console.log('Sessions proches reçues:', sessions);
        this.processerSessions(sessions);
      }),
      catchError(error => {
        console.error('Erreur API sessions proches:', error);
        
        // Mode de test désactivé - plus de sessions factices
        // if (error.status === 500) {
        //   console.log('Mode de test activé - création session factice');
        //   const sessionTest: SessionProche = {
        //     sessionId: 999,
        //     sujet: 'Session Test (API Error)',
        //     date: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutes
        //     heure: new Date(Date.now() + 3 * 60 * 1000).toTimeString().split(' ')[0],
        //     duree: 60,
        //     lieu: 'Test Location',
        //     notes: 'Session de test pour démo'
        //   };
        //   this.processerSessions([sessionTest]);
        //   return of([sessionTest]);
        // }
        
        return of([]);
      })
    );
  }
  
  /**
   * Traite les sessions reçues et déclenche les popups
   */
  processerSessions(sessions: SessionProche[]): void {
    const sessionsActuelles = this.sessionsProchesSubject.value;
    const nouvellesSessions = sessions.filter(session => 
      !sessionsActuelles.some(s => s.sessionId === session.sessionId)
    );
    
    if (nouvellesSessions.length > 0) {
      console.log('🔔 Nouvelles sessions proches détectées:', nouvellesSessions);
      
      // Mettre à jour la liste des sessions
      this.sessionsProchesSubject.next(sessions);
      
      // Créer des popups pour les nouvelles sessions
      nouvellesSessions.forEach(session => this.afficherPopup(session));
    }
    
    // Nettoyer les anciennes sessions
    const sessionsFiltrees = sessions.filter(session => this.isSessionValide(session));
    this.sessionsProchesSubject.next(sessionsFiltrees);
  }
  
  /**
   * Affiche une popup pour une session proche
   */
  private afficherPopup(session: SessionProche): void {
    console.log('🚨 Affichage popup pour session:', session);
    
    const popup: SessionPopup = {
      id: this.generatePopupId(),
      session,
      visible: true
    };
    
    const popupsActuelles = this.popupsSubject.value;
    this.popupsSubject.next([...popupsActuelles, popup]);
    
    // Jouer un son de notification
    this.jouerSonNotification();
  }
  
  /**
   * Marque une session comme vue (ferme la popup)
   */
  marquerVue(sessionId: number): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    console.log(`Marquage session ${sessionId} comme vue pour utilisateur ${userId}`);
    
    this.http.post<void>(`${this.API_BASE_URL}/notifications/marquer-vue/${sessionId}/${userId}`, {})
      .pipe(
        tap(() => {
          console.log('Session marquée comme vue');
          this.fermerPopup(sessionId);
        }),
        catchError(error => {
          console.error('Erreur marquage session vue:', error);
          // Mode de test : fermer la popup même si l'API échoue
          this.fermerPopup(sessionId);
          return of(null);
        })
      ).subscribe();
  }
  
  /**
   * Confirme la présence à une session
   */
  confirmerSession(sessionId: number): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    console.log(`Confirmation session ${sessionId} pour utilisateur ${userId}`);
    
    this.http.post<any>(`${this.API_BASE_URL}/buddySessions/${sessionId}/confirm/${userId}?satisfaction=BIEN`, {})
      .pipe(
        tap(() => {
          console.log('Session confirmée avec succès');
          this.fermerPopup(sessionId);
          // Afficher un message de succès
          this.afficherMessageSucces();
        }),
        catchError(error => {
          console.error('Erreur confirmation session:', error);
          // Mode de test : fermer la popup et afficher message d'erreur
          this.fermerPopup(sessionId);
          this.afficherMessageErreur();
          return of(null);
        })
      ).subscribe();
  }
  
  /**
   * Ferme une popup spécifique
   */
  private fermerPopup(sessionId: number): void {
    const popupsActuelles = this.popupsSubject.value;
    const popupsMisesAJour = popupsActuelles.filter(popup => popup.session.sessionId !== sessionId);
    this.popupsSubject.next(popupsMisesAJour);
  }
  
  /**
   * Ferme toutes les popups
   */
  fermerToutesLesPopups(): void {
    console.log('🔇 Fermeture de toutes les popups');
    this.popupsSubject.next([]);
  }
  
  /**
   * Arrête le polling
   */
  arreterPolling(): void {
    console.log('⏹ Arrêt du polling des sessions');
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
  
  /**
   * Obtient l'ID de l'utilisateur courant
   */
  private getCurrentUserId(): number {
    return this.authService.getCurrentUserId();
  }
  
  /**
   * Vérifie si une session est encore valide (pas encore passée)
   */
  private isSessionValide(session: SessionProche): boolean {
    const sessionDate = new Date(session.date);
    const maintenant = new Date();
    return sessionDate > maintenant;
  }
  
  /**
   * Génère un ID unique pour les popups
   */
  private generatePopupId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Joue un son de notification
   */
  private jouerSonNotification(): void {
    try {
      const audio = new Audio();
      // Son de notification système (base64)
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Impossible de jouer la sonnerie:', e));
    } catch (error) {
      console.error('Erreur lors de la lecture de la sonnerie:', error);
    }
  }
  
  /**
   * Affiche un message de succès
   */
  private afficherMessageSucces(): void {
    // Vous pouvez intégrer avec votre service de notification existant
    console.log('✅ Session confirmée avec succès !');
    // Exemple : this.notificationService.showSuccess('Session confirmée', 'Votre présence a été enregistrée');
  }
  
  /**
   * Affiche un message d'erreur
   */
  private afficherMessageErreur(): void {
    console.error('❌ Erreur lors de la confirmation de la session');
    // Exemple : this.notificationService.showError('Erreur', 'Impossible de confirmer la session');
  }
  
  /**
   * Formate la date pour l'affichage
   */
  formaterDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Calcule le temps restant avant la session
   */
  getTempsRestant(dateStr: string): string {
    const sessionDate = new Date(dateStr);
    const maintenant = new Date();
    const difference = sessionDate.getTime() - maintenant.getTime();
    
    if (difference <= 0) return 'Commence maintenant';
    
    const minutes = Math.floor(difference / (1000 * 60));
    if (minutes < 60) {
      return `Commence dans ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    const heures = Math.floor(minutes / 60);
    const minutesRestants = minutes % 60;
    return `Commence dans ${heures}h${minutesRestants > 0 ? minutesRestants : ''}`;
  }
  
  /**
   * Détermine le niveau d'urgence
   */
  getNiveauUrgence(dateStr: string): 'critique' | 'urgent' | 'normal' {
    const sessionDate = new Date(dateStr);
    const maintenant = new Date();
    const difference = sessionDate.getTime() - maintenant.getTime();
    const minutes = Math.floor(difference / (1000 * 60));
    
    if (minutes <= 3) return 'critique';
    if (minutes <= 5) return 'urgent';
    return 'normal';
  }
}
