import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ClubMembership {
  idInscription?: number;
  dateInscription: Date;
  status: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
  userId: number;  // Changé de user.id à userId
  club?: {
    idClub: number;
    nom?: string;
  };
  clubId?: number; // Optionnel si vous voulez un champ direct
}

// DTO pour correspondre au backend Spring Boot
export interface ClubMembershipDTO {
  userId: number;
  clubId: number;
  status?: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE';
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = '/api/memberships'; // Utiliser le proxy au lieu de l'URL directe

  constructor(private http: HttpClient) { }

  createMembership(membership: ClubMembership): Observable<ClubMembership> {
    // Envoyer le format complet que Spring Boot attend avec l'objet club
    const payload = {
      userId: membership.userId,
      club: {
        idClub: membership.club?.idClub || (membership as any).clubId
      }
    };
    
    console.log('📤 Payload complet envoyé au backend:', payload);
    console.log('📤 URL complète:', this.apiUrl);
    
    return this.http.post<ClubMembership>(this.apiUrl, payload).pipe(
      map(response => {
        console.log('✅ Réponse du backend:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Erreur détaillée:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error:', error.error);
        throw error;
      })
    );
  }

  // Méthode alternative avec headers explicites
  createMembershipWithHeaders(membership: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
    return this.http.post<any>(this.apiUrl, membership, httpOptions);
  }

  getMembershipsByClub(clubId: number): Observable<ClubMembership[]> {
    // Utiliser l'endpoint getAll et filtrer côté client
    return this.getAllMemberships().pipe(
      map((memberships: ClubMembership[]) => {
        return memberships.filter(m => 
          (m.club?.idClub === clubId) || (m as any).clubId === clubId
        );
      })
    );
  }

  // Méthode pour charger les memberships d'un utilisateur spécifique
  getMembershipsByUser(userId: number): Observable<ClubMembership[]> {
    return this.getAllMemberships().pipe(
      map((memberships: ClubMembership[]) => {
        return memberships.filter(m => m.userId === userId);
      })
    );
  }

  // Méthode pour charger toutes les adhésions
  getAllMemberships(): Observable<ClubMembership[]> {
    // Essayer l'endpoint de base qui devrait mapper à la méthode getAll()
    return this.http.get<ClubMembership[]>(`${this.apiUrl}`);
  }

  // Méthode pour mettre à jour le statut d'un membership
  updateMembershipStatus(membership: ClubMembership): Observable<ClubMembership> {
    // Payload simple pour le backend Spring Boot
    const payload = {
      status: membership.status
    };
    
    console.log('🔄 Payload mise à jour:', payload);
    
    return this.http.put<ClubMembership>(`${this.apiUrl}/${membership.idInscription}`, payload);
  }
}
