import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ClubMessageService } from '../../services/club-message.service';
import { CommentService } from '../../services/comment.service';
import { ClubMessage, Comment, CreateCommentDTO } from '../../models/forum.models';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './message-detail.component.html',
  styleUrls: ['./message-detail.component.scss']
})
export class MessageDetailComponent implements OnInit, OnDestroy {
  clubId: number = 0;
  messageId: number = 0;
  message: ClubMessage | null = null;
  comments: Comment[] = [];
  loading = true;
  error: string | null = null;
  
  // Formulaire pour ajouter un commentaire
  commentForm: FormGroup;
  submitting = false;
  
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private messageService: ClubMessageService,
    private commentService: CommentService,
    private cdr: ChangeDetectorRef
  ) {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Récupérer les IDs depuis l'URL
    this.route.paramMap.subscribe(params => {
      const clubId = params.get('clubId');
      const messageId = params.get('messageId');
      
      if (clubId && messageId) {
        this.clubId = parseInt(clubId, 10);
        this.messageId = parseInt(messageId, 10);
        this.loadMessageDetail();
      } else {
        this.error = 'URL invalide';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les détails du message et ses commentaires
   */
  loadMessageDetail(): void {
    console.log(`🔄 Chargement du détail du message ${this.messageId}`);
    this.loading = true;
    this.error = null;
    
    // Charger le message
    const messageSub = this.messageService.getMessageById(this.messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.loadComments();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement du message:', error);
        this.error = 'Impossible de charger le message';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(messageSub);
  }

  /**
   * Charge les commentaires du message
   */
  loadComments(): void {
    console.log(`🔄 Chargement des commentaires du message ${this.messageId}`);
    
    const commentsSub = this.commentService.getCommentsByMessage(this.messageId).subscribe({
      next: (comments: Comment[]) => {
        console.log('✅ Commentaires reçus:', comments);
        this.comments = comments.sort((a, b) => 
          new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des commentaires:', error);
        this.error = 'Impossible de charger les commentaires';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(commentsSub);
  }

  /**
   * Soumet un nouveau commentaire
   */
  submitComment(): void {
    if (this.commentForm.invalid || this.submitting) {
      return;
    }

    const comment = this.commentForm.get('comment')?.value;
    console.log('📝 Soumission d\'un nouveau commentaire:', comment);
    
    this.submitting = true;
    
    const commentDTO: CreateCommentDTO = {
      comment: comment.trim(),
      messageId: this.messageId,
      userId: this.getCurrentUserId()
    };

    const submitSub = this.commentService.createComment(commentDTO).pipe(
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (newComment: Comment) => {
        console.log('✅ Commentaire créé avec succès:', newComment);
        
        // Ajouter le commentaire à la liste
        this.comments.push(newComment);
        
        // Réinitialiser le formulaire
        this.commentForm.reset();
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la création du commentaire:', error);
        this.error = 'Impossible de publier le commentaire';
      }
    });

    this.subscriptions.add(submitSub);
  }

  /**
   * Like un commentaire
   */
  likeComment(commentId: number, event: Event): void {
    event.stopPropagation();
    
    const comment = this.comments.find(c => c.commentId === commentId);
    if (!comment) return;

    console.log(`👍 Like du commentaire ${commentId}`);
    
    // Optimistic UI update
    const originalLikes = comment.likes;
    comment.likes = comment.isLiked ? comment.likes - 1 : comment.likes + 1;
    comment.isLiked = !comment.isLiked;
    
    const likeSub = this.commentService.likeComment(commentId).subscribe({
      next: (newLikesCount: number) => {
        console.log(`✅ Like confirmé, nouveau total: ${newLikesCount}`);
        comment.likes = newLikesCount;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du like:', error);
        // Revert optimistic update
        comment.likes = originalLikes;
        comment.isLiked = !comment.isLiked;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(likeSub);
  }

  /**
   * Supprime un commentaire
   */
  deleteComment(commentId: number, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    console.log(`🗑️ Suppression du commentaire ${commentId}`);
    
    const deleteSub = this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        console.log(`✅ Commentaire ${commentId} supprimé avec succès`);
        
        // Retirer le commentaire de la liste
        this.comments = this.comments.filter(c => c.commentId !== commentId);
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error(`❌ Erreur lors de la suppression du commentaire ${commentId}:`, error);
        this.error = 'Impossible de supprimer le commentaire';
      }
    });

    this.subscriptions.add(deleteSub);
  }

  /**
   * Like le message principal
   */
  likeMessage(): void {
    if (!this.message || !this.message.id) return;

    console.log(`👍 Like du message ${this.message.id}`);
    
    // Optimistic UI update
    const originalLikes = this.message.likes;
    this.message.likes = this.message.isLiked ? this.message.likes - 1 : this.message.likes + 1;
    this.message.isLiked = !this.message.isLiked;
    
    const likeSub = this.messageService.likeMessage(this.message.id).subscribe({
      next: (newLikesCount: number) => {
        console.log(`✅ Like confirmé, nouveau total: ${newLikesCount}`);
        this.message!.likes = newLikesCount;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du like:', error);
        // Revert optimistic update
        this.message!.likes = originalLikes;
        this.message!.isLiked = !this.message!.isLiked;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(likeSub);
  }

  /**
   * Retourne à la liste des messages du forum
   */
  goBack(): void {
    this.router.navigate(['/clubs', this.clubId]);
  }

  /**
   * Formate la date de publication
   */
  formatDate(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    } else {
      return messageDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Vérifie si le commentaire peut être supprimé par l'utilisateur actuel
   */
  canDeleteComment(comment: Comment): boolean {
    return comment.userId === this.getCurrentUserId();
  }

  /**
   * Récupère l'ID de l'utilisateur actuel
   */
  getCurrentUserId(): number {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.id || 1;
    }
    return 1;
  }

  /**
   * Réinitialise le formulaire
   */
  resetForm(): void {
    this.commentForm.reset();
    this.cdr.detectChanges();
  }

  /**
   * TrackBy function pour optimiser le rendu des commentaires
   */
  trackByCommentId(index: number, comment: Comment): number {
    return comment.commentId;
  }
}