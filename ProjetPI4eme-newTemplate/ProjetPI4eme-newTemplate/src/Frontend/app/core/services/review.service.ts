import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewResourceRef {
  resourceId: number;
}

export interface Review {
  idReview: number;
  rating: number;
  comment: string;
  resource?: ReviewResourceRef;
  userId?: string;
}

export interface ReviewPayload {
  rating: number;
  comment: string;
  resource: {
    resourceId: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8089/reviews';

  /**
   * Get all reviews for a specific resource
   */
  getReviewsByResource(resourceId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/getReviewsByResource/${resourceId}`);
  }

  /**
   * Get all reviews (use sparingly)
   */
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/allReview`);
  }

  /**
   * Add a new review
   */
  addReview(payload: ReviewPayload): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/addReview`, payload);
  }

  /**
   * Update an existing review
   */
  updateReview(reviewId: number, payload: ReviewPayload): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/updateReview/${reviewId}`, payload);
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteReview/${reviewId}`);
  }
}
