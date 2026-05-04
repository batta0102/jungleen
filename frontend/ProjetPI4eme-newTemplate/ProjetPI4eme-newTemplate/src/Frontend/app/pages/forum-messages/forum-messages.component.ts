import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClubMessageService } from '../../services/club-message.service';
import { EpingleService } from '../../services/epingle.service';
import { AuthService } from '../../services/auth.service';
import { EpingleIndicatorComponent } from '../../components/epingle/epingle-indicator/epingle-indicator.component';
import { EpingleModalComponent } from '../../components/epingle/epingle-modal/epingle-modal.component';
import { MessageCardComponent } from '../../components/message-card/message-card.component';

@Component({
  selector: 'app-forum-messages',
  imports: [CommonModule, EpingleModalComponent, MessageCardComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header professionnel -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="container mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">F</span>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">Forum du Club #{{ clubId }}</h1>
                <p class="text-sm text-gray-500">Espace de discussion</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <button class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span class="text-lg">🔍</span>
              </button>
              <button class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span class="text-lg">⚙️</span>
              </button>
              <button (click)="goBack()" 
                      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <span>←</span>
                Retour aux clubs
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Contenu principal -->
      <main class="container mx-auto px-6 py-8">
        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p class="mt-2 text-gray-600">Chargement des messages...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <!-- Messages -->
        <div *ngIf="!loading && !error">
                    
          <!-- Plus de pagination - tous les messages sont affichés -->
          <div *ngIf="pinnedMessages.length > 0" class="mt-8 text-center">
            <div class="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
              <span class="text-amber-600">📌</span>
              <span class="text-amber-800 text-sm font-medium">{{ pinnedMessages.length }} message(s) épinglé(s)</span>
            </div>
            <div class="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full ml-2">
              <span class="text-blue-600">📍</span>
              <span class="text-blue-800 text-sm font-medium">{{ maxPins - pinnedMessages.length }} épinglé(s) disponible(s)</span>
            </div>
          </div>
          
          <!-- En-tête du document -->
          <div class="mb-6 text-center border-b-2 border-gray-300 pb-4">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Forum du Club #{{ clubId }}</h1>
            <p class="text-gray-600">{{ messages.length }} message(s)  {{ currentDate | date:'dd MMMM yyyy' }}</p>
          </div>
          
          <div *ngIf="messages.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
            <p class="text-gray-500 text-lg">Aucun message trouvé pour ce club.</p>
          </div>
          
          <div *ngIf="messages.length > 0" class="space-y-6">
            <app-message-card
              *ngFor="let message of messages; trackBy: trackByMessage"
              [message]="message"
              (commentToggle)="toggleComments(message)"
              (pinRequest)="openPinModal($event)"
              (unpinRequest)="confirmUnpin($event)">
            </app-message-card>
          </div>
          
          <!-- Plus de pagination - tous les messages sont affichés -->
          <div class="mt-8 text-center text-sm text-gray-500">
            <span>{{ allMessages.length }} message(s) au total - {{ pinnedMessagesCount }} épinglé(s)</span>
          </div>
        </div>
      </main>
      
      <!-- Modale d'épinglage -->
      <app-epingle-modal
        [isVisible]="showPinModal"
        [messageId]="selectedMessageForPin?.id || selectedMessageForPin?.idMessage || selectedMessageForPin?.id_message || 0"
        (confirmPin)="confirmPin($event)"
        (cancelPin)="closePinModal()">
      </app-epingle-modal>
      
      <!-- Footer professionnel -->
      <footer class="bg-white border-t border-gray-200 mt-12">
        <div class="container mx-auto px-6 py-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              © 2026 Jungle Clubs • Forum du Club #{{ clubId }}
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>{{ messages.length }} message(s)</span>
              <span>•</span>
              <span>{{ currentDate | date:'dd MMMM yyyy' }}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: ``,
})
export class ForumMessages implements OnInit {
  clubId: number = 0;
  messages: any[] = [];
  allMessages: any[] = []; // Pour stocker tous les messages
  loading = true;
  error: string | null = null;
  currentDate = new Date();
  selectedMessageId: number | null = null;
  comments: any[] = [];
  commentsLoading = false;
  
  // Pagination
  currentPage = 1;
  messagesPerPage = 2; // 2 messages par page pour la démo
  totalPages = 1;
  
  // Épinglage
  pinnedMessages: any[] = [];
  maxPins = 3;
  showPinModal = false;
  selectedMessageForPin: any = null;
  isAdmin = false;
  canManagePins = true;
  
  // Propriété calculée pour les messages épinglés dans la liste principale
  get pinnedMessagesInMainList(): number {
    return this.allMessages.filter(m => m.isPinned).length;
  }
  
  // Propriété calculée pour le template
  get pinnedMessagesCount(): number {
    return this.allMessages.filter(m => m.isPinned).length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: ClubMessageService,
    private epingleService: EpingleService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('? Initialisation du composant forum-messages');
    
    // Vérifier si l'utilisateur est admin ou si on est sur la route admin du forum
    this.isAdmin = this.authService.isAdmin();
    this.canManagePins = true;
    console.log(`? Utilisateur admin: ${this.isAdmin}`);
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || params.get('clubId');
      console.log('? ID récupéré depuis l\'URL:', id);
      
      if (id) {
        this.clubId = parseInt(id, 10);
        console.log('? Club ID défini:', this.clubId);
        this.resolvePinPermissions();
        this.loadMessages();
      } else {
        console.error('? ID du club non trouvé dans l\'URL');
        this.error = 'ID du club invalide';
        this.loading = false;
      }
    });
  }

  resolvePinPermissions(): void {
    if (!this.clubId || this.clubId <= 0) {
      return;
    }

    this.epingleService.canPin(this.clubId).subscribe({
      next: (canPin) => {
        this.canManagePins = true;
        console.log(`? Permission d'épinglage pour le club ${this.clubId}: ${this.canManagePins}`);

        if (this.canManagePins && this.allMessages.length > 0) {
          this.loadPinnedMessages();
        }
      },
      error: () => {
        this.canManagePins = true;
      }
    });
  }

  loadMessages(): void {
    console.log(`? Chargement des messages pour le club ${this.clubId}`);
    console.log(`? Club ID actuel:`, this.clubId);
    console.log(`? MessageService disponible:`, !!this.messageService);
    
    this.loading = true;
    this.error = null;
    
    // Vérifier si le clubId est valide
    if (!this.clubId || this.clubId <= 0) {
      console.error(`? Club ID invalide: ${this.clubId}`);
      this.error = 'ID de club invalide';
      this.loading = false;
      return;
    }
    
    this.messageService.getMessagesByClub(this.clubId).subscribe({
      next: (messages: any[]) => {
        console.log(`? Messages bruts reçus:`, messages);
        console.log(`? Nombre de messages: ${messages.length}`);
        console.log(`? Type des messages:`, typeof messages);
        console.log(`? Est un tableau:`, Array.isArray(messages));
        
        if (!Array.isArray(messages)) {
          console.warn(`? Les messages reçus ne sont pas un tableau:`, messages);
          this.messages = [];
          this.allMessages = [];
        } else {
          this.allMessages = messages.map(message => ({
            ...message,
            commentCount: message.comments?.length || Math.floor(Math.random() * 5)
          }));
          
          // Afficher tous les messages sans pagination, avec les messages épinglés en haut
          const pinnedMessages = this.allMessages.filter(m => m.isPinned);
          const nonPinnedMessages = this.allMessages.filter(m => !m.isPinned);
          
          // Mettre les messages épinglés en premier, puis les autres par date
          this.messages = [...pinnedMessages, ...nonPinnedMessages];
          this.totalPages = 1;
          
          console.log(`? Messages épinglés en haut: ${pinnedMessages.length} épinglés, ${nonPinnedMessages.length} normaux`);
          console.log(`? Raisons d'épinglage:`, pinnedMessages.map(m => ({id: m.id, raison: m.raisonEpingle})));
          
          console.log(`? Messages traités:`, this.allMessages);
          console.log(`? Messages paginés:`, this.messages);
          console.log(`? Total pages:`, this.totalPages);

          if (this.canManagePins) {
            this.loadPinnedMessages();
          }
        }
        
        this.loading = false;
        this.cdr.detectChanges();
        
        // Debug timeout
        setTimeout(() => {
          console.log(`? Vérification après timeout - messages: ${this.messages.length}`);
          console.log(`? État des variables:`, {
            loading: this.loading,
            error: this.error,
            messagesLength: this.messages.length,
            allMessagesLength: this.allMessages.length,
            currentPage: this.currentPage,
            totalPages: this.totalPages
          });
        }, 100);
        // Forcer une autre détection après un délai plus long
        setTimeout(() => {
          console.log(`? Vérification finale - messages:`, this.messages.length);
          this.cdr.detectChanges();
        }, 500);
      },
      error: (error: any) => {
        console.error('? Erreur lors du chargement des messages:', error);
        console.error('? Status:', error.status);
        console.error('? Message:', error.message);
        this.error = `Impossible de charger les messages du forum: ${error.message || 'Erreur inconnue'}`;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/back/clubs']);
  }

  // Helper methods pour l'affichage
  getUserDisplayName(message: any): string {
    if (message.user?.nom) {
      console.log(`? Nom utilisateur trouvé:`, message.user.nom);
      return message.user.nom;
    }
    console.log(`? Nom utilisateur non trouvé, utilisation de fallback pour userId:`, message.userId);
    return `User ${message.userId || 'Inconnu'}`;
  }

  getUserDisplayEmail(message: any): string {
    if (message.user?.email) {
      console.log(`? Email utilisateur trouvé:`, message.user.email);
      return message.user.email;
    }
    console.log(`? Email utilisateur non trouvé, utilisation de fallback pour userId:`, message.userId);
    return `user${message.userId || 'inconnu'}@example.com`;
  }

  trackByMessage(index: number, message: any): number {
    return message.id || message.idMessage || index;
  }

  // Gérer le clic sur l'icône de commentaire
  toggleComments(message: any): void {
    const messageId = message.id || message.idMessage;
    
    if (this.selectedMessageId === messageId) {
      // Si c'est déjà le message sélectionné, fermer les commentaires
      this.selectedMessageId = null;
      this.comments = [];
    } else {
      // Ouvrir les commentaires pour ce message
      this.selectedMessageId = messageId;
      this.loadComments(messageId);
    }
  }

  // Charger les commentaires d'un message
  loadComments(messageId: number): void {
    this.commentsLoading = true;
    this.comments = [];
    
    console.log(`? Chargement des commentaires pour le message ${messageId}`);
    
    // Simuler des commentaires (à remplacer par un vrai appel API)
    setTimeout(() => {
      this.comments = [
        {
          id: 1,
          contenu: "Excellent message ! Je suis tout à fait d'accord.",
          userId: 2,
          user: {
            nom: "User 2",
            email: "user2@example.com"
          },
          dateEnvoi: new Date(Date.now() - 3600000), // Il y a 1 heure
          likes: 3
        },
        {
          id: 2,
          contenu: "Merci pour cette information très utile.",
          userId: 3,
          user: {
            nom: "User 3",
            email: "user3@example.com"
          },
          dateEnvoi: new Date(Date.now() - 7200000), // Il y a 2 heures
          likes: 1
        }
      ];
      this.commentsLoading = false;
      console.log(`? Commentaires chargés pour le message ${messageId}:`, this.comments);
    }, 500);
  }

  // Vérifier si un message a des commentaires affichés
  hasComments(message: any): boolean {
    const messageId = message.id || message.idMessage;
    return this.selectedMessageId === messageId;
  }

  // Méthodes de pagination (désactivée)
  updatePaginatedMessages(): void {
    // Afficher tous les messages sans pagination, avec les messages épinglés en haut
    const pinnedMessages = this.allMessages.filter(m => m.isPinned);
    const nonPinnedMessages = this.allMessages.filter(m => !m.isPinned);
    
    // Mettre les messages épinglés en premier, puis les autres par date
    this.messages = [...pinnedMessages, ...nonPinnedMessages];
    
    console.log(`? Messages épinglés en haut: ${pinnedMessages.length} épinglés, ${nonPinnedMessages.length} normaux`);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedMessages();
      // Fermer les commentaires quand on change de page
      this.selectedMessageId = null;
      this.comments = [];
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Méthodes pour l'épinglage
  loadPinnedMessages(): void {
    if (!this.canManagePins) return;
    
    console.log(`📌 Chargement des messages épinglés pour le club ${this.clubId}`);
    this.epingleService.getPinnedMessages(this.clubId).subscribe({
      next: (pinnedMessages) => {
        this.pinnedMessages = pinnedMessages;
        console.log(`📌 Messages épinglés chargés:`, pinnedMessages);
        
        // Synchroniser l'état d'épinglage - ne pas perdre les états existants
        pinnedMessages.forEach(pinnedMessage => {
          const message = this.allMessages.find(m => 
            (m.id === pinnedMessage.id) || 
            (m.idMessage === pinnedMessage.idMessage) || 
            (m.id_message === pinnedMessage.id_message)
          );
          if (message) {
            message.isPinned = true;
            message.raisonEpingle = pinnedMessage.raison || pinnedMessage.raisonEpingle;
            console.log(`? Synchronisation message ${message.id}: isPinned=${message.isPinned}, raisonEpingle=${message.raisonEpingle}`);
          }
        });
        
        // Marquer comme non épinglés seulement les messages qui ne sont pas dans la liste
        const pinnedMessageIds = pinnedMessages.map(pm => pm.id || pm.idMessage || pm.id_message);
        this.allMessages.forEach(message => {
          const messageId = message.id || message.idMessage || message.id_message;
          if (!pinnedMessageIds.includes(messageId)) {
            message.isPinned = false;
            message.raisonEpingle = null;
          }
        });
        
        console.log(`? Messages synchronisés avec état d'épinglage:`, this.allMessages);
        console.log(`? Messages épinglés trouvés:`, this.allMessages.filter(m => m.isPinned));
        console.log(`? Page actuelle: ${this.currentPage}, Messages par page: ${this.messagesPerPage}`);
        this.updatePaginatedMessages();

        // Vérifier après la mise à jour de la pagination
        setTimeout(() => {
          console.log(`? Messages affichés sur la page:`, this.messages);
          console.log(`? Messages épinglés sur la page:`, this.messages.filter(m => m.isPinned));
        }, 200);
      },
      error: (error) => {
        console.error(`📌 Erreur lors du chargement des messages épinglés:`, error);
      }
    });
  }

  openPinModal(message: any): void {
    console.log('? openPinModal appelé avec message:', message);
    console.log('? Propriétés du message:', Object.keys(message));
    console.log('? message.id:', message.id);
    console.log('? message.idMessage:', message.idMessage);
    console.log('? message.id_message:', message.id_message);
    
    this.selectedMessageForPin = message;
    this.showPinModal = true;
  }

  closePinModal(): void {
    this.showPinModal = false;
    this.selectedMessageForPin = null;
  }

  confirmPin(event: any): void {
    console.log('? confirmPin appelé avec event:', event);
    
    if (!event) {
      console.error('? Event est null/undefined');
      return;
    }
    
    if (!event.raison || !event.raison.trim()) {
      console.error('? Raison invalide:', event.raison);
      return;
    }
    
    const messageId = event.messageId || event.id || event.idMessage || event.id_message;
    console.log('? Message ID extrait:', messageId);
    console.log('? Raison:', event.raison);
    
    if (!messageId) {
      console.error('? Message ID invalide:', messageId);
      alert('ID du message invalide');
      return;
    }
    
    console.log(`? Appel de epingleService.pinMessage(${messageId}, "${event.raison}")`);
    
    this.epingleService.pinMessage(messageId, event.raison).subscribe({
      next: (response) => {
        console.log(`? Message épinglé avec succès:`, response);
        this.closePinModal();
        
        // Mettre à jour le message localement pour un affichage immédiat
        setTimeout(() => {
          const message = this.allMessages.find(m => 
            (m.id === messageId) || (m.idMessage === messageId) || (m.id_message === messageId)
          );
          if (message) {
            message.isPinned = true;
            message.raisonEpingle = event.raison;
            console.log('? Message mis à jour localement:', message);
          }
          
          // Recharger les messages pour la synchronisation complète
          this.loadMessages();
          this.loadPinnedMessages();
        }, 0);
      },
      error: (error) => {
        console.error(`? Erreur lors de l'épinglage:`, error);
        console.error('? Status:', error.status);
        console.error('? Message:', error.message);
        console.error('? URL:', error.url);
        alert(`Erreur lors de l'épinglage du message: ${error.message || 'Erreur inconnue'}`);
      }
    });
  }

  confirmUnpin(message: any): void {
    if (!confirm('Êtes-vous sûr de vouloir désépingler ce message ?')) return;
    
    const messageId = message.id || message.idMessage;
    console.log(`? Confirmation de désépinglage du message ${messageId}`);
    
    this.epingleService.unpinMessage(messageId).subscribe({
      next: (response) => {
        console.log(`? Message désépinglé avec succès:`, response);
        
        setTimeout(() => {
          // Mettre à jour le message localement
          const localMessage = this.allMessages.find(m => 
            (m.id === messageId) || (m.idMessage === messageId) || (m.id_message === messageId)
          );
          if (localMessage) {
            localMessage.isPinned = false;
            localMessage.raisonEpingle = null;
          }
          
          // Recharger les messages
          this.loadMessages();
          this.loadPinnedMessages();
        }, 0);
      },
      error: (error) => {
        console.error(`? Erreur lors du désépinglage:`, error);
        alert('Erreur lors du désépinglage du message');
      }
    });
  }
}
