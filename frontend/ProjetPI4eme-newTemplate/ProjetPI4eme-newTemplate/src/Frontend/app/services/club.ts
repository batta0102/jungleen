import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Club {
  idClub: number;
  nom: string;
  description: string;
  niveau: string;
  capacityMax: number;
  clubOwner: number;
  dateCreation: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private apiUrl = '/api/clubs'; // Utiliser le proxy pour rediriger vers localhost:9090

  constructor(private http: HttpClient) { }

  getAllClubs(): Observable<any> {
    console.log('🔍 Chargement des clubs depuis:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => {
        console.log('✅ Clubs reçus:', response);
        console.log('✅ Données brutes reçues:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('❌ Erreur lors du chargement des clubs:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error:', error.error);
        throw error;
      })
    );
  }

  private cleanCircularReferences(jsonString: string): string {
    // Solution plus robuste : supprimer complètement les propriétés problématiques
    let cleaned = jsonString;
    
    // Supprimer tous les buddyPairs pour éviter les références circulaires
    cleaned = cleaned.replace(/"buddyPairs":\[[^\]]*\]/g, '"buddyPairs":[]');
    
    // Supprimer les messages aussi s'ils causent des problèmes
    cleaned = cleaned.replace(/"messages":\[[^\]]*\]/g, '"messages":[]');
    
    return cleaned;
  }

  getClubById(id: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }

}
