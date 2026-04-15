import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  idReview?: number;
  comment: string;
  rating: number;
  resource: {
    resourceId: number;
  };
}

/**
 * Review Service
 * Handles all review-related API calls to Spring Boot backend
 * Base URL: http://localhost:8089/reviews
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8089/reviews';

  /**
   * Get all reviews for a specific resource
   * @param resourceId - The resource ID
   * @returns Observable<Review[]>
   */
  getReviewsByResource(resourceId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/getReviewsByResource/${resourceId}`);
  }

  /**
   * Get all reviews (admin/management use)
   * @returns Observable<Review[]>
   */
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/getAllReviews`);
  }

  /**
   * Add a new review
   * @param review - The review payload
   * @returns Observable<Review>
   */
  addReview(review: Review): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/addReview`, review);
  }

  /**
   * Update an existing review
   * @param reviewId - The review ID
   * @param review - The updated review payload
   * @returns Observable<Review>
   */
  updateReview(reviewId: number, review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/updateReview/${reviewId}`, review);
  }

  /**
   * Delete a review
   * @param reviewId - The review ID
   * @returns Observable<void>
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteReview/${reviewId}`);
  }
}
