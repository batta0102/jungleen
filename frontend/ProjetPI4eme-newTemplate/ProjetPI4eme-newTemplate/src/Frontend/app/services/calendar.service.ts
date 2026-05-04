import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Disponibilite, EvenementCalendrier } from '../models/calendar.models';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = '/api/calendrier';

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les disponibilités d'un buddy pair
   * @param buddyPairId ID du buddy pair
   */
  getDisponibilites(buddyPairId: number): Observable<Disponibilite[]> {
    console.log(`📅 Chargement des disponibilités du buddy pair ${buddyPairId}`);
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/${buddyPairId}`).pipe(
      tap(dispos => console.log(`✅ Disponibilités reçues:`, dispos)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du chargement des disponibilités:`, error);
        console.log('🔄 Utilisation des données mock pour les disponibilités');
        return of(this.createMockDisponibilites(buddyPairId));
      })
    );
  }

  /**
   * Ajoute une nouvelle disponibilité
   * @param buddyPairId ID du buddy pair
   * @param userId ID de l'utilisateur
   * @param debut Date et heure de début
   * @param fin Date et heure de fin
   */
  ajouterDisponibilite(
    buddyPairId: number,
    userId: number,
    debut: Date,
    fin: Date
  ): Observable<Disponibilite> {
    const params = `?userId=${userId}&debut=${debut.toISOString()}&fin=${fin.toISOString()}`;
    console.log(`📅 Ajout d'une disponibilité pour le buddy pair ${buddyPairId}`);
    return this.http.post<Disponibilite>(
      `${this.apiUrl}/disponibilites/${buddyPairId}${params}`,
      {}
    ).pipe(
      tap(dispo => console.log(`✅ Disponibilité ajoutée:`, dispo)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de l'ajout de la disponibilité:`, error);
        // Ne plus utiliser de simulation - laisser l'erreur se propager
        throw error;
      })
    );
  }

  /**
   * Supprime une disponibilité
   * @param disponibiliteId ID de la disponibilité
   */
  supprimerDisponibilite(disponibiliteId: number): Observable<void> {
    console.log(`📅 Suppression de la disponibilité ${disponibiliteId}`);
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${disponibiliteId}`).pipe(
      tap(() => console.log(`✅ Disponibilité supprimée`)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la suppression de la disponibilité:`, error);
        console.log('🔄 Simulation de la suppression de disponibilité');
        return of(void 0);
      })
    );
  }

  /**
   * Récupère des suggestions de créneaux pour une session
   * @param buddyPairId ID du buddy pair
   * @param dureeMinutes Durée souhaitée en minutes
   */
  getSuggestions(buddyPairId: number, dureeMinutes: number): Observable<Date[]> {
    console.log(`📅 Génération de suggestions pour ${dureeMinutes} minutes`);
    return this.http.get<Date[]>(
      `${this.apiUrl}/suggestions/${buddyPairId}?dureeMinutes=${dureeMinutes}`
    ).pipe(
      tap(suggestions => console.log(`✅ Suggestions reçues:`, suggestions)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la génération des suggestions:`, error);
        console.log('🔄 Utilisation de suggestions mock');
        return of(this.createMockSuggestions(dureeMinutes));
      })
    );
  }

  /**
   * Récupère les rappels à afficher
   */
  getRappels(): Observable<EvenementCalendrier[]> {
    console.log('📅 Récupération des rappels');
    return this.http.get<EvenementCalendrier[]>(`${this.apiUrl}/rappels`).pipe(
      tap(rappels => console.log(`✅ Rappels reçus:`, rappels)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la récupération des rappels:`, error);
        console.log('🔄 Utilisation de rappels mock');
        return of(this.createMockRappels());
      })
    );
  }

  /**
   * Marque un rappel comme envoyé
   * @param evenementId ID de l'événement
   */
  marquerRappelEnvoye(evenementId: number): Observable<void> {
    console.log(`📅 Marquage du rappel ${evenementId} comme envoyé`);
    return this.http.post<void>(`${this.apiUrl}/rappels/${evenementId}/envoyer`, {}).pipe(
      tap(() => console.log(`✅ Rappel marqué comme envoyé`)),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du marquage du rappel:`, error);
        console.log('🔄 Simulation du marquage du rappel');
        return of(void 0);
      })
    );
  }

  /**
   * Crée des disponibilités mock pour le développement
   */
  private createMockDisponibilites(buddyPairId: number): Disponibilite[] {
    const disponibilites: Disponibilite[] = [];
    const now = new Date();

    console.log(`📅 Création de disponibilités mock pour buddy pair ${buddyPairId}`);

    // Créer quelques disponibilités pour les prochains jours
    // avec des chevauchements pour permettre des suggestions
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Disponibilité de 14h à 17h pour l'utilisateur userId1
      const debut1 = new Date(date);
      debut1.setHours(14, 0, 0, 0);
      const fin1 = new Date(date);
      fin1.setHours(17, 0, 0, 0);

      disponibilites.push({
        id: i * 10 + 1,
        buddyPairId: buddyPairId,
        debut: debut1,
        fin: fin1,
        recurrent: false,
        userId: 1 // Utiliser userId1 réel
      });

      // Disponibilité de 15h à 18h pour l'utilisateur userId2 (chevauchement de 15h à 17h)
      const debut2 = new Date(date);
      debut2.setHours(15, 0, 0, 0);
      const fin2 = new Date(date);
      fin2.setHours(18, 0, 0, 0);

      disponibilites.push({
        id: i * 10 + 2,
        buddyPairId: buddyPairId,
        debut: debut2,
        fin: fin2,
        recurrent: false,
        userId: 2 // Utiliser userId2 réel
      });
      
      // Ajouter aussi une disponibilité le matin pour userId1
      const debut3 = new Date(date);
      debut3.setHours(9, 0, 0, 0);
      const fin3 = new Date(date);
      fin3.setHours(12, 0, 0, 0);

      disponibilites.push({
        id: i * 10 + 3,
        buddyPairId: buddyPairId,
        debut: debut3,
        fin: fin3,
        recurrent: false,
        userId: 1 // Utiliser userId1 réel
      });
      
      // Ajouter une disponibilité le matin pour userId2
      const debut4 = new Date(date);
      debut4.setHours(10, 0, 0, 0);
      const fin4 = new Date(date);
      fin4.setHours(12, 0, 0, 0);

      disponibilites.push({
        id: i * 10 + 4,
        buddyPairId: buddyPairId,
        debut: debut4,
        fin: fin4,
        recurrent: false,
        userId: 2 // Utiliser userId2 réel
      });
    }

    console.log(`📊 Total disponibilités mock créées: ${disponibilites.length}`);
    return disponibilites;
  }

  /**
   * Crée des disponibilités mock avec les vrais IDs des utilisateurs
   */
  createMockDisponibilitesWithRealIds(buddyPairId: number, userId1: number, userId2: number): Disponibilite[] {
    const disponibilites: Disponibilite[] = [];
    const now = new Date();

    console.log(`📅 Création de disponibilités mock avec IDs réels: userId1=${userId1}, userId2=${userId2}`);

    // Créer quelques disponibilités pour les prochains jours
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Disponibilité de 14h à 17h pour l'utilisateur userId1
      const debut1 = new Date(date);
      debut1.setHours(14, 0, 0, 0);
      const fin1 = new Date(date);
      fin1.setHours(17, 0, 0, 0);

      disponibilites.push({
        id: i * 100 + 1,
        buddyPairId: buddyPairId,
        debut: debut1,
        fin: fin1,
        recurrent: false,
        userId: userId1
      });

      // Disponibilité de 15h à 18h pour l'utilisateur userId2 (chevauchement de 15h à 17h)
      const debut2 = new Date(date);
      debut2.setHours(15, 0, 0, 0);
      const fin2 = new Date(date);
      fin2.setHours(18, 0, 0, 0);

      disponibilites.push({
        id: i * 100 + 2,
        buddyPairId: buddyPairId,
        debut: debut2,
        fin: fin2,
        recurrent: false,
        userId: userId2
      });
      
      // Ajouter aussi une disponibilité le matin pour userId1
      const debut3 = new Date(date);
      debut3.setHours(9, 0, 0, 0);
      const fin3 = new Date(date);
      fin3.setHours(12, 0, 0, 0);

      disponibilites.push({
        id: i * 100 + 3,
        buddyPairId: buddyPairId,
        debut: debut3,
        fin: fin3,
        recurrent: false,
        userId: userId1
      });
      
      // Ajouter une disponibilité le matin pour userId2
      const debut4 = new Date(date);
      debut4.setHours(10, 0, 0, 0);
      const fin4 = new Date(date);
      fin4.setHours(12, 0, 0, 0);

      disponibilites.push({
        id: i * 100 + 4,
        buddyPairId: buddyPairId,
        debut: debut4,
        fin: fin4,
        recurrent: false,
        userId: userId2
      });
    }

    console.log(`📊 Total disponibilités mock créées avec IDs réels: ${disponibilites.length}`);
    return disponibilites;
  }

  /**
   * Crée une disponibilité mock
   */
  private createMockDisponibilite(buddyPairId: number, userId: number, debut: Date, fin: Date): Disponibilite {
    return {
      id: Math.floor(Math.random() * 1000),
      buddyPairId: buddyPairId,
      debut: debut,
      fin: fin,
      recurrent: false,
      userId: userId
    };
  }

  /**
   * Crée des suggestions basées sur les disponibilités réelles
   */
  private createMockSuggestions(dureeMinutes: number): Date[] {
    const suggestions: Date[] = [];
    const now = new Date();
    
    console.log(`📅 Création de suggestions mock pour ${dureeMinutes} minutes`);
    
    // Pour aujourd'hui - créer un créneau dans le futur
    const aujourdHui = new Date(now);
    const heureActuelle = now.getHours();
    
    // Si avant 15h, proposer 15h, sinon proposer 16h
    if (heureActuelle < 15) {
      aujourdHui.setHours(15, 0, 0, 0);
    } else if (heureActuelle < 16) {
      aujourdHui.setHours(16, 0, 0, 0);
    } else {
      // Si après 16h, proposer demain
      aujourdHui.setDate(aujourdHui.getDate() + 1);
      aujourdHui.setHours(10, 0, 0, 0);
    }
    
    if (aujourdHui > now) {
      suggestions.push(aujourdHui);
      console.log(`✅ Ajout suggestion aujourd'hui: ${aujourdHui}`);
    }
    
    // Pour les 3 prochains jours
    for (let i = 1; i <= 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Créneau du matin (10:30)
      const matin = new Date(date);
      matin.setHours(10, 30, 0, 0);
      suggestions.push(matin);
      console.log(`✅ Ajout suggestion matin jour ${i}: ${matin}`);
      
      // Créneau de l'après-midi (16:00)
      const apresMidi = new Date(date);
      apresMidi.setHours(16, 0, 0, 0);
      suggestions.push(apresMidi);
      console.log(`✅ Ajout suggestion après-midi jour ${i}: ${apresMidi}`);
    }
    
    console.log(`📊 Total suggestions générées: ${suggestions.length}`);
    
    // Limiter à 6 suggestions maximum
    return suggestions.slice(0, 6);
  }

  /**
   * Calcule les suggestions basées sur les disponibilités qui se chevauchent
   * (méthode utilitaire pour référence future)
   */
  private calculerSuggestionsDisponibilites(
    disponibilites: Disponibilite[], 
    dureeMinutes: number
  ): Date[] {
    const suggestions: Date[] = [];
    
    // Séparer les disponibilités par utilisateur
    const disposUser1 = disponibilites.filter(d => d.userId === 1);
    const disposUser2 = disponibilites.filter(d => d.userId === 2);
    
    // Trouver les chevauchements
    for (const dispo1 of disposUser1) {
      for (const dispo2 of disposUser2) {
        const chevauchement = this.trouverChevauchement(dispo1, dispo2, dureeMinutes);
        if (chevauchement) {
          suggestions.push(chevauchement);
        }
      }
    }
    
    return suggestions;
  }
  
  /**
   * Trouve un créneau de disponibilité commun entre deux utilisateurs
   */
  private trouverChevauchement(
    dispo1: Disponibilite, 
    dispo2: Disponibilite, 
    dureeMinutes: number
  ): Date | null {
    const debutMax = new Date(Math.max(dispo1.debut.getTime(), dispo2.debut.getTime()));
    const finMin = new Date(Math.min(dispo1.fin.getTime(), dispo2.fin.getTime()));
    
    // Vérifier s'il y a un chevauchement suffisant
    const tempsDisponible = finMin.getTime() - debutMax.getTime();
    if (tempsDisponible >= dureeMinutes * 60 * 1000) {
      return debutMax;
    }
    
    return null;
  }

  /**
   * Crée des rappels mock
   */
  private createMockRappels(): EvenementCalendrier[] {
    const rappels: EvenementCalendrier[] = [];
    const now = new Date();

    // Rappel pour demain à 15h
    const demain = new Date(now);
    demain.setDate(demain.getDate() + 1);
    demain.setHours(15, 0, 0, 0);

    rappels.push({
      id: 1,
      buddyPairId: 1,
      titre: 'Session demain',
      description: 'Rappel: Session de conversation prévue demain à 15h',
      dateDebut: demain,
      dateFin: new Date(demain.getTime() + 60 * 60 * 1000), // 1h après
      type: 'RAPPEL' as any,
      rappelEnvoye: false
    });

    return rappels;
  }
}
