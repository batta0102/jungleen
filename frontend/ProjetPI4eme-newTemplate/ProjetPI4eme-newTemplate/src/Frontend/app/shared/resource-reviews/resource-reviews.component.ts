import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

interface Resource {
  resourceId: number;
  title: string;
  description: string;
  type: string;
}

interface ReviewResourceRef {
  resourceId: number;
}

interface Review {
  idReview: number;
  rating: number;
  comment: string;
  resource?: ReviewResourceRef;
  userId?: string; // To track which user created the review
}

interface ReviewResponse {
  idReview: number;
  rating: number;
  comment: string;
  resource?: ReviewResourceRef;
}

@Component({
  selector: 'app-resource-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-reviews.component.html',
  styleUrl: './resource-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceReviewsComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8089';

  readonly resources = signal<Resource[]>([]);
  readonly reviewsByResource = signal<Record<number, Review[]>>({});
  readonly commentDrafts = signal<Record<number, string>>({});
  readonly ratingDrafts = signal<Record<number, number>>({});
  readonly hoverDrafts = signal<Record<number, number>>({});
  readonly submitting = signal<Record<number, boolean>>({});
  readonly editingReview = signal<Record<number, number | null>>({});

  readonly stars = [1, 2, 3, 4, 5, 6];

  constructor() {
    this.loadResources();
    this.loadReviews();
  }

  private loadResources(): void {
    this.http
      .get<Resource[]>(`${this.baseUrl}/resources/allResources`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (items) => this.resources.set(items ?? []),
        error: () => this.resources.set([])
      });
  }

  private loadReviews(): void {
    // Load reviews for all resources individually
    const resourceIds = this.resources();
    resourceIds.forEach(resource => {
      this.loadReviewsForResource(resource.resourceId);
    });
  }

  private loadReviewsForResource(resourceId: number): void {
    this.http
      .get<Review[]>(`${this.baseUrl}/reviews/getReviewsByResource/${resourceId}`)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (reviews) => {
          this.reviewsByResource.update(prev => ({
            ...prev,
            [resourceId]: reviews ?? []
          }));
        },
        error: () => {
          this.reviewsByResource.update(prev => ({
            ...prev,
            [resourceId]: []
          }));
        }
      });
  }

  private groupReviews(items: Review[]): Record<number, Review[]> {
    return items.reduce<Record<number, Review[]>>((acc, item) => {
      const resourceId = item.resource?.resourceId;
      if (!resourceId) return acc;
      acc[resourceId] = acc[resourceId] ? [...acc[resourceId], item] : [item];
      return acc;
    }, {});
  }

  getReviews(resourceId: number): Review[] {
    return this.reviewsByResource()[resourceId] ?? [];
  }

  getComment(resourceId: number): string {
    return this.commentDrafts()[resourceId] ?? '';
  }

  getRating(resourceId: number): number {
    return this.ratingDrafts()[resourceId] ?? 0;
  }

  getDisplayRating(resourceId: number): number {
    return this.hoverDrafts()[resourceId] ?? this.getRating(resourceId);
  }

  setComment(resourceId: number, value: string): void {
    this.commentDrafts.update((prev) => ({ ...prev, [resourceId]: value }));
  }

  setRating(resourceId: number, value: number): void {
    this.ratingDrafts.update((prev) => ({ ...prev, [resourceId]: value }));
  }

  setHoverRating(resourceId: number, value: number): void {
    this.hoverDrafts.update((prev) => ({ ...prev, [resourceId]: value }));
  }

  clearHoverRating(resourceId: number): void {
    this.hoverDrafts.update((prev) => ({ ...prev, [resourceId]: 0 }));
  }

  canSubmit(resourceId: number): boolean {
    const rating = this.getRating(resourceId);
    const submitting = this.submitting()[resourceId] ?? false;
    return rating > 0 && !submitting;
  }

  isEditing(resourceId: number, reviewId: number): boolean {
    return this.editingReview()[resourceId] === reviewId;
  }

  startEdit(resourceId: number, review: Review): void {
    this.editingReview.update(prev => ({ ...prev, [resourceId]: review.idReview }));
    this.setComment(resourceId, review.comment);
    this.setRating(resourceId, review.rating);
  }

  cancelEdit(resourceId: number): void {
    this.editingReview.update(prev => ({ ...prev, [resourceId]: null }));
    this.setComment(resourceId, '');
    this.setRating(resourceId, 0);
  }

  getEditingReviewId(resourceId: number): number | null {
    return this.editingReview()[resourceId] ?? null;
  }

  addReview(resourceId: number): void {
    if (!this.canSubmit(resourceId)) return;

    const editingReviewId = this.getEditingReviewId(resourceId);
    
    if (editingReviewId) {
      this.updateReview(resourceId, editingReviewId);
      return;
    }

    const payload = {
      rating: this.getRating(resourceId),
      comment: this.getComment(resourceId),
      resource: {
        resourceId
      }
    };

    this.submitting.update((prev) => ({ ...prev, [resourceId]: true }));

    this.http
      .post<ReviewResponse>(`${this.baseUrl}/reviews/addReview`, payload)
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.submitting.update((prev) => ({ ...prev, [resourceId]: false })))
      )
      .subscribe({
        next: (created) => {
          const createdResourceId = created.resource?.resourceId ?? resourceId;
          const newReview: Review = {
            idReview: created.idReview,
            rating: created.rating,
            comment: created.comment,
            resource: { resourceId: createdResourceId }
          };

          this.reviewsByResource.update((prev) => ({
            ...prev,
            [createdResourceId]: [...(prev[createdResourceId] ?? []), newReview]
          }));

          this.commentDrafts.update((prev) => ({ ...prev, [resourceId]: '' }));
          this.ratingDrafts.update((prev) => ({ ...prev, [resourceId]: 0 }));
        }
      });
  }

  updateReview(resourceId: number, reviewId: number): void {
    if (!this.canSubmit(resourceId)) return;

    const payload = {
      rating: this.getRating(resourceId),
      comment: this.getComment(resourceId),
      resource: {
        resourceId
      }
    };

    this.submitting.update((prev) => ({ ...prev, [resourceId]: true }));

    this.http
      .put<ReviewResponse>(`${this.baseUrl}/reviews/updateReview/${reviewId}`, payload)
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.submitting.update((prev) => ({ ...prev, [resourceId]: false })))
      )
      .subscribe({
        next: (updated) => {
          const updatedReview: Review = {
            idReview: updated.idReview,
            rating: updated.rating,
            comment: updated.comment,
            resource: { resourceId }
          };

          this.reviewsByResource.update((prev) => {
            const reviews = prev[resourceId] ?? [];
            return {
              ...prev,
              [resourceId]: reviews.map(r => 
                r.idReview === reviewId ? updatedReview : r
              )
            };
          });

          this.cancelEdit(resourceId);
        }
      });
  }

  formatStars(rating: number): string {
    const filled = Math.min(Math.max(Math.round(rating), 0), this.stars.length);
    return '★'.repeat(filled) + '☆'.repeat(this.stars.length - filled);
  }
}
