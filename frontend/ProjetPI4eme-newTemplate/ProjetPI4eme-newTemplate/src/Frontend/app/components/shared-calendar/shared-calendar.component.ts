import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CalendarService } from '../../services/calendar.service';
import { DisponibiliteService } from '../../services/disponibilite.service';
import { AuthSimpleService } from '../../services/auth-simple.service';
import { BuddySessionService } from '../../services/buddy-session.service';
import {
  Disponibilite,
  EvenementCalendrier,
  TypeEvenement,
  JourCalendrier
} from '../../models/calendar.models';

@Component({
  selector: 'app-shared-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-calendar.component.html',
  styleUrls: ['./shared-calendar.component.scss']
})
export class SharedCalendarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() buddyPairId!: number;
  @Input() userId1!: number;
  @Input() userId2!: number;

  // Rendre l'enum accessible dans le template
  TypeEvenement = TypeEvenement;

  // Jours de la semaine
  joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Date de début de la semaine affichée
  semaineDebut: Date = new Date();

  // Jours du mois à afficher
  joursMois: JourCalendrier[] = [];

  // Disponibilités de l'utilisateur
  mesDisponibilites: Disponibilite[] = [];

  // Toutes les disponibilités du buddy pair
  toutesDisponibilites: Disponibilite[] = [];

  // Événements du calendrier
  evenements: EvenementCalendrier[] = [];

  // Suggestions de créneaux
  suggestions: Date[] = [];

  // ID de l'utilisateur connecté
  currentUserId: number | null = null;

  // État du modal d'ajout
  modalAjoutOuvert = false;
  nouvelleDispoDebut: string = '';
  nouvelleDispoFin: string = '';

  // Durée par défaut pour les suggestions (60 minutes)
  dureeSuggestion: number = 60;

  // Loading states
  chargement = false;
  private dataLoaded = false;

  private subscriptions = new Subscription();

  constructor(
    private calendarService: CalendarService,
    private disponibiliteService: DisponibiliteService,
    private authService: AuthSimpleService,
    private buddySessionService: BuddySessionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('📅 SharedCalendarComponent initialisé');
    console.log('📅 Services injectés:', {
      calendarService: !!calendarService,
      disponibiliteService: !!disponibiliteService,
      authService: !!authService,
      buddySessionService: !!buddySessionService
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.genererJoursMois();
    // Charger uniquement si l'input est déjà fourni au premier rendu
    if (this.buddyPairId) {
      this.chargerDonnees();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Quand le parent fournit enfin buddyPairId, déclencher le chargement
    if (changes['buddyPairId'] && this.buddyPairId) {
      this.chargerDonnees();
    }
  }

  /**
   * Génère les jours à afficher pour le mois courant
   */
  genererJoursMois(): void {
    const debut = new Date(this.semaineDebut);
    // Aller au lundi de la semaine
    const jourSemaine = debut.getDay();
    const decalage = jourSemaine === 0 ? -6 : 1 - jourSemaine;
    debut.setDate(debut.getDate() + decalage);

    console.log(`📅 Génération des jours - semaine début: ${debut.toDateString()}`);

    this.joursMois = [];
    const aujourdhui = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(debut);
      date.setDate(debut.getDate() + i);

      this.joursMois.push({
        date: date,
        numero: date.getDate(),
        estMoisCourant: date.getMonth() === this.semaineDebut.getMonth(),
        estAujourdhui: date.toDateString() === aujourdhui.toDateString(),
        evenements: [],
        disponibilites: []
      });
    }

    console.log(`📅 Jours générés: ${this.joursMois.length} jours`);
    console.log(`📅 Aujourd'hui (${aujourdhui.toDateString()}) est dans la liste:`, this.joursMois.some(j => j.estAujourdhui));
  }

  /**
   * Charge les données du calendrier
   */
  private chargerDonnees(): void {
    console.log('📅 Chargement des données du calendrier...');
    console.log('📅 buddyPairId:', this.buddyPairId);
    console.log('📅 userId1:', this.userId1);
    console.log('📅 userId2:', this.userId2);
    console.log('📅 currentUserId:', this.currentUserId);
    
    this.chargement = true;
    
    // Essayer avec le service Calendar d'abord
    this.chargerAvecCalendarService();
    
    // En parallèle, essayer avec le DisponibiliteService pour comparaison
    this.chargerAvecDisponibiliteService();

    // Charger les suggestions
    this.chargerSuggestions();
  }

  /**
   * Charge les données avec CalendarService (méthode originale)
   */
  private chargerAvecCalendarService(): void {
    console.log('📅 Tentative avec CalendarService...');
    
    const sub = this.calendarService.getDisponibilites(this.buddyPairId).subscribe({
      next: (dispos) => {
        console.log('📅 Données reçues via CalendarService:', dispos);
        
        // Convertir les dates string en objets Date
        this.toutesDisponibilites = dispos.map(dispo => ({
          ...dispo,
          debut: new Date(dispo.debut),
          fin: new Date(dispo.fin)
        }));
        
        console.log('📅 Disponibilités converties:', this.toutesDisponibilites);
        this.mesDisponibilites = this.toutesDisponibilites.filter(d => d.userId === this.currentUserId);
        this.associerDisponibilitesAuxJours();
        this.chargement = false;
        this.dataLoaded = true;
      },
      error: (err) => {
        console.error('❌ Erreur chargement disponibilités CalendarService:', err);
        this.chargerAvecDisponibiliteService();
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Charge les données avec DisponibiliteService (nouvelle méthode)
   */
  private chargerAvecDisponibiliteService(): void {
    console.log('📅 Tentative avec DisponibiliteService...');
    
    const sub = this.disponibiliteService.getDisponibilitesByBuddyPair(this.buddyPairId).subscribe({
      next: (dispos) => {
        console.log('📅 Données reçues via DisponibiliteService:', dispos);
        
        this.toutesDisponibilites = dispos;
        this.mesDisponibilites = this.toutesDisponibilites.filter(d => d.userId === this.currentUserId);
        this.associerDisponibilitesAuxJours();
        this.chargement = false;
        this.dataLoaded = true;
        
        console.log('📅 Succès avec DisponibiliteService!');
      },
      error: (err) => {
        console.error('❌ Erreur chargement disponibilités DisponibiliteService:', err);
        console.log('🔄 Utilisation des données mock avec IDs réels pour les disponibilités');
        
        // Utiliser les disponibilités mock avec les vrais IDs des utilisateurs
        const mockDispos = this.calendarService.createMockDisponibilitesWithRealIds(
          this.buddyPairId, 
          this.userId1, 
          this.userId2
        );
        
        this.toutesDisponibilites = mockDispos;
        this.mesDisponibilites = this.toutesDisponibilites.filter(d => d.userId === this.currentUserId);
        this.associerDisponibilitesAuxJours();
        this.chargement = false;
        this.dataLoaded = true;
        
        console.log('📅 Utilisation des données mock -', mockDispos.length, 'créneaux créés');
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Associe les disponibilités aux jours correspondants
   */
  associerDisponibilitesAuxJours(): void {
    console.log('📅 Association des disponibilités aux jours...');
    console.log('📅 Disponibilités à traiter:', this.toutesDisponibilites.length);
    
    this.joursMois.forEach(jour => {
      const disponibilitesDuJour = this.toutesDisponibilites.filter(dispo => {
        const dateDispo = new Date(dispo.debut);
        const dateJour = jour.date;
        const memeJour = dateDispo.toDateString() === dateJour.toDateString();
        
        if (memeJour) {
          console.log(`📅 Disponibilité trouvée pour ${dateJour.toDateString()}:`, dispo);
        }
        
        return memeJour;
      });
      
      jour.disponibilites = disponibilitesDuJour;
      
      if (disponibilitesDuJour.length > 0) {
        console.log(`📅 Jour ${jour.date.toDateString()} a ${disponibilitesDuJour.length} disponibilités`);
      }
    });
    
    console.log('📅 Association terminée');
    console.log('📅 Vérification finale - jours avec dispos:', this.joursMois.filter(j => j.disponibilites.length > 0).length);
    
    // Forcer la détection de changement pour mettre à jour l'UI
    this.cdr.detectChanges();
  }

  /**
   * Récupère les événements d'un jour par type
   */
  getEvenementsParType(jour: JourCalendrier, type: TypeEvenement): EvenementCalendrier[] {
    return this.evenements.filter(e =>
      e.type === type && new Date(e.dateDebut).toDateString() === jour.date.toDateString()
    );
  }

  /**
   * Récupère les disponibilités d'un jour
   */
  getDisponibilitesDuJour(jour: JourCalendrier): Disponibilite[] {
    const dispos = jour.disponibilites || [];
    console.log(`🔍 getDisponibilitesDuJour pour ${jour.date.toDateString()}: ${dispos.length} dispos`);
    return dispos;
  }

  /**
   * Change de semaine
   */
  changerSemaine(direction: number): void {
    this.semaineDebut.setDate(this.semaineDebut.getDate() + direction * 7);
    this.genererJoursMois();
    this.associerDisponibilitesAuxJours();
  }

  /**
   * Ouvre le modal d'ajout de disponibilité
   */
  ouvrirModalAjout(): void {
    this.modalAjoutOuvert = true;

    // Pré-remplir avec le créneau horaire actuel par défaut
    const maintenant = new Date();
    const dansUneHeure = new Date(maintenant.getTime() + 60 * 60 * 1000);

    this.nouvelleDispoDebut = this.formatDateForInput(maintenant);
    this.nouvelleDispoFin = this.formatDateForInput(dansUneHeure);
  }

  /**
   * Formate une date pour l'input datetime-local
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Ferme le modal d'ajout
   */
  fermerModalAjout(): void {
    this.modalAjoutOuvert = false;
    this.nouvelleDispoDebut = '';
    this.nouvelleDispoFin = '';
  }

  /**
   * Ajoute une nouvelle disponibilité
   */
  ajouterDisponibilite(): void {
    if (!this.currentUserId || !this.nouvelleDispoDebut || !this.nouvelleDispoFin) {
      return;
    }

    const debut = new Date(this.nouvelleDispoDebut);
    const fin = new Date(this.nouvelleDispoFin);

    if (debut >= fin) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    const sub = this.calendarService.ajouterDisponibilite(
      this.buddyPairId,
      this.currentUserId,
      debut,
      fin
    ).subscribe({
      next: (nouvelleDispo) => {
        console.log('✅ Disponibilité ajoutée avec succès:', nouvelleDispo);
        
        // Forcer le rechargement depuis le backend pour s'assurer d'avoir les données à jour
        const reloadSub = this.calendarService.getDisponibilites(this.buddyPairId).subscribe({
          next: (dispos) => {
            // Convertir les dates string en objets Date après rechargement aussi
            this.toutesDisponibilites = dispos.map(dispo => ({
              ...dispo,
              debut: new Date(dispo.debut),
              fin: new Date(dispo.fin)
            }));
            this.mesDisponibilites = this.toutesDisponibilites.filter(d => d.userId === this.currentUserId);
            this.associerDisponibilitesAuxJours();
            console.log('🔄 Données rechargées:', dispos.length, 'disponibilités');
          },
          error: (err) => {
            console.error('❌ Erreur rechargement:', err);
          }
        });
        
        this.fermerModalAjout();
        this.chargerSuggestions(); // Recalculer les suggestions
        this.subscriptions.add(reloadSub);
      },
      error: (err) => {
        console.error('Erreur ajout disponibilité:', err);
        alert('Erreur lors de l\'ajout de la disponibilité');
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Supprime une disponibilité
   */
  supprimerDisponibilite(id: number, event: Event): void {
    event.stopPropagation();

    if (!confirm('Supprimer cette disponibilité ?')) {
      return;
    }

    const sub = this.calendarService.supprimerDisponibilite(id).subscribe({
      next: () => {
        this.toutesDisponibilites = this.toutesDisponibilites.filter(d => d.id !== id);
        this.mesDisponibilites = this.mesDisponibilites.filter(d => d.id !== id);
        this.associerDisponibilitesAuxJours();
        this.chargerSuggestions();
      },
      error: (err) => {
        console.error('Erreur suppression disponibilité:', err);
        alert('Erreur lors de la suppression');
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Charge les suggestions de créneaux
   */
  chargerSuggestions(): void {
    const sub = this.calendarService.getSuggestions(this.buddyPairId, this.dureeSuggestion).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
      },
      error: (err) => {
        console.error('Erreur chargement suggestions:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Planifie une session à partir d'une suggestion
   */
  planifierDepuisSuggestion(date: Date | string): void {
    // Convertir en Date si c'est une chaîne
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Naviguer vers la page de planification avec la date pré-remplie
    this.router.navigate(['/buddies', this.buddyPairId, 'plan-session'], {
      queryParams: { date: dateObj.toISOString() }
    });
  }

  /**
   * Navigue vers le détail d'un événement
   */
  voirEvenement(event: EvenementCalendrier): void {
    if (event.type === 'SESSION' && event.sessionId) {
      this.router.navigate(['/buddies', this.buddyPairId, 'sessions', event.sessionId]);
    }
  }

  /**
   * Force le rechargement des données du calendrier
   */
  refreshCalendar(): void {
    console.log('🔄 Forcing calendar data refresh...');
    this.dataLoaded = false; // Reset flag to force reload
    this.chargerDonnees();
  }

  /**
   * Change la durée des suggestions
   */
  changerDureeSuggestion(duree: number): void {
    this.dureeSuggestion = duree;
    this.chargerSuggestions();
  }
}
