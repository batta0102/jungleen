// Enums pour le système de Buddy
export enum BuddyMatchStatus {
  PENDING = 'PENDING',      // En attente de validation
  ACTIVE = 'ACTIVE',        // Buddy actif (correspond au backend)
  COMPLETED = 'COMPLETED',   // Buddy terminé
  CANCELLED = 'CANCELLED'    // Buddy annulé
}

export enum SessionStatus {
  PLANIFIEE = 'PLANIFIEE',    // Ceux-ci sont en français dans votre backend
  CONFIRMEE = 'CONFIRMEE',    // Session confirmée par les participants
  ANNULEE = 'ANNULEE',
  TERMINEE = 'TERMINEE',      // Session terminée
  COMPLETEE = 'COMPLETEE',
  REPORTEE = 'REPORTEE'
}

export enum SatisfactionLevel {
  TRES_SATISFAIT = 'TRES_SATISFAIT',
  SATISFAIT = 'SATISFAIT',
  NEUTRE = 'NEUTRE',
  PEU_SATISFAIT = 'PEU_SATISFAIT',
  PAS_SATISFAIT = 'PAS_SATISFAIT'
}

// Interface pour BuddyPair
export interface BuddyPair {
  idPair: number;
  userID_1: number;
  userID_2: number;
  clubId: number;
  status: BuddyMatchStatus;
  dateCreation: Date;
  dateActivation?: Date;
  dateFin?: Date;
  user1?: {
    id: number;
    nom: string;
    prenom?: string;
    email: string;
    avatar?: string;
  };
  user2?: {
    id: number;
    nom: string;
    prenom?: string;
    email: string;
    avatar?: string;
  };
  club?: {
    idClub: number;
    nom: string;
  };
}

// Interface pour BuddySession
export interface BuddySession {
  idSession: number;
  buddyPair?: BuddyPair; // Backend uses @ManyToOne relationship
  buddyPairId?: number; // 🔧 TEMPORAIRE : Pour compatibilité avec le backend actuel
  date: string; // Backend returns string, not Date
  duree: number; // Backend returns duree, not dureeMinutes
  sujet?: string; // Backend has sujet field
  notes?: string; // Backend has notes, not description
  status: string; // Backend returns string, not SessionStatus enum
  confirmeParUtilisateur1?: boolean; // Backend field names
  confirmeParUtilisateur2?: boolean;
  satisfactionUtilisateur1?: string | null;
  satisfactionUtilisateur2?: string | null;
  // Keep frontend fields for compatibility
  userIdCreateur?: number;
  lieu?: string;
  description?: string;
  dateCreation?: Date;
  confirmationUser1?: boolean;
  confirmationUser2?: boolean;
  satisfactionUser1?: SatisfactionLevel;
  satisfactionUser2?: SatisfactionLevel;
  commentaireUser1?: string;
  commentaireUser2?: string;
  createur?: {
    id: number;
    nom: string;
    email: string;
    avatar?: string;
  };
}

// DTO pour la création de BuddyPair
export interface CreateBuddyPairDTO {
  userID_1: number;
  userID_2: number;
  club: {
    idClub: number;
  };
  niveauCible?: string;
  message?: string;
}

// DTO pour la création de Session
export interface CreateSessionDTO {
  buddyPairId: number;
  dateSession: string; // Changé de Date à string pour le backend
  dureeMinutes: number;
  lieu?: string;
  description?: string;
}

// DTO pour la confirmation de session
export interface ConfirmSessionDTO {
  satisfaction: SatisfactionLevel;
  commentaire?: string;
}
