import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ClubMessage, CreateMessageDTO, ForumStats } from '../models/forum.models';

@Injectable({
  providedIn: 'root'
})
export class ClubMessageService {
  private readonly apiUrl = '/api';
  private readonly messagesEndpoint = `${this.apiUrl}/clubMessages`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les messages d'un club
   * Endpoint: GET /api/clubMessages/all/By-Club/{clubId}
   */
  getMessagesByClub(clubId: number): Observable<ClubMessage[]> {
    const url = `${this.messagesEndpoint}/all/By-Club/${clubId}`;
    console.log(`? Chargement des messages du club ${clubId}`);
    console.log(`? URL appelée: ${url}`);
    console.log(`? HttpClient disponible:`, !!this.http);
    
    return this.http.get<any[]>(url).pipe(
      tap(response => {
        console.log(`? Réponse HTTP brute:`, response);
        console.log(`? Type de la réponse:`, typeof response);
        console.log(`? Est un tableau:`, Array.isArray(response));
      }),
      map((messages: any[]) => {
        console.log(`? API Response pour club ${clubId}:`, messages);
        console.log(`? Nombre de messages reçus: ${messages.length}`);
        
        if (!Array.isArray(messages)) {
          console.warn(`? Aucun message trouvé pour le club ${clubId}`);
          return [];
        }
        
        // Transformer les données du backend pour correspondre au format frontend
        return messages.map(message => {
          console.log(`? Transformation du message brut:`, message);
          console.log(`? Champs de raison: raison_epingle=${message.raison_epingle}, raison=${message.raison}, raisonEpingle=${message.raisonEpingle}`);
          const transformed = {
            idMessage: message.idMessage || message.id_message,
            id: message.idMessage || message.id_message, // Utiliser idMessage comme id principal
            contenu: message.contenu,
            dateEnvoi: message.date_envoi || message.dateEnvoi ? new Date(message.date_envoi || message.dateEnvoi) : new Date(), // Utiliser date actuelle si null
            userId: message.user_id || message.userId,
            user: {
              id: message.user_id || message.userId,
              nom: `User ${message.user_id || message.userId}`, // Backend n'envoie pas les infos user
              email: `user${message.user_id || message.userId}@example.com`,
              avatar: '??'
            },
            clubId: message.club_id_club || message.clubId || clubId, // Utiliser club_id_club de la BDD
            likes: message.likes || 0,
            isLiked: false,
            isPinned: message.epingle === 1 || message.epingle === true, // Utiliser epingle de la BDD (accepter 1 et true)
            raisonEpingle: message.raison_epingle || message.raisonEpingle || null // Ajouter la raison d'épinglage
          };
          console.log(`? Message transformé:`, transformed);
          return transformed;
        });
      }),
      catchError((error: any) => {
        console.error(`? Erreur lors du chargement des messages du club ${clubId}:`, error);
        console.error('? Détails de l\'erreur:', error.message, error.status);
        console.error('? URL de l\'erreur:', error.url);
        console.error('? Headers:', error.headers);
        
        // Si erreur 400, utiliser les données mock
        if (error.status === 400) {
          console.log('?? Erreur 400 détectée, utilisation des données mock');
          return of(this.createMockMessages(clubId));
        }
        
        return throwError(() => error);
      })
    );
    
    // CODE DÉVELOPPEMENT (gardé comme fallback)
    /*
    console.log('?? MODE DÉVELOPPEMENT: Utilisation des données mock pour les messages du club');
    return of(this.createMockMessages(clubId));
    */
  }

