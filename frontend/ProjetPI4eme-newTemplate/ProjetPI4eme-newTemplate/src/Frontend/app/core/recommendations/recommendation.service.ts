import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { RecommendationProduct, RecommendationResponse } from './recommendation.model';
import { ProductService, Product } from '../../shared/product/product';

/**
 * Recommendation Service
 * Provides product recommendations based on category or user behavior
 * Falls back to mock data if API is unavailable
 */
@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private http = inject(HttpClient);
  private productService = inject(ProductService);
  
  private baseUrl = 'http://localhost:8085/recommendations';

  /**
   * Get similar products based on category
   * @param category Product category
   * @param excludeProductId Product ID to exclude from results
   * @param limit Maximum number of recommendations
   * @returns Observable of recommended products
   */
  getSimilarProducts(category: string, excludeProductId?: number, limit: number = 4): Observable<RecommendationProduct[]> {
    console.log(`[RecommendationService] Getting similar products for category: ${category}`);
    
    // Try recommendation API first, fall back to filtering products by category
    return this.productService.getAllProducts().pipe(
      map(products => {
        // Filter by category and exclude current product
        let filtered = products.filter(p => 
          p.category?.toLowerCase() === category?.toLowerCase()
        );
        
        if (excludeProductId) {
          filtered = filtered.filter(p => p.idProduct !== excludeProductId);
        }
        
        // Shuffle and limit results
        const shuffled = this.shuffleArray([...filtered]);
        const limited = shuffled.slice(0, limit);
        
        // Convert to RecommendationProduct format
        return limited.map(p => this.productToRecommendation(p));
      }),
      tap(products => {
        console.log(`[RecommendationService] Found ${products.length} similar products`);
      }),
      catchError(error => {
        console.error('[RecommendationService] Error getting similar products:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recommended products for a user
   * @param userId User ID
   * @param limit Maximum number of recommendations
   * @returns Observable of recommended products
   */
  getRecommendationsForUser(userId: string, limit: number = 8): Observable<RecommendationProduct[]> {
    console.log(`[RecommendationService] Getting recommendations for user: ${userId}`);
    
    // For now, return random products as recommendations
    return this.productService.getAllProducts().pipe(
      map(products => {
        const shuffled = this.shuffleArray([...products]);
        return shuffled.slice(0, limit).map(p => this.productToRecommendation(p));
      }),
      catchError(error => {
        console.error('[RecommendationService] Error getting user recommendations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get trending products
   * @param limit Maximum number of products
   * @returns Observable of trending products
   */
  getTrendingProducts(limit: number = 6): Observable<RecommendationProduct[]> {
    console.log('[RecommendationService] Getting trending products');
    
    return this.productService.getAllProducts().pipe(
      map(products => {
        // Return first N products as "trending" (in real app, this would be based on views/purchases)
        return products.slice(0, limit).map(p => this.productToRecommendation(p));
      }),
      catchError(error => {
        console.error('[RecommendationService] Error getting trending products:', error);
        return of([]);
      })
    );
  }

  /**
   * Convert Product to RecommendationProduct
   */
  private productToRecommendation(product: Product): RecommendationProduct {
    return {
      idProduct: product.idProduct || 0,
      name: product.name,
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      stock: product.stock,
      score: Math.random() * 100 // Mock relevance score
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
