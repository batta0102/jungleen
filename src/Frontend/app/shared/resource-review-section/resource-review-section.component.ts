import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewService, Review, ReviewPayload } from '../../core/services/review.service';
import { finalize } from 'rxjs';

/**
 * Reusable component to display and manage reviews for a single resource.
 * Use this component inside resource cards.
 * 
 * @example
 * <app-resource-review-section [resourceId]="resource.resourceId" />
 */
@Component({
  selector: 'app-resource-review-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-review-section.component.html',
  styleUrl: './resource-review-section.component.scss'
})
export class ResourceReviewSectionComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  @Input({ required: true }) resourceId!: number;

  readonly reviews = signal<Review[]>([]);
  readonly comment = signal('');
  readonly rating = signal(0);
  readonly hoverRating = signal(0);
  readonly submitting = signal(false);
  readonly editingReviewId = signal<number | null>(null);

  readonly stars = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.loadReviews();
  }

  private loadReviews(): void {
    this.reviewService.getReviewsByResource(this.resourceId).subscribe({
      next: (reviews) => this.reviews.set(reviews ?? []),
      error: () => this.reviews.set([])
    });
  }

  getDisplayRating(): number {
    return this.hoverRating() || this.rating();
  }

  setHoverRating(value: number): void {
    this.hoverRating.set(value);
  }

  clearHoverRating(): void {
    this.hoverRating.set(0);
  }

  setRating(value: number): void {
    this.rating.set(value);
  }

  canSubmit(): boolean {
    return this.rating() > 0 && !this.submitting();
  }

  startEdit(review: Review): void {
    this.editingReviewId.set(review.idReview);
    this.comment.set(review.comment);
    this.rating.set(review.rating);
  }

  cancelEdit(): void {
    this.editingReviewId.set(null);
    this.comment.set('');
    this.rating.set(0);
  }

  submitReview(): void {
    if (!this.canSubmit()) return;

    const payload: ReviewPayload = {
      rating: this.rating(),
      comment: this.comment(),
      resource: { resourceId: this.resourceId }
    };

    const editingId = this.editingReviewId();
    this.submitting.set(true);

    const request$ = editingId
      ? this.reviewService.updateReview(editingId, payload)
      : this.reviewService.addReview(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (savedReview) => {
          if (editingId) {
            // Update existing review
            this.reviews.update(reviews =>
              reviews.map(r => r.idReview === editingId ? savedReview : r)
            );
          } else {
            // Add new review
            this.reviews.update(reviews => [...reviews, savedReview]);
          }
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to save review:', err);
        }
      });
  }

  private resetForm(): void {
    this.comment.set('');
    this.rating.set(0);
    this.editingReviewId.set(null);
  }

  formatStars(rating: number): string {
    const filled = Math.min(Math.max(Math.round(rating), 0), this.stars.length);
    return '★'.repeat(filled) + '☆'.repeat(this.stars.length - filled);
  }
}
