import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { tap, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClubMessageService } from '../../services/club-message.service';
import { CommentService } from '../../services/comment.service';
import { ClubMessage, Comment, ForumStats } from '../../models/forum.models';

// Interface pour les statistiques étendues
interface AdminForumStats {
  totalMessages: number;
  totalComments: number;
  totalLikes: number;
  activeUsers: number;
  messagesThisWeek: number;
  totalSessions: number;
  averageSessionsPerBuddy: number;
  averageSessionDuration: number;
  messagesPerDay: number;
  topMessages: {
    id: number;
    contenu: string;
    likes: number;
    comments: number;
    author: string;
  }[];
  topContributors: {
    userId: number;
    userName: string;
    messageCount: number;
    commentCount: number;
  }[];
}

// Interface pour les messages avec informations enrichies
interface AdminMessageItem extends ClubMessage {
  authorName: string;
  authorEmail: string;
  commentCount: number;
}
  
@Component({
  selector: 'app-admin-club-forum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-club-forum.component.html',
  styleUrls: ['./admin-club-forum.component.scss']
})
export class AdminClubForumComponent implements OnInit, OnDestroy {
  clubId: number = 0;
  messages: AdminMessageItem[] = [];
  stats: AdminForumStats | null = null;
  loading = true;
  error: string | null = null;
  
  // Propriétés pour le template
  Math = Math;
  
  // Formulaire de filtres
  filterForm: FormGroup;
  
