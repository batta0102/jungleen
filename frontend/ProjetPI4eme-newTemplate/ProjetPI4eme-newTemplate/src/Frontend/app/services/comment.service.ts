import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Comment, CreateCommentDTO } from '../models/forum.models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly apiUrl = 'http://localhost:9090/api';
  private readonly commentsEndpoint = `${this.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les commentaires d'un message
   */
  getCommentsByMessage(messageId: number): Observable<Comment[]> {
    console.log(`🔍 Chargement des commentaires du message ${messageId}`);
    
    return this.http.get<Comment[]>(`${this.commentsEndpoint}/all/By-Message/${messageId}`).pipe(
      map((comments: Comment[]) => {
        console.log(`✅ Commentaires du message ${messageId} reçus:`, comments);
        return comments.map(comment => ({
          ...comment,
          dateCreation: new Date(comment.dateCreation),
          isLiked: false
        }));
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du chargement des commentaires du message ${messageId}:`, error);
        return throwError(() => new Error(`Impossible de charger les commentaires du message ${messageId}`));
      })
    );
  }

  /**
   * Crée un nouveau commentaire sur un message
   */
  createComment(comment: CreateCommentDTO): Observable<Comment> {
    console.log('📝 Création d\'un nouveau commentaire:', comment);
    
    return this.http.post<Comment>(this.commentsEndpoint, comment).pipe(
      map((newComment: Comment) => {
        console.log('✅ Commentaire créé avec succès:', newComment);
        return {
          ...newComment,
          dateCreation: new Date(newComment.dateCreation),
          likes: 0,
          isLiked: false
        };
      }),
      catchError((error: any) => {
        console.error('❌ Erreur lors de la création du commentaire:', error);
        return throwError(() => new Error('Impossible de créer le commentaire'));
      })
    );
  }

  /**
   * Ajoute un like à un commentaire
   */
  likeComment(commentId: number): Observable<number> {
    console.log(`👍 Like du commentaire ${commentId}`);
    
    return this.http.put<number>(`${this.commentsEndpoint}/like/${commentId}`, {}).pipe(
      tap((likesCount: number) => {
        console.log(`✅ Like ajouté au commentaire ${commentId}, total: ${likesCount}`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors du like du commentaire ${commentId}:`, error);
        return throwError(() => new Error('Impossible d\'ajouter le like'));
      })
    );
  }

  /**
   * Supprime un commentaire
   */
  deleteComment(commentId: number): Observable<void> {
    console.log(`🗑️ Suppression du commentaire ${commentId}`);
    
    return this.http.delete<void>(`${this.commentsEndpoint}/${commentId}`).pipe(
      tap(() => {
        console.log(`✅ Commentaire ${commentId} supprimé avec succès`);
      }),
      catchError((error: any) => {
        console.error(`❌ Erreur lors de la suppression du commentaire ${commentId}:`, error);
        return throwError(() => new Error('Impossible de supprimer le commentaire'));
      })
    );
  }
}
