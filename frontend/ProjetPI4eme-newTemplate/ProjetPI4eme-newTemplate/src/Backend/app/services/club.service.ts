import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Club {
  idClub?: number;
  nom: string;
  description: string;
  niveau: string;
  capacityMax: number;
  clubOwner: string;
  dateCreation?: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private apiUrl = '/api/clubs';

  constructor(private http: HttpClient) { }

  getAllClubs(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  createClub(club: Club): Observable<Club> {
    return this.http.post<Club>(this.apiUrl, club);
  }

  deleteClub(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateClub(id: number, club: Club): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}`, club);
  }

  getClubById(id: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }

  // ✅ SUPPRIME cette méthode - elle n'a rien à faire ici !
  // getColorHex(color: string): string { ... }
}