  // États de chargement
  loadingStats = true;
  loadingMessages = true;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // États pour les actions
  selectedMessages = new Set<number>();
  moderatingMessages = new Set<number>();
  deletingMessages = new Set<number>();
  
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private messageService: ClubMessageService,
    private commentService: CommentService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.createFilterForm();
    this.setupFilterListeners();
  }

  ngOnInit(): void {
    // Récupérer l'ID du club depuis l'URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clubId = parseInt(id, 10);
        this.loadForumData();
      } else {
        this.error = 'ID du club invalide';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Crée le formulaire de filtres
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      dateRange: ['all'], // all, today, week, month, quarter, year
      userId: [''],
      keywords: [''],
      sortBy: ['date'], // date, likes, comments
      sortOrder: ['desc'] // asc, desc
    });
  }

  /**
   * Configure les écouteurs de filtres
   */
  private setupFilterListeners(): void {
    const filterSub = this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadMessages();
    });

    this.subscriptions.add(filterSub);
  }

  /**
   * Charge les données du forum
   */
  loadForumData(): void {
    this.loadStats();
    this.loadMessages();
  }

  /**
   * Charge les statistiques du forum
   */
  private loadStats(): void {
    console.log(`🔄 Chargement des statistiques du forum ${this.clubId}`);
    this.loadingStats = true;
    
    const statsSub = this.messageService.getForumStats(this.clubId).subscribe({
      next: (stats: ForumStats) => {
        console.log('✅ Statistiques reçues:', stats);
        
        // Enrichir les statistiques pour l'admin
        this.stats = {
          totalMessages: stats.totalMessages,
          totalComments: stats.totalComments,
          totalLikes: stats.totalLikes,
          activeUsers: stats.activeUsers,
          messagesThisWeek: stats.messagesThisWeek,
          totalSessions: 0, // Valeur par défaut si non disponible
          averageSessionsPerBuddy: 0, // Valeur par défaut si non disponible
          averageSessionDuration: 0, // Valeur par défaut si non disponible
          messagesPerDay: this.calculateMessagesPerDay(stats),
          topMessages: this.getTopMessages(stats),
          topContributors: stats.topContributors || []
        };
        
        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(statsSub);
  }

  /**
   * Charge les messages du club
   */
  private loadMessages(): void {
    console.log(`🔄 Chargement des messages du club ${this.clubId}`);
    this.loadingMessages = true;
    
    const messagesSub = this.messageService.getMessagesByClub(this.clubId).subscribe({
      next: (messages: ClubMessage[]) => {
        console.log('✅ Messages reçus:', messages);
        
        // Enrichir les messages pour l'admin
        this.messages = this.enrichMessages(messages);
        this.applyFilters();
        this.totalItems = this.messages.length;
        
        this.loadingMessages = false;
        this.loading = false;
        console.log('✅ Loading terminé, isLoading =', this.loading);
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
        console.log('🔄 Change detection forcée');
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des messages:', error);
        this.error = 'Impossible de charger les messages du forum';
        this.loadingMessages = false;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(messagesSub);
  }

  /**
   * Enrichit les messages avec les informations administratives
   */
  private enrichMessages(messages: ClubMessage[]): AdminMessageItem[] {
    return messages.map(message => ({
      ...message,
      authorName: message.user?.nom || 'Utilisateur inconnu',
      authorEmail: message.user?.email || 'email@inconnu.com',
      commentCount: Math.floor(Math.random() * 10) // Simulation - à remplacer avec vraie donnée
    }));
  }

  /**
   * Applique les filtres aux messages
   */
  private applyFilters(): void {
    const filters = this.filterForm.value;
    console.log('🎛️ Application des filtres:', filters);
    
    let filtered = [...this.messages];
    
    // Filtre par date
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(message => 
        new Date(message.dateEnvoi) >= startDate
      );
    }
    
    // Filtre par utilisateur
    if (filters.userId && filters.userId.trim()) {
      const userId = parseInt(filters.userId, 10);
      if (!isNaN(userId)) {
        filtered = filtered.filter(message => 
          message.userId === userId
        );
      }
    }
    
    // Filtre par mots-clés
    if (filters.keywords && filters.keywords.trim()) {
      const keywords = filters.keywords.toLowerCase().trim();
      filtered = filtered.filter(message => 
        message.contenu.toLowerCase().includes(keywords) ||
        message.authorName.toLowerCase().includes(keywords) ||
        message.authorEmail.toLowerCase().includes(keywords)
      );
    }
    
        
    // Tri
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime();
            break;
          case 'likes':
            comparison = a.likes - b.likes;
            break;
          case 'comments':
            comparison = a.commentCount - b.commentCount;
            break;
        }
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    this.messages = filtered;
    this.totalItems = filtered.length;
    console.log('✅ Filtres appliqués:', filtered.length, 'messages');
  }

  /**
   * Calcule la moyenne de messages par jour
   */
  private calculateMessagesPerDay(stats: ForumStats): number {
    // Simulation - calculer basé sur les données réelles
    return Math.round(stats.totalMessages / 30); // Moyenne sur 30 jours
  }

  /**
   * Récupère les messages les plus populaires
   */
  private getTopMessages(stats: ForumStats): AdminForumStats['topMessages'] {
    // Simulation - basé sur les messages chargés
    return this.messages
      .filter(message => message.id !== undefined)
      .slice(0, 5)
      .map(message => ({
        id: message.id!,
        contenu: message.contenu.substring(0, 100) + '...',
        likes: message.likes,
        comments: message.commentCount,
        author: message.authorName
      }));
  }

  /**
   * Navigue vers le détail d'un message
   */
  viewMessage(messageId: number | undefined): void {
    if (!messageId) return;
    console.log(`🔗 Navigation vers le détail du message ${messageId}`);
    this.router.navigate(['/clubs', this.clubId, 'messages', messageId]);
  }

  /**
   * Supprime un message
   */
  deleteMessage(messageId: number | undefined, event?: Event): void {
    if (!messageId) return;
    if (event) {
      event.stopPropagation();
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) {
      return;
    }

    console.log(`🗑️ Suppression du message ${messageId}`);
    this.deletingMessages.add(messageId);
    
    const deleteSub = this.messageService.deleteMessage(messageId).pipe(
      finalize(() => {
        this.deletingMessages.delete(messageId);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        console.log(`✅ Message ${messageId} supprimé avec succès`);
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.totalItems = this.messages.length;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error(`❌ Erreur lors de la suppression du message ${messageId}:`, error);
        this.error = 'Impossible de supprimer le message';
      }
    });

    this.subscriptions.add(deleteSub);
  }

  
  /**
   * Sélectionne/désélectionne un message
   */
  toggleMessageSelection(messageId: number | undefined): void {
    if (!messageId) return;
    if (this.selectedMessages.has(messageId)) {
      this.selectedMessages.delete(messageId);
    } else {
      this.selectedMessages.add(messageId);
    }
    this.cdr.detectChanges();
  }

  /**
   * Sélectionne/désélectionne tous les messages
   */
  toggleSelectAll(): void {
    if (this.selectedMessages.size === this.messages.length) {
      this.selectedMessages.clear();
    } else {
      this.messages.forEach(message => {
        if (message.id !== undefined) {
          this.selectedMessages.add(message.id);
        }
      });
    }
    this.cdr.detectChanges();
  }

  /**
   * Action groupée sur les messages sélectionnés
   */
  bulkAction(action: 'delete'): void {
    if (this.selectedMessages.size === 0) return;
    
    const actionText = 'supprimer';
    if (!confirm(`Êtes-vous sûr de vouloir ${actionText} ${this.selectedMessages.size} message(s) ?`)) {
      return;
    }
    
    console.log(`🔧 Action groupée: ${action} sur ${this.selectedMessages.size} messages`);
    
    // Exécuter l'action sur chaque message sélectionné
    this.selectedMessages.forEach(messageId => {
      this.deleteMessage(messageId);
    });
    
    // Vider la sélection
    this.selectedMessages.clear();
    this.cdr.detectChanges();
  }

  /**
   * Formate la date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Tronque le texte
   */
  truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Change de page
   */
  changePage(page: number): void {
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  /**
   * Retourne les messages de la page actuelle
   */
  get paginatedMessages(): AdminMessageItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.messages.slice(startIndex, endIndex);
  }

  /**
   * Retourne le nombre total de pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Vérifie si un message est en cours de suppression
   */
  isDeletingMessage(messageId: number | undefined): boolean {
    return messageId ? this.deletingMessages.has(messageId) : false;
  }

  /**
   * Vérifie si un message est en cours de modération
   */
  isModeratingMessage(messageId: number | undefined): boolean {
    return messageId ? this.moderatingMessages.has(messageId) : false;
  }

  /**
   * Helper pour obtenir l'ID d'un message de manière sécurisée
   */
  getMessageId(message: any): number {
    const id = message?.idMessage || message?.id;
    if (!id) {
      throw new Error('Message ID is required but not found');
    }
    return id;
  }

  /**
   * Vérifie si un message est sélectionné
   */
  isMessageSelected(messageId: number | undefined): boolean {
    if (!messageId) return false;
    return this.selectedMessages.has(messageId);
  }

  /**
   * Retourne au dashboard admin
   */
  goBack(): void {
    this.router.navigate(['/admin/clubs']);
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByMessageId(index: number, message: AdminMessageItem): number {
    return message.id!;
  }

  /**
   * Retourne les numéros de page à afficher
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
