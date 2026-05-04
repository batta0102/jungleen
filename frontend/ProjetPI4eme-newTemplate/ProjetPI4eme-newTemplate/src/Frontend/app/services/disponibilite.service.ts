import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Disponibilite } from '../models/calendar.models';

@Injectable({
  providedIn: 'root'
})
export class DisponibiliteService {
  private readonly apiUrl = '/api/calendrier/disponibilites';

  constructor(private http: HttpClient) {
    console.log('📅 DisponibiliteService initialisé');
    console.log('📅 URL de base:', this.apiUrl);
  }

  /**
   * Récupère tous les créneaux de disponibilité à venir
   */
  getUpcomingSlots(): Observable<Disponibilite[]> {
    console.log('📡 Appel API: Récupération des créneaux à venir');
    const url = `${this.apiUrl}/upcoming`;
    console.log('📡 URL complète:', url);
    
    return this.http.get<Disponibilite[]>(url).pipe(
      tap(data => {
        console.log('📦 Données brutes reçues:', data);
        console.log('📊 Nombre de créneaux reçus:', data?.length || 0);
        
        // Convertir les dates string en objets Date si nécessaire
        const processedData = data.map(slot => ({
          ...slot,
          debut: new Date(slot.debut),
          fin: new Date(slot.fin)
        }));
        
        console.log('📦 Données traitées avec dates:', processedData);
        return processedData;
      }),
      map(data => data.map(slot => ({
        ...slot,
        debut: new Date(slot.debut),
        fin: new Date(slot.fin)
      }))),
      catchError(error => {
        console.error('❌ Erreur API getUpcomingSlots:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error details:', error.error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les disponibilités pour un buddy pair spécifique
   */
  getDisponibilitesByBuddyPair(buddyPairId: number): Observable<Disponibilite[]> {
    console.log(`📡 Appel API: Récupération des disponibilités pour buddy pair ${buddyPairId}`);
    const url = `${this.apiUrl}/${buddyPairId}`;
    console.log('📡 URL complète:', url);
    
    return this.http.get<Disponibilite[]>(url).pipe(
      tap(data => {
        console.log(`📦 Disponibilités reçues pour buddy ${buddyPairId}:`, data);
        console.log(`📊 Nombre de disponibilités:`, data?.length || 0);
      }),
      map(data => data.map(slot => ({
        ...slot,
        debut: new Date(slot.debut),
        fin: new Date(slot.fin)
      }))),
      catchError(error => {
        console.error(`❌ Erreur API getDisponibilitesByBuddyPair(${buddyPairId}):`, error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les disponibilités avec filtre
   */
  getDisponibilitesWithFilter(filter: 'upcoming' | 'all' | 'past' = 'upcoming'): Observable<Disponibilite[]> {
    console.log(`📡 Appel API: Récupération des disponibilités avec filtre "${filter}"`);
    const url = `${this.apiUrl}/filter?filter=${filter}`;
    console.log('📡 URL complète:', url);
    
    return this.http.get<Disponibilite[]>(url).pipe(
      tap(data => {
        console.log(`📦 Disponibilités reçues avec filtre "${filter}":`, data);
        console.log(`📊 Nombre de disponibilités:`, data?.length || 0);
      }),
      map(data => data.map(slot => ({
        ...slot,
        debut: new Date(slot.debut),
        fin: new Date(slot.fin)
      }))),
      catchError(error => {
        console.error(`❌ Erreur API getDisponibilitesWithFilter(${filter}):`, error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les disponibilités pour un utilisateur spécifique
   */
  getDisponibilitesByUser(userId: number): Observable<Disponibilite[]> {
    console.log(`📡 Appel API: Récupération des disponibilités pour utilisateur ${userId}`);
    const url = `${this.apiUrl}/user/${userId}`;
    console.log('📡 URL complète:', url);
    
    return this.http.get<Disponibilite[]>(url).pipe(
      tap(data => {
        console.log(`📦 Disponibilités reçues pour utilisateur ${userId}:`, data);
        console.log(`📊 Nombre de disponibilités:`, data?.length || 0);
      }),
      map(data => data.map(slot => ({
        ...slot,
        debut: new Date(slot.debut),
        fin: new Date(slot.fin)
      }))),
      catchError(error => {
        console.error(`❌ Erreur API getDisponibilitesByUser(${userId}):`, error);
        return of([]);
      })
    );
  }

  /**
   * Crée une nouvelle disponibilité
   */
  createDisponibilite(disponibilite: Omit<Disponibilite, 'id'>): Observable<Disponibilite> {
    console.log('📤 Appel API: Création d\'une nouvelle disponibilité');
    console.log('📤 Données envoyées:', disponibilite);
    
    return this.http.post<Disponibilite>(this.apiUrl, disponibilite).pipe(
      tap(response => {
        console.log('✅ Disponibilité créée avec succès:', response);
      }),
      map(response => ({
        ...response,
        debut: new Date(response.debut),
        fin: new Date(response.fin)
      })),
      catchError(error => {
        console.error('❌ Erreur API createDisponibilite:', error);
        throw error;
      })
    );
  }

  /**
   * Supprime une disponibilité
   */
  deleteDisponibilite(id: number): Observable<void> {
    console.log(`🗑️ Appel API: Suppression de la disponibilité ${id}`);
    const url = `${this.apiUrl}/${id}`;
    console.log('🗑️ URL complète:', url);
    
    return this.http.delete<void>(url).pipe(
      tap(() => {
        console.log(`✅ Disponibilité ${id} supprimée avec succès`);
      }),
      catchError(error => {
        console.error(`❌ Erreur API deleteDisponibilite(${id}):`, error);
        throw error;
      })
    );
  }

  /**
   * Test de connexion à l'API
   */
  testConnection(): Observable<boolean> {
    console.log('🔧 Test de connexion à l\'API des disponibilités');
    const url = `${this.apiUrl}/health`;
    console.log('🔧 URL de test:', url);
    
    return this.http.get(url).pipe(
      tap(() => {
        console.log('✅ Connexion API réussie');
      }),
      map(() => true),
      catchError(error => {
        console.error('❌ Erreur de connexion API:', error);
        return of(false);
      })
    );
  }
}
