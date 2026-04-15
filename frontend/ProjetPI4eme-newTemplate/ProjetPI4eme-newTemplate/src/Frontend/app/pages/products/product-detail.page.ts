import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, Product } from '../../shared/product/product';
import { RecommendationService } from '../../core/recommendations/recommendation.service';
import { RecommendationProduct } from '../../core/recommendations/recommendation.model';

/**
 * Product Detail Page Component
 * Displays detailed information about a single product
 * Shows similar product recommendations
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss']
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private recommendationService = inject(RecommendationService);

  // State signals
  product = signal<Product | null>(null);
  similarProducts = signal<RecommendationProduct[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  quantity = signal(1);

  ngOnInit(): void {
    // Get product ID from route parameters
    this.route.paramMap.subscribe(params => {
      const productId = params.get('productId');
      if (productId) {
        this.loadProduct(Number(productId));
      } else {
        this.error.set('Product ID not provided');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load product details and recommendations
   */
  private loadProduct(productId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);
        
        // Load similar products based on category
        if (product.category) {
          this.loadSimilarProducts(product.category, product.idProduct);
        }
      },
      error: (err) => {
        console.error('[ProductDetailPage] Error loading product:', err);
        this.error.set('Failed to load product details. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load similar products for recommendations
   */
  private loadSimilarProducts(category: string, excludeId?: number): void {
    this.recommendationService.getSimilarProducts(category, excludeId, 4).subscribe({
      next: (products) => {
        this.similarProducts.set(products);
      },
      error: (err) => {
        console.error('[ProductDetailPage] Error loading similar products:', err);
        // Don't show error for recommendations - just show empty
      }
    });
  }

  /**
   * Get product image URL with fallback
   */
  getImageUrl(imageUrl?: string): string {
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return imageUrl || 'assets/images/product-placeholder.png';
  }

  /**
   * Increase quantity (max: stock)
   */
  incrementQuantity(): void {
    const current = this.quantity();
    const stock = this.product()?.stock || 0;
    if (current < stock) {
      this.quantity.set(current + 1);
    }
  }

  /**
   * Decrease quantity (min: 1)
   */
  decrementQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  /**
   * Add product to cart
   */
  addToCart(): void {
    const product = this.product();
    if (product) {
      console.log(`[ProductDetailPage] Adding ${this.quantity()} x ${product.name} to cart`);
      // TODO: Implement cart service integration
      alert(`Added ${this.quantity()} x ${product.name} to cart!`);
    }
  }

  /**
   * Navigate to a similar product
   */
  viewSimilarProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * Go back to products list
   */
  goBack(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Check if product is in stock
   */
  isInStock(): boolean {
    const product = this.product();
    return product ? product.stock > 0 : false;
  }

  /**
   * Get stock status text
   */
  getStockStatus(): string {
    const product = this.product();
    if (!product) return '';
    
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= 5) return `Only ${product.stock} left!`;
    return 'In Stock';
  }

  /**
   * Get stock status color class
   */
  getStockClass(): string {
    const product = this.product();
    if (!product) return '';
    
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= 5) return 'low-stock';
    return 'in-stock';
  }
}
