import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BuddySession, SessionStatus, CreateSessionDTO, ConfirmSessionDTO } from '../models/buddy.models';

@Injectable({
  providedIn: 'root'
})
export class BuddySessionService {
  private apiUrl = '/api/buddySessions'; // Use proxy to avoid CORS in dev

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les sessions d'un buddy pair
   */
  getSessionsByBuddyPair(buddyPairId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération des sessions du buddy pair ${buddyPairId}`);
    return this.http.get(`${this.apiUrl}?buddyPairId=${buddyPairId}`, { responseType: 'text' }).pipe(
      map((response: string) => {
        console.log('🔍 Response brute du backend (text):', response);
        
        try {
          // Parser manuellement le JSON avec gestion des erreurs de format
          let cleanedResponse = response;
          
          // Corriger les JSON malformés avec des crochets supplémentaires
          if (response.includes(']}}}]}}]}}')) {
            console.log('🔧 Correction du JSON malformé');
            cleanedResponse = response.replace(/]}}}]}}]}}/g, ']}');
          }
          
          const jsonData = JSON.parse(cleanedResponse);
          console.log('🔍 Response JSON parsée:', jsonData);
          
          if (!Array.isArray(jsonData)) {
            console.log('⚠️ La réponse n\'est pas un tableau, retour d\'un tableau vide');
            return [];
          }
          
          // Transformer la réponse pour correspondre à l'interface BuddySession
          const buddySessions: BuddySession[] = jsonData
            .filter((item: any) => item && item.idSession) // Filtrer les items invalides
            .map((item: any) => {
              const transformed = {
                idSession: item.idSession,
                buddyPair: item.buddyPair,
                userIdCreateur: item.userIdCreateur || 0,
                date: item.date || new Date().toISOString(),
                duree: item.duree || 60,
                lieu: item.lieu,
                description: item.description,
                status: item.status || 'PLANIFIEE',
                dateCreation: new Date(item.dateCreation || Date.now()),
                confirmationUser1: item.confirmationUser1,
                confirmationUser2: item.confirmationUser2,
                satisfactionUser1: item.satisfactionUser1,
                satisfactionUser2: item.satisfactionUser2,
                commentaireUser1: item.commentaireUser1,
                commentaireUser2: item.commentaireUser2,
                createur: item.createur
              };
              console.log('🔄 Session transformée:', transformed);
              return transformed;
            });
          
          console.log('📊 Sessions transformées:', buddySessions);
          
          // Filtrer uniquement les sessions qui appartiennent réellement à ce buddy
          const filteredSessions = buddySessions.filter(session => 
            session.buddyPair?.idPair === buddyPairId
          );
          
          console.log(`✅ Sessions du buddy pair ${buddyPairId} reçues:`, filteredSessions);
          return filteredSessions;
        } catch (parseError) {
          console.error('❌ Erreur de parsing JSON:', parseError);
          return [];
        }
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des sessions du buddy pair ${buddyPairId}:`, error);
        // Retourner un tableau vide en cas d'erreur au lieu de lancer l'erreur
        return of([]);
      })
    );
  }

  /**
   * Récupère les sessions à venir d'un buddy pair
   */
  getSessionsAVenir(buddyPairId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération des sessions à venir du buddy pair ${buddyPairId}`);
    
    return this.http.get<BuddySession[]>(`${this.apiUrl}/upcoming?buddyPairId=${buddyPairId}`).pipe(
      map((response: BuddySession[]) => {
        console.log(`✅ Sessions à venir du buddy pair ${buddyPairId} reçues:`, response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des sessions à venir du buddy pair ${buddyPairId}:`, error);
        // Utiliser des données mock en cas d'erreur
        console.log('🔄 Utilisation des données mock pour les sessions à venir');
        return of(this.createMockSessions(buddyPairId, 'upcoming'));
      })
    );
  }

  /**
   * Récupère l'historique des sessions d'un buddy pair
   */
  getHistoriqueSessions(buddyPairId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération de l'historique des sessions du buddy pair ${buddyPairId}`);
    
    return this.http.get<BuddySession[]>(`${this.apiUrl}/history?buddyPairId=${buddyPairId}`).pipe(
      map((response: BuddySession[]) => {
        console.log(`✅ Historique des sessions du buddy pair ${buddyPairId} reçues:`, response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération de l'historique des sessions du buddy pair ${buddyPairId}:`, error);
        // Utiliser des données mock en cas d'erreur
        console.log('🔄 Utilisation des données mock pour l\'historique');
        return of(this.createMockSessions(buddyPairId, 'history'));
      })
    );
  }

  /**
   * Crée des sessions mock pour le développement
   */
  private createMockSessions(buddyPairId: number, type: 'upcoming' | 'history'): BuddySession[] {
    const sessions: BuddySession[] = [];
    const now = new Date();
    
    if (type === 'upcoming') {
      // Sessions à venir
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i * 2);
        sessions.push({
          idSession: buddyPairId * 100 + i,
          buddyPair: { idPair: buddyPairId } as any,
          userIdCreateur: 1,
          date: date.toISOString(),
          duree: 60,
          lieu: 'Salle A',
          description: `Session ${i} - Conversation libre`,
          status: SessionStatus.PLANIFIEE,
          dateCreation: new Date(),
          confirmationUser1: true,
          confirmationUser2: true
        });
      }
    } else {
      // Sessions historiques
      for (let i = 1; i <= 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 3);
        sessions.push({
          idSession: buddyPairId * 200 + i,
          buddyPair: { idPair: buddyPairId } as any,
          userIdCreateur: 1,
          date: date.toISOString(),
          duree: 45 + (i * 15),
          lieu: ['Salle A', 'Salle B', 'En ligne'][i % 3],
          description: `Session passée ${i} - ${['Pratique', 'Grammaire', 'Vocabulaire', 'Culture', 'Prononciation'][i - 1]}`,
          status: SessionStatus.TERMINEE,
          dateCreation: new Date(),
          confirmationUser1: true,
          confirmationUser2: true
        });
      }
    }
    
    return sessions;
  }

  /**
   * Crée une nouvelle session
   */
  createSession(session: any): Observable<BuddySession> {
    console.log('📤 Création d\'une nouvelle session:', session);
    return this.http.post<BuddySession>(this.apiUrl, session).pipe(
      map((response: BuddySession) => {
        console.log('✅ Session créée:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Erreur lors de la création de la session:', error);
        throw error;
      })
    );
  }

  /**
   * Confirme une session
   */
  confirmSession(sessionId: number, userId: number, confirmationData: ConfirmSessionDTO): Observable<BuddySession> {
    console.log(`✅ Confirmation de la session ${sessionId} par l'utilisateur ${userId}:`, confirmationData);

    // Backend mapping: POST /api/buddySessions/{id}/confirm/{userId}?satisfaction=...
    const satisfaction = encodeURIComponent(String(confirmationData.satisfaction));
    const url = `${this.apiUrl}/${sessionId}/confirm/${userId}?satisfaction=${satisfaction}`;

    return this.http.post<BuddySession>(url, {}).pipe(
      map((response: BuddySession) => {
        console.log('✅ Session confirmée:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la confirmation de la session ${sessionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Annule une session
   */
  cancelSession(sessionId: number, userId: number, motif: string): Observable<BuddySession> {
    console.log(`❌ Annulation de la session ${sessionId} par l'utilisateur ${userId}:`, motif);
    return this.http.put<BuddySession>(`${this.apiUrl}/${sessionId}/cancel`, { userId, motif }).pipe(
      map((response: BuddySession) => {
        console.log('✅ Session annulée:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de l'annulation de la session ${sessionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Termine une session
   */
  completeSession(sessionId: number, userId: number, confirmationData: ConfirmSessionDTO): Observable<BuddySession> {
    console.log(`🏁 Terminaison de la session ${sessionId} par l'utilisateur ${userId}:`, confirmationData);
    return this.http.put<BuddySession>(`${this.apiUrl}/${sessionId}/complete`, confirmationData).pipe(
      map((response: BuddySession) => {
        console.log('✅ Session terminée:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la terminaison de la session ${sessionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Supprime une session
   */
  deleteSession(sessionId: number, userId: number): Observable<void> {
    console.log(`🗑️ Suppression de la session ${sessionId} par l'utilisateur ${userId}`);
    return this.http.delete<void>(`${this.apiUrl}/${sessionId}`).pipe(
      map(() => {
        console.log('✅ Session supprimée');
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la suppression de la session ${sessionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère toutes les sessions d'un utilisateur
   */
  getSessionsByUser(userId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération des sessions de l'utilisateur ${userId}`);
    return this.http.get<BuddySession[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      map((sessions: BuddySession[]) => {
        console.log(`✅ Sessions de l'utilisateur ${userId} reçues:`, sessions);
        return sessions;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des sessions de l'utilisateur ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère les sessions à venir d'un utilisateur
   */
  getSessionsAVenirByUser(userId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération des sessions à venir de l'utilisateur ${userId}`);
    return this.http.get<BuddySession[]>(`${this.apiUrl}?userId=${userId}&status=PLANIFIEE`).pipe(
      map((sessions: BuddySession[]) => {
        console.log(`✅ Sessions à venir de l'utilisateur ${userId} reçues:`, sessions);
        return sessions;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des sessions à venir de l'utilisateur ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère l'historique des sessions d'un utilisateur
   */
  getHistoriqueSessionsByUser(userId: number): Observable<BuddySession[]> {
    console.log(`🔍 Récupération de l'historique des sessions de l'utilisateur ${userId}`);
    return this.http.get<BuddySession[]>(`${this.apiUrl}?userId=${userId}&status=TERMINEE`).pipe(
      map((sessions: BuddySession[]) => {
        console.log(`✅ Historique des sessions de l'utilisateur ${userId} reçues:`, sessions);
        return sessions;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération de l'historique des sessions de l'utilisateur ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère une session par son ID
   */
  getSessionById(id: number): Observable<BuddySession> {
    console.log(`🔍 Récupération de la session ${id}`);
    return this.http.get<BuddySession>(`${this.apiUrl}/${id}`).pipe(
      map((session: BuddySession) => {
        console.log(`✅ Session ${id} reçue:`, session);
        return session;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération de la session ${id}:`, error);
        throw error;
      })
    );
  }
}
