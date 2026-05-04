import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewService, Review, ReviewPayload } from '../../core/services/review.service';
import { finalize } from 'rxjs';

/**
 * Modal component to display and manage reviews for a resource.
 * Opens as an overlay when user clicks "Check Reviews" on a resource card.
 * 
 * @example
 * <app-review-modal 
 *   [isOpen]="showReviewModal()" 
 *   [resourceId]="selectedResourceId()"
 *   [resourceTitle]="selectedResourceTitle()"
 *   (close)="closeReviewModal()"
 * />
 */
@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-modal.component.html',
  styleUrl: './review-modal.component.scss'
})
export class ReviewModalComponent implements OnChanges {
  private readonly reviewService = inject(ReviewService);

  @Input() isOpen = false;
  @Input() resourceId: number | null = null;
  @Input() resourceTitle = '';
  @Output() close = new EventEmitter<void>();

  readonly reviews = signal<Review[]>([]);
  readonly comment = signal('');
  readonly rating = signal(0);
  readonly hoverRating = signal(0);
  readonly submitting = signal(false);
  readonly loading = signal(false);

  readonly stars = [1, 2, 3, 4, 5, 6];

  ngOnChanges(): void {
    if (this.isOpen && this.resourceId) {
      this.loadReviews();
    }
  }

  private loadReviews(): void {
    if (!this.resourceId) return;

    this.loading.set(true);
    this.reviewService.getReviewsByResource(this.resourceId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
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

  submitReview(): void {
    if (!this.canSubmit() || !this.resourceId) return;

    const payload: ReviewPayload = {
      rating: this.rating(),
      comment: this.comment(),
      resource: { resourceId: this.resourceId }
    };

    this.submitting.set(true);

    this.reviewService.addReview(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (savedReview) => {
          // Add new review to list
          this.reviews.update(reviews => [...reviews, savedReview]);
          this.resetForm();
        },
        error: (err) => {
          console.error('Failed to save review:', err);
          alert('Failed to save review. Please try again.');
        }
      });
  }

  private resetForm(): void {
    this.comment.set('');
    this.rating.set(0);
  }

  formatStars(rating: number): string {
    const filled = Math.min(Math.max(Math.round(rating), 0), this.stars.length);
    return '★'.repeat(filled) + '☆'.repeat(this.stars.length - filled);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  getAverageRating(): number {
    const reviewList = this.reviews();
    if (reviewList.length === 0) return 0;
    const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviewList.length) * 10) / 10;
  }
}
