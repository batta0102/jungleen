export interface ClubMessage {
  idMessage?: number;
  id?: number; // Pour compatibilité
  userId: number;
  contenu: string;
  likes: number;
  dateEnvoi: Date;
  clubId?: number;
  club?: {
    idClub: number;
    nom: string;
  };
  user?: {
    id: number;
    nom: string;
    email: string;
    avatar?: string;
  };
  comments?: Comment[];
  isPinned?: boolean;
  isLiked?: boolean;
  raisonEpingle?: string; // Ajout de la raison d'épinglage
}

export interface Comment {
  commentId: number;
  comment: string;
  dateCreation: Date;
  likes: number;
  userId: number;
  clubMessageId?: number;
  user?: {
    id: number;
    nom: string;
    email: string;
    avatar?: string;
  };
  isLiked?: boolean;
}

export interface CreateMessageDTO {
  contenu: string;
  clubId: number;  // ← DOIT ÊTRE "clubId" (pas "club", pas "club_id")
  userId: number;
}

export interface CreateCommentDTO {
  comment: string;
  userId: number;
  messageId: number;
}

export interface ForumStats {
  totalMessages: number;
  totalComments: number;
  totalLikes: number;
  activeUsers: number;
  messagesThisWeek: number;
  topContributors: {
    userId: number;
    userName: string;
    messageCount: number;
    commentCount: number;
  }[];
}