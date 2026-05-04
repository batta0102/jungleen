// Enums pour les jours de la semaine
export enum JourSemaine {
  LUNDI = 'LUNDI',
  MARDI = 'MARDI',
  MERCREDI = 'MERCREDI',
  JEUDI = 'JEUDI',
  VENDREDI = 'VENDREDI',
  SAMEDI = 'SAMEDI',
  DIMANCHE = 'DIMANCHE'
}

// Enum pour les types d'événements
export enum TypeEvenement {
  SESSION = 'SESSION',
  RAPPEL = 'RAPPEL',
  DISPONIBILITE = 'DISPONIBILITE',
  AUTRE = 'AUTRE'
}

// Interface pour les disponibilités
export interface Disponibilite {
  id?: number;
  buddyPairId: number;
  debut: Date;
  fin: Date;
  jour?: JourSemaine;
  recurrent: boolean;
  dateDebutValidite?: Date;
  dateFinValidite?: Date;
  userId: number;
}

// Interface pour les événements du calendrier
export interface EvenementCalendrier {
  id?: number;
  buddyPairId: number;
  titre: string;
  description?: string;
  dateDebut: Date;
  dateFin: Date;
  type: TypeEvenement;
  sessionId?: number;
  rappelEnvoye: boolean;
}

// Interface pour les suggestions de créneaux
export interface CreneauSuggestion {
  date: Date;
  duree: number;
  score?: number;
}

// Interface pour les créneaux horaires
export interface CreneauHoraire {
  debut: string; // Format "HH:mm"
  fin: string;   // Format "HH:mm"
  disponible: boolean;
}

// Interface pour un jour du calendrier
export interface JourCalendrier {
  date: Date;
  numero: number;
  estMoisCourant: boolean;
  estAujourdhui: boolean;
  evenements: EvenementCalendrier[];
  disponibilites: Disponibilite[];
}