  /**
   * Récupère un message par son ID
   * Endpoint: GET /api/clubMessages/{id}
   */
  getMessageById(messageId: number): Observable<ClubMessage> {
    console.log(`🔍 Chargement du message ${messageId}`);
    
    return this.http.get<ClubMessage>(`${this.messagesEndpoint}/${messageId}`).pipe(
      map((message: ClubMessage) => {
        console.log(`✅ Message ${messageId} reçu:`, message);
        return {
          ...message,
          idMessage: message.idMessage || message.id,
          id: message.id || message.idMessage,
          dateEnvoi: new Date(message.dateEnvoi),
          isLiked: false,
          isPinned: false
        };
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du chargement du message ${messageId}:`, error);
        return throwError(() => new Error(`Impossible de charger le message ${messageId}`));
      })
    );
  }

  /**
   * Crée un nouveau message
   * Endpoint: POST /api/clubMessages
   */
  createMessage(message: CreateMessageDTO): Observable<ClubMessage> {
    console.log('📝 SERVICE REÇOIT:', message);  // ← Doit afficher {contenu: "...", clubId: 1, userId: 1}

    // Envoyer un body PLAT attendu par le backend: { contenu, clubId, userId }
    const backendMessage = {
      contenu: message.contenu,
      userId: message.userId,
      clubId: message.clubId
    };

    console.log('📤 ENVOI AU BACKEND:', backendMessage);  // ← Doit afficher {contenu: "...", clubId: 1, userId: 1}

    return this.http.post<ClubMessage>(this.messagesEndpoint, backendMessage).pipe(
      map((created: ClubMessage) => ({
        ...created,
        idMessage: created.idMessage ?? created.id,
        id: created.id ?? created.idMessage,
        dateEnvoi: created.dateEnvoi ? new Date(created.dateEnvoi) : new Date(),
        isLiked: created.isLiked ?? false,
        isPinned: created.isPinned ?? false
      })),
      catchError((error: any) => {
        console.error('❌ Erreur lors de la création du message:', error);
        return throwError(() => error);
      })
    );
}

  /**
   * Like un message
   * Endpoint: PUT /api/clubMessages/like/{id}
   */
  likeMessage(messageId: number): Observable<number> {
    console.log(`❤️ Like du message ${messageId}`);
    
    return this.http.put<number>(`${this.messagesEndpoint}/like/${messageId}`, {}).pipe(
      map((likesCount: number) => {
        console.log(`✅ Like enregistré - nouveau total: ${likesCount}`);
        return likesCount;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du like du message ${messageId}:`, error);
        return of(0); // Retourner 0 en cas d'erreur
      })
    );
  }

  /**
   * Supprime un message
   * Endpoint: DELETE /api/clubMessages/{id}
   */
  deleteMessage(messageId: number): Observable<void> {
    console.log(`🗑️ Suppression du message ${messageId}`);
    
    return this.http.delete<void>(`${this.messagesEndpoint}/${messageId}`).pipe(
      tap(() => {
        console.log(`✅ Message ${messageId} supprimé avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la suppression du message ${messageId}:`, error);
        
        // Gérer spécifiquement l'erreur de contrainte étrangère
        if (error.error && error.error.includes('foreign key constraint')) {
          return throwError(() => new Error('Impossible de supprimer ce message car il contient des commentaires. Supprimez d\'abord les commentaires.'));
        }
        
        return throwError(() => new Error('Impossible de supprimer le message'));
      })
    );
  }

  /**
   * Récupère les statistiques du forum d'un club
   * Endpoint: GET /api/clubMessages/stats/{clubId}
   */
  getForumStats(clubId: number): Observable<ForumStats> {
    console.log(`📊 Chargement des statistiques du forum ${clubId}`);
    
    return this.http.get<ForumStats>(`${this.messagesEndpoint}/stats/${clubId}`).pipe(
      map((stats: ForumStats) => {
        console.log(`✅ Statistiques du forum ${clubId} reçues:`, stats);
        return stats;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du chargement des statistiques du forum ${clubId}:`, error);
        return throwError(() => new Error(`Impossible de charger les statistiques du forum ${clubId}`));
      })
    );
  }

  /**
   * Crée des messages mock pour le développement
   */
  private createMockMessages(clubId: number): ClubMessage[] {
    const messages: ClubMessage[] = [];
    const now = new Date();

    // Créer plusieurs messages mock
    const mockContents = [
      "Bonjour tout le monde ! Je suis ravi de rejoindre ce club d'anglais. J'espère qu'on va bien progresser ensemble !",
      "Hello everyone! I'm excited to be part of this English club. Does anyone have tips for improving pronunciation?",
      "Salut ! J'ai du mal avec les temps verbaux. Quelqu'un peut m'aider avec les règles du present perfect?",
      "Hi! I found this great resource for learning vocabulary. Check it out: [link]",
      "Hello! I'm organizing a practice session next week. Who's interested?",
      "Salut les amis ! J'ai passé mon TOEIC hier, je vous raconte tout !",
      "Hi everyone! What are your favorite English podcasts or YouTube channels?",
      "Bonjour ! Je cherche un buddy pour pratiquer les conversations. Qui est intéressé?"
    ];

    const mockUsers = [
      { id: 1, nom: 'Alice Martin', email: 'alice@example.com', avatar: '👩‍🎓' },
      { id: 2, nom: 'Bob Johnson', email: 'bob@example.com', avatar: '👨‍💼' },
      { id: 3, nom: 'Claire Dubois', email: 'claire@example.com', avatar: '👩‍🏫' },
      { id: 4, nom: 'David Wilson', email: 'david@example.com', avatar: '👨‍🎓' },
      { id: 5, nom: 'Emma Garcia', email: 'emma@example.com', avatar: '👩‍💻' }
    ];

    for (let i = 0; i < 10; i++) {
      const user = mockUsers[i % mockUsers.length];
      const dateEnvoi = new Date(now);
      dateEnvoi.setHours(dateEnvoi.getHours() - i * 2); // Messages espacés de 2h

      messages.push({
        idMessage: 100 + i,
        id: 100 + i,
        contenu: mockContents[i % mockContents.length],
        dateEnvoi: dateEnvoi,
        userId: user.id,
        user: user,
        clubId: clubId,
        likes: Math.floor(Math.random() * 15),
        isLiked: false,
        isPinned: false
      });
    }

    return messages;
  }
}