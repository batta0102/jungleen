import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BuddyPair, BuddyMatchStatus, CreateBuddyPairDTO } from '../models/buddy.models';

@Injectable({
  providedIn: 'root'
})
export class BuddyService {
  private apiUrl = '/api/buddyPairs'; 

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les buddy pairs
   */
  getBuddyPairs(): Observable<BuddyPair[]> {
    console.log('🔍 Chargement des buddy pairs depuis:', this.apiUrl);
    return this.http.get<BuddyPair[]>(this.apiUrl).pipe(
      map((response: BuddyPair[]) => {
        console.log('✅ Buddy pairs reçus:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Erreur lors du chargement des buddy pairs:', error);
        
        // Fallback pour le développement - retourner des données mock
        console.log('🔄 Utilisation des données mock pour le développement');
        return of(this.createMockBuddyPairs());
      })
    );
  }

  /**
   * Crée des données mock pour le développement
   */
  private createMockBuddyPairs(): BuddyPair[] {
    return [
      {
        idPair: 1,
        userID_1: 1,
        userID_2: 2,
        clubId: 1,
        status: BuddyMatchStatus.PENDING,
        dateCreation: new Date('2024-01-15'),
        user1: {
          id: 1,
          prenom: 'Alice',
          nom: 'Martin',
          email: 'alice@example.com',
          avatar: '👩‍🎓'
        },
        user2: {
          id: 2,
          prenom: 'Claire',
          nom: 'Bernard',
          email: 'claire@example.com',
          avatar: '👩‍💼'
        },
        club: { idClub: 1, nom: 'English Club' }
      },
      {
        idPair: 2,
        userID_1: 3,
        userID_2: 4,
        clubId: 2,
        status: BuddyMatchStatus.ACTIVE,
        dateCreation: new Date('2024-01-10'),
        user1: {
          id: 3,
          prenom: 'David',
          nom: 'Petit',
          email: 'david@example.com',
          avatar: '👨‍💻'
        },
        user2: {
          id: 4,
          prenom: 'Emma',
          nom: 'Leroy',
          email: 'emma@example.com',
          avatar: '👩‍🔬'
        },
        club: { idClub: 2, nom: 'French Club' }
      },
      {
        idPair: 3,
        userID_1: 5,
        userID_2: 6,
        clubId: 1,
        status: BuddyMatchStatus.COMPLETED,
        dateCreation: new Date('2024-01-05'),
        user1: {
          id: 5,
          prenom: 'Frank',
          nom: 'Moreau',
          email: 'frank@example.com',
          avatar: '👨‍🎨',
        },
        user2: {
          id: 6,
          prenom: 'François',
          nom: 'Petit',
          email: 'francois@example.com',
          avatar: '👨‍🔬'
        },
        club: { idClub: 1, nom: 'English Club' }
      },
      {
        idPair: 4,
        userID_1: 2,
        userID_2: 3,
        clubId: 3,
        status: BuddyMatchStatus.CANCELLED,
        dateCreation: new Date('2024-01-20'),
        user1: {
          id: 2,
          prenom: 'Claire',
          nom: 'Bernard',
          email: 'claire@example.com',
          avatar: '👩‍💼'
        },
        user2: {
          id: 3,
          prenom: 'David',
          nom: 'Petit',
          email: 'david@example.com',
          avatar: '👨‍💻'
        },
        club: { idClub: 3, nom: 'Spanish Club' }
      }
    ];
  }

  /**
   * Récupère un buddy pair par son ID
   */
  getBuddyPairById(id: number): Observable<BuddyPair> {
    console.log(`🔍 Récupération du buddy pair ${id}`);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response: any) => {
        console.log(`✅ Buddy pair brut ${id} reçu:`, response);
        
        // Transformer la réponse pour correspondre à l'interface BuddyPair
        const buddy: BuddyPair = {
          idPair: response.idPair,
          userID_1: response.userID_1,
          userID_2: response.userID_2,
          clubId: response.club?.idClub || 0,
          status: this.mapStatus(response.status),
          dateCreation: new Date(response.dateCreation || Date.now()),
          dateActivation: response.dateActivation ? new Date(response.dateActivation) : undefined,
          dateFin: response.dateFin ? new Date(response.dateFin) : undefined,
          user1: response.user1 || undefined,
          user2: response.user2 || undefined,
          club: response.club ? {
            idClub: response.club.idClub,
            nom: response.club.nom || 'Club non spécifié'
          } : undefined
        };
        
        console.log(`✅ Buddy pair transformé ${id}:`, buddy);
        return buddy;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération du buddy pair ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère les buddy pairs d'un club
   */
  getBuddyPairsByClub(clubId: number): Observable<BuddyPair[]> {
    console.log(`🔍 Récupération des buddy pairs du club ${clubId}`);
    return this.http.get<BuddyPair[]>(`${this.apiUrl}/club/${clubId}`).pipe(
      map((response: BuddyPair[]) => {
        console.log(`✅ Buddy pairs du club ${clubId} reçus:`, response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des buddy pairs du club ${clubId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Récupère les buddy pairs d'un utilisateur
   */
  getBuddyPairsByUser(userId: number): Observable<BuddyPair[]> {
  console.log(`🔍 Récupération des buddy pairs de l'utilisateur ${userId}`);
  return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`).pipe(
    map((response: any[]) => {
      console.log(`✅ Buddy pairs bruts de l'utilisateur ${userId}:`, response);
      
      // Transformer la réponse pour correspondre à l'interface BuddyPair
      const buddyPairs: BuddyPair[] = response.map((item: any) => ({
        idPair: item.idPair,
        userID_1: item.userID_1,
        userID_2: item.userID_2,
        clubId: item.club?.idClub || 0,
        status: this.mapStatus(item.status),  // ← C'EST ICI qu'on appelle mapStatus
        dateCreation: new Date(item.dateCreation || Date.now()),
        dateActivation: item.dateActivation ? new Date(item.dateActivation) : undefined,
        dateFin: item.dateFin ? new Date(item.dateFin) : undefined,
        user1: item.user1 || undefined,
        user2: item.user2 || undefined,
        club: item.club ? {
          idClub: item.club.idClub,
          nom: item.club.nom || 'Club non spécifié'
        } : undefined
      }));
      
      console.log(`✅ Buddy pairs transformés:`, buddyPairs);
      return buddyPairs;
    }),
    catchError((error: any) => {
      console.error(`❌ Erreur lors de la récupération des buddy pairs de l'utilisateur ${userId}:`, error);
      throw error;
    })
  );
}

  /**
   * Récupère les buddy pairs actifs d'un club
   */
  getActiveBuddiesByClub(clubId: number): Observable<BuddyPair[]> {
    console.log(`🔍 Récupération des buddy pairs actifs du club ${clubId}`);
    return this.http.get<BuddyPair[]>(`${this.apiUrl}/club/${clubId}/active`).pipe(
      map((response: BuddyPair[]) => {
        console.log(`✅ Buddy pairs actifs du club ${clubId} reçus:`, response);
        return response;
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des buddy pairs actifs du club ${clubId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Crée un nouveau buddy pair
   */
  createBuddyPair(buddyPair: CreateBuddyPairDTO): Observable<BuddyPair> {
    console.log('📤 Création d\'un nouveau buddy pair:', buddyPair);
    return this.http.post<BuddyPair>(this.apiUrl, buddyPair).pipe(
      map((response: BuddyPair) => {
        console.log('✅ Buddy pair créé avec succès:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Erreur lors de la création du buddy pair:', error);
        throw error;
      })
    );
  }

  /**
   * Accepte un buddy pair (change le statut à ACTIF)
   */
  acceptBuddyPair(id: number): Observable<void> {
    console.log(`✅ Acceptation du buddy pair ${id}`);
    return this.http.post<void>(`${this.apiUrl}/${id}/accept`, {}).pipe(
      map(() => {
        console.log(`✅ Buddy pair ${id} accepté avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de l'acceptation du buddy pair ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Refuse un buddy pair (change le statut à ANNULE)
   */
  rejectBuddyPair(id: number): Observable<void> {
    console.log(`❌ Refus du buddy pair ${id}`);
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {}).pipe(
      map(() => {
        console.log(`✅ Buddy pair ${id} refusé avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du refus du buddy pair ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Supprime un buddy pair
   */
  deleteBuddyPair(id: number): Observable<void> {
    console.log(`🗑️ Suppression du buddy pair ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        console.log(`✅ Buddy pair ${id} supprimé avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la suppression du buddy pair ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Termine un buddy pair (change le statut à TERMINE)
   */
  terminateBuddyPair(id: number): Observable<void> {
    console.log(`🏁 Terminaison du buddy pair ${id}`);
    return this.http.put<void>(`${this.apiUrl}/${id}/terminate`, {}).pipe(
      map(() => {
        console.log(`✅ Buddy pair ${id} terminé avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la terminaison du buddy pair ${id}:`, error);
        
        // Fallback pour le développement si l'API n'existe pas
        if (error.status === 404) {
          console.log(`🔄 Simulation de terminaison pour le développement (buddy ${id})`);
          return of(void 0); // Simuler une réussite
        }
        
        throw error;
      })
    );
  }

  /**
 * Mappe le statut du backend vers l'enum BuddyMatchStatus
 */
private mapStatus(status: string): BuddyMatchStatus {
  switch(status) {
    case 'PENDING':
      return BuddyMatchStatus.PENDING;
    case 'ACTIVE':
      return BuddyMatchStatus.ACTIVE;
    case 'COMPLETED':
      return BuddyMatchStatus.COMPLETED;
    case 'CANCELLED':
      return BuddyMatchStatus.CANCELLED;
    case 'EN_ATTENTE':
      return BuddyMatchStatus.PENDING;
    case 'ACTIF':
      return BuddyMatchStatus.ACTIVE;
    case 'TERMINE':
      return BuddyMatchStatus.COMPLETED;
    case 'ANNULE':
      return BuddyMatchStatus.CANCELLED;
    default:
      console.warn(`⚠️ Statut inconnu: ${status}, utilisation de EN_ATTENTE par défaut`);
      return BuddyMatchStatus.PENDING;
  }
}
}
