import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private readonly API_BASE_URL = '/api/vision';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Extraire le texte d'une image via OCR
   */
  extraireTexte(photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    return this.http.post(`${this.API_BASE_URL}/ocr`, formData).pipe(
      catchError(error => {
        console.error('Erreur OCR:', error);
        throw error;
      })
    );
  }

  /**
   * Extraire et traduire le texte d'une image (anglais → français)
   */
  extraireEtTraduire(photo: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', photo);
    
    console.log('Envoi requête OCR vers:', `${this.API_BASE_URL}/ocr/traduire`);
    console.log('Fichier:', photo.name, 'Taille:', photo.size);
    
    return this.http.post(`${this.API_BASE_URL}/ocr/traduire`, formData).pipe(
      map(response => {
        console.log('Réponse OCR brute reçue:', response);
        return response;
      }),
      catchError(error => {
        console.error('Erreur OCR + Traduction:', error);
        throw error;
      })
    );
  }

  /**
   * Ajouter un mot au vocabulaire personnel
   */
  ajouterAuVocabulaire(userId: number, clubId: number, mot: string, traduction: string): Observable<any> {
    const body = {
      userId,
      clubId,
      mot,
      traduction
    };
    
    return this.http.post(`${this.API_BASE_URL}/vocabulaire/ajouter`, body).pipe(
      catchError(error => {
        console.error('Erreur ajout vocabulaire:', error);
        throw error;
      })
    );
  }

  /**
   * Récupérer le vocabulaire de l'utilisateur pour un club
   */
  getVocabulaire(userId: number, clubId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_BASE_URL}/vocabulaire/${userId}/${clubId}`).pipe(
      map(vocabulaire => vocabulaire.sort((a, b) => b.foisVu - a.foisVu)), // Trier par fois vu décroissant
      catchError(error => {
        console.error('Erreur récupération vocabulaire:', error);
        return [];
      })
    );
  }

  /**
   * Supprimer un mot du vocabulaire
   */
  supprimerDuVocabulaire(motId: number): Observable<any> {
    return this.http.delete(`${this.API_BASE_URL}/vocabulaire/${motId}`).pipe(
      catchError(error => {
        console.error('Erreur suppression vocabulaire:', error);
        throw error;
      })
    );
  }

  /**
   * Publier un message dans le forum du club
   */
  publierMessageClub(clubId: number, userId: number, contenu: string): Observable<any> {
    const body = {
      clubId,
      userId,
      contenu
    };
    
    return this.http.post('/api/clubMessages', body).pipe(
      catchError(error => {
        console.error('Erreur publication message:', error);
        throw error;
      })
    );
  }

  /**
   * Récupérer l'ID de l'utilisateur connecté
   */
  getCurrentUserId(): number {
    return this.authService.getCurrentUserId();
  }
}
