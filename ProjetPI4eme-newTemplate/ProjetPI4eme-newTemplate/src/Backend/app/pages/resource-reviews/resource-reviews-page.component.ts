import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService, Review } from '../../services/review.service';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';

/**
 * Resource Reviews Page Component
 * Full CRUD management page for reviews of a specific resource
 * Route: /resource-reviews/:resourceId
 */
@Component({
  selector: 'app-resource-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  templateUrl: './resource-reviews-page.component.html',
  styleUrl: './resource-reviews-page.component.scss'
})
export class ResourceReviewsPageComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resourceId = signal<number>(0);
  reviews = signal<Review[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Form state
  newReview = signal({
    comment: '',
    rating: 0
  });

  editingReview = signal<Review | null>(null);
  showAddForm = signal(false);

  ngOnInit(): void {
    // Get resourceId from route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('resourceId');
      if (id) {
        this.resourceId.set(+id);
        this.loadReviews();
      }
    });
  }

  loadReviews(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reviewService.getReviewsByResource(this.resourceId()).subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load reviews');
        this.loading.set(false);
        console.error('Error loading reviews:', err);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm.set(!this.showAddForm());
    if (this.showAddForm()) {
      this.resetNewReview();
    }
  }

  resetNewReview(): void {
    this.newReview.set({
      comment: '',
      rating: 0
    });
  }

  submitNewReview(): void {
    const form = this.newReview();
    
    if (!form.comment.trim() || form.rating === 0) {
      alert('Please provide both a comment and rating');
      return;
    }

    const payload: Review = {
      comment: form.comment,
      rating: form.rating,
      resource: {
        resourceId: this.resourceId()
      }
    };

    this.loading.set(true);
    this.reviewService.addReview(payload).subscribe({
      next: () => {
        this.loadReviews();
        this.resetNewReview();
        this.showAddForm.set(false);
      },
      error: (err) => {
        alert('Failed to add review');
        console.error('Error adding review:', err);
        this.loading.set(false);
      }
    });
  }

  startEdit(review: Review): void {
    this.editingReview.set({ ...review });
    this.showAddForm.set(false);
  }

  cancelEdit(): void {
    this.editingReview.set(null);
  }

  submitEdit(): void {
    const review = this.editingReview();
    if (!review || !review.idReview) return;

    if (!review.comment.trim() || review.rating === 0) {
      alert('Please provide both a comment and rating');
      return;
    }

    this.loading.set(true);
    this.reviewService.updateReview(review.idReview, review).subscribe({
      next: () => {
        this.loadReviews();
        this.editingReview.set(null);
      },
      error: (err) => {
        alert('Failed to update review');
        console.error('Error updating review:', err);
        this.loading.set(false);
      }
    });
  }

  deleteReview(reviewId: number | undefined): void {
    if (!reviewId) return;

    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    this.loading.set(true);
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (err) => {
        alert('Failed to delete review');
        console.error('Error deleting review:', err);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/resources']);
  }
}
