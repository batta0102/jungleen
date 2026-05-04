import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Club {
  idClub: number;
  nom: string;
  description: string;
  niveau?: string;
  capacityMax?: number;
  status?: string;
  clubOwner?: number;
  dateCreation: string;
  dateModification?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  actif?: boolean;
  messages?: any[];
}

export interface CreateClubDTO {
  nom: string;
  description: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  siteWeb: string;
}

export interface UpdateClubDTO extends Partial<CreateClubDTO> {
  id?: number; // Rendre id optionnel pour UpdateClubDTO
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly clubsEndpoint = `${this.apiUrl}/api/clubs`;
  
  constructor(private http: HttpClient) {
    console.log('🏢 ClubService initialisé');
    console.log('🌐 API Gateway URL:', this.apiUrl);
    console.log('🔗 Clubs Endpoint:', this.clubsEndpoint);
  }

  /**
   * Récupère tous les clubs
   * Endpoint: GET /api/clubs
   */
  getAllClubs(): Observable<Club[]> {
    console.log('🏢 Récupération de tous les clubs...');
    
    return this.http.get<Club[]>(this.clubsEndpoint).pipe(
      tap(clubs => {
        console.log('✅ Clubs récupérés avec succès:', clubs.length, 'éléments');
        console.log('📊 Données brutes:', clubs);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un club par son ID
   * Endpoint: GET /api/clubs/{id}
   */
  getClubById(id: number): Observable<Club> {
    console.log(`🏢 Récupération du club ${id}...`);
    const url = `${this.clubsEndpoint}/${id}`;
    
    return this.http.get<Club>(url).pipe(
      tap(club => {
        console.log(`✅ Club ${id} récupéré:`, club);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crée un nouveau club
   * Endpoint: POST /api/clubs
   */
  createClub(clubData: CreateClubDTO): Observable<Club> {
    console.log('🏢 Création d\'un nouveau club:', clubData);
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<Club>(this.clubsEndpoint, clubData, httpOptions).pipe(
      tap(club => {
        console.log('✅ Club créé avec succès:', club);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un club existant
   * Endpoint: PUT /api/clubs/{id}
   */
  updateClub(id: number, clubData: UpdateClubDTO): Observable<Club> {
    console.log(`🏢 Mise à jour du club ${id}:`, clubData);
    const url = `${this.clubsEndpoint}/${id}`;
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.put<Club>(url, clubData, httpOptions).pipe(
      tap(club => {
        console.log(`✅ Club ${id} mis à jour:`, club);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un club
   * Endpoint: DELETE /api/clubs/{id}
   */
  deleteClub(id: number): Observable<void> {
    console.log(`🏢 Suppression du club ${id}...`);
    const url = `${this.clubsEndpoint}/${id}`;
    
    return this.http.delete<void>(url).pipe(
      tap(() => {
        console.log(`✅ Club ${id} supprimé avec succès`);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Recherche des clubs par nom
   * Endpoint: GET /api/clubs/search?nom={nom}
   */
  searchClubs(nom: string): Observable<Club[]> {
    console.log(`🏢 Recherche de clubs avec le nom: "${nom}"`);
    const url = `${this.clubsEndpoint}/search?nom=${encodeURIComponent(nom)}`;
    
    return this.http.get<Club[]>(url).pipe(
      tap(clubs => {
        console.log(`✅ Recherche terminée: ${clubs.length} clubs trouvés`);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les clubs actifs uniquement
   * Endpoint: GET /api/clubs/actifs
   */
  getActiveClubs(): Observable<Club[]> {
    console.log('🏢 Récupération des clubs actifs...');
    const url = `${this.clubsEndpoint}/actifs`;
    
    return this.http.get<Club[]>(url).pipe(
      tap(clubs => {
        console.log(`✅ ${clubs.length} clubs actifs récupérés`);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('🚨 Erreur HTTP dans ClubService:', error);
    
    let errorMessage = 'Une erreur inattendue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Requête invalide. Vérifiez les données envoyées.';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous connecter.';
          break;
        case 403:
          errorMessage = 'Accès interdit. Permissions insuffisantes.';
          break;
        case 404:
          errorMessage = 'Club non trouvé.';
          break;
        case 409:
          errorMessage = 'Conflit de données. Le club existe peut-être déjà.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        case 503:
          errorMessage = 'Service indisponible. API Gateway en maintenance.';
          break;
        default:
          errorMessage = `Erreur serveur (${error.status}): ${error.message}`;
      }
    }
    
    console.error('💬 Message d\'erreur:', errorMessage);
    
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }
}
