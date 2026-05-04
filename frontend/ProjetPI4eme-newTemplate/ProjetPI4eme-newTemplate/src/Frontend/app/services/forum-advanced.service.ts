import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// Interfaces pour les notifications
export interface ForumNotification {
  id: string;
  type: 'comment' | 'like' | 'mention' | 'moderation';
  userId: number;
  userName: string;
  userAvatar?: string;
  messageId?: number;
  commentId?: number;
  messageContent?: string;
  commentContent?: string;
  clubId: number;
  clubName: string;
  createdAt: Date;
  read: boolean;
  actionUrl: string;
}

export interface ForumSettings {
  infiniteScroll: boolean;
  notifications: boolean;
  editing: boolean;
  reporting: boolean;
  badges: boolean;
  search: boolean;
  pinning: boolean;
  itemsPerPage: number;
}

export interface UserBadge {
  id: number;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  description: string;
  icon: string;
  requirements: {
    messages: number;
    likes: number;
    comments: number;
  };
  unlocked: boolean;
  progress: number;
}

export interface SearchResult {
  messageId: number;
  messageContent: string;
  authorName: string;
  dateEnvoi: Date;
  likes: number;
  comments: number;
  relevanceScore: number;
  highlightedContent: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForumAdvancedService {
  private notificationsSubject = new BehaviorSubject<ForumNotification[]>([]);
  private settingsSubject = new BehaviorSubject<ForumSettings>({
    infiniteScroll: true,
    notifications: true,
    editing: true,
    reporting: true,
    badges: true,
    search: true,
    pinning: true,
    itemsPerPage: 10
  });
  private badgesSubject = new BehaviorSubject<UserBadge[]>([]);

  // Observables publics
  notifications$ = this.notificationsSubject.asObservable();
  settings$ = this.settingsSubject.asObservable();
  badges$ = this.badgesSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialise les données mock pour le développement
   */
  private initializeMockData(): void {
    // Notifications mock
    const mockNotifications: ForumNotification[] = [
      {
        id: '1',
        type: 'comment',
        userId: 2,
        userName: 'Alice Martin',
        userAvatar: '👩‍🎓',
        messageId: 1,
        commentId: 1,
        messageContent: 'Bienvenue à tous dans notre club !',
        commentContent: 'Merci pour ce message très utile !',
        clubId: 1,
        clubName: 'English Club',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        actionUrl: '/clubs/1/messages/1'
      },
      {
        id: '2',
        type: 'like',
        userId: 3,
        userName: 'Bob Wilson',
        userAvatar: '👨‍💼',
        messageId: 1,
        messageContent: 'Bienvenue à tous dans notre club !',
        clubId: 1,
        clubName: 'English Club',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        read: false,
        actionUrl: '/clubs/1/messages/1'
      }
    ];

    // Badges mock
    const mockBadges: UserBadge[] = [
      {
        id: 1,
        type: 'bronze',
        name: 'Débutant',
        description: 'Premiers pas dans le forum',
        icon: '🥉',
        requirements: { messages: 1, likes: 0, comments: 0 },
        unlocked: true,
        progress: 100
      },
      {
        id: 2,
        type: 'silver',
        name: 'Participant Actif',
        description: 'Membre régulier du forum',
        icon: '🥈',
        requirements: { messages: 10, likes: 5, comments: 10 },
        unlocked: false,
        progress: 60
      },
      {
        id: 3,
        type: 'gold',
        name: 'Expert',
        description: 'Contributeur expert du forum',
        icon: '🥇',
        requirements: { messages: 50, likes: 25, comments: 50 },
        unlocked: false,
        progress: 30
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.badgesSubject.next(mockBadges);
  }

  /**
   * Récupère les notifications de l'utilisateur
   */
  getNotifications(): Observable<ForumNotification[]> {
    return this.notifications$;
  }

  /**
   * Marque une notification comme lue
   */
  markNotificationAsRead(notificationId: string): Observable<void> {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updatedNotifications);
    return of(void 0);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllNotificationsAsRead(): Observable<void> {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updatedNotifications);
    return of(void 0);
  }

  /**
   * Ajoute une nouvelle notification
   */
  addNotification(notification: Omit<ForumNotification, 'id' | 'createdAt' | 'read'>): void {
    const newNotification: ForumNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);
  }

  /**
   * Récupère les paramètres du forum
   */
  getSettings(): Observable<ForumSettings> {
    return this.settings$;
  }

  /**
   * Met à jour un paramètre du forum
   */
  updateSetting(key: keyof ForumSettings, value: any): void {
    const currentSettings = this.settingsSubject.value;
    const updatedSettings = { ...currentSettings, [key]: value };
    this.settingsSubject.next(updatedSettings);
    localStorage.setItem('forumSettings', JSON.stringify(updatedSettings));
  }

  /**
   * Récupère les badges de l'utilisateur
   */
  getUserBadges(): Observable<UserBadge[]> {
    return this.badges$;
  }

  /**
   * Met à jour les badges de l'utilisateur
   */
  updateUserBadges(userStats: { messages: number; likes: number; comments: number }): void {
    const currentBadges = this.badgesSubject.value;
    const updatedBadges = currentBadges.map(badge => {
      const progress = this.calculateBadgeProgress(badge, userStats);
      return {
        ...badge,
        progress,
        unlocked: progress >= 100
      };
    });
    this.badgesSubject.next(updatedBadges);
  }

  /**
   * Calcule le progrès d'un badge
   */
  private calculateBadgeProgress(badge: UserBadge, userStats: { messages: number; likes: number; comments: number }): number {
    const messageProgress = Math.min((userStats.messages / badge.requirements.messages) * 100, 100);
    const likesProgress = Math.min((userStats.likes / badge.requirements.likes) * 100, 100);
    const commentsProgress = Math.min((userStats.comments / badge.requirements.comments) * 100, 100);
    
    return Math.round((messageProgress + likesProgress + commentsProgress) / 3);
  }

  /**
   * Recherche dans les messages du club
   */
  searchMessages(clubId: number, query: string): Observable<SearchResult[]> {
    console.log(`🔍 Recherche dans les messages du club ${clubId}: "${query}"`);
    
    // Simulation de recherche - à remplacer avec appel API réel
    const mockResults: SearchResult[] = [
      {
        messageId: 1,
        messageContent: 'Bienvenue à tous dans notre club ! N\'hésitez pas à poser vos questions.',
        authorName: 'Alice Martin',
        dateEnvoi: new Date('2024-01-15'),
        likes: 5,
        comments: 3,
        relevanceScore: 95,
        highlightedContent: 'Bienvenue à tous dans notre <mark>club</mark> ! N\'hésitez pas à poser vos questions.'
      },
      {
        messageId: 2,
        messageContent: 'Quelqu\'un serait intéressé par une session de conversation demain ?',
        authorName: 'Bob Wilson',
        dateEnvoi: new Date('2024-01-16'),
        likes: 3,
        comments: 2,
        relevanceScore: 85,
        highlightedContent: 'Quelqu\'un serait intéressé par une session de <mark>conversation</mark> demain ?'
      }
    ];

    return of(mockResults).pipe(
      tap(results => console.log('✅ Résultats de recherche:', results))
    );
  }

  /**
   * Signale un message inapproprié
   */
  reportMessage(messageId: number, reason: string, userId: number): Observable<void> {
    console.log(`🚨 Signalement du message ${messageId} par l'utilisateur ${userId}: "${reason}"`);
    
    // Simulation - à remplacer avec appel API réel
    return of(void 0).pipe(
      tap(() => {
        // Ajouter une notification pour les admins
        this.addNotification({
          type: 'moderation',
          userId: userId,
          userName: 'Utilisateur actuel',
          messageContent: 'Message signalé pour modération',
          clubId: 1,
          clubName: 'English Club',
          actionUrl: '/admin/clubs/1/forum'
        });
      })
    );
  }

  /**
   * Épingle un message (admin uniquement)
   */
  pinMessage(messageId: number, clubId: number, userId: number): Observable<void> {
    console.log(`📌 Épinglage du message ${messageId} dans le club ${clubId} par l'admin ${userId}`);
    
    // Simulation - à remplacer avec appel API réel
    return of(void 0);
  }

  /**
   * Désépingle un message (admin uniquement)
   */
  unpinMessage(messageId: number, clubId: number, userId: number): Observable<void> {
    console.log(`📍 Désépinglage du message ${messageId} dans le club ${clubId} par l'admin ${userId}`);
    
    // Simulation - à remplacer avec appel API réel
    return of(void 0);
  }

  /**
   * Compte les notifications non lues
   */
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  /**
   * Charge les paramètres depuis le localStorage
   */
  loadSettings(): void {
    const savedSettings = localStorage.getItem('forumSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.settingsSubject.next({ ...this.settingsSubject.value, ...settings });
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    }
  }
}
