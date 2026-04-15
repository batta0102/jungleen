import { NgOptimizedImage, CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Product, ProductService } from '../../shared/product/product';
import { TakeOrderDialogComponent, ProductForOrder } from '../../shared/take-order-dialog/take-order-dialog.component';

type SortMode = 'Most Popular' | 'Newest' | 'Price: Low to High' | 'Price: High to Low' | 'Top Rated';

interface ProductDisplay {
  id: string;
  productId: number;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  rating: number;
  reviews: number;
}

@Component({
  selector: 'app-products-page',
  imports: [FormsModule, NgOptimizedImage, RouterModule, CommonModule, CurrencyPipe, TakeOrderDialogComponent],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPage {
  private readonly productService = inject(ProductService);
  readonly products = signal<ProductDisplay[]>([]);

  // Take Order Dialog State
  readonly selectedProduct = signal<ProductForOrder | null>(null);
  readonly isOrderDialogOpen = signal(false);
  readonly orderSuccessMessage = signal('');

  readonly query = signal('');
  readonly sortMode = signal<SortMode>('Most Popular');
  readonly page = signal(1);
  readonly pageSize = 6;

  readonly filteredProducts = computed(() => {
    const q = this.query().trim().toLowerCase();

    const items = this.products().filter((p) => {
      if (q && !`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const sorted = [...items].sort((a, b) => {
      const mode = this.sortMode();
      if (mode === 'Price: Low to High') return a.price - b.price;
      if (mode === 'Price: High to Low') return b.price - a.price;
      if (mode === 'Top Rated') return b.rating - a.rating;
      if (mode === 'Newest') return b.productId - a.productId;
      return b.reviews - a.reviews;
    });

    return sorted;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));

  readonly pagedProducts = computed(() => {
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  readonly sorts: SortMode[] = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

  constructor() {
    this.productService
      .getAllProducts()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (items) => this.products.set(items.map((item) => this.mapProduct(item))),
        error: (err) => {
          console.error('[ProductsPage] Error loading products:', err);
          this.products.set([]);
        }
      });
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  trackProductId = (_: number, p: ProductDisplay): string => p.id;

  starsLabel(rating: number): string {
    const rounded = Math.round(rating * 10) / 10;
    return `${rounded} out of 5`;
  }

  primaryActionLabel(p: ProductDisplay): string {
    if (p.stock === 0) return 'Out of Stock';
    return 'Add to Cart';
  }

  secondaryActionLabel(): string {
    return 'View Details';
  }

  openTakeOrderDialog(prod: ProductDisplay): void {
    this.selectedProduct.set({
      productId: prod.productId,
      name: prod.name,
      price: prod.price
    });
    this.isOrderDialogOpen.set(true);
  }

  closeTakeOrderDialog(): void {
    this.isOrderDialogOpen.set(false);
    this.selectedProduct.set(null);
    this.orderSuccessMessage.set('');
  }

  onOrderCreated(): void {
    console.log('[ProductsPage] Order created successfully');
    this.orderSuccessMessage.set('Order created successfully!');
    this.closeTakeOrderDialog();

    // Clear success message after 3 seconds
    setTimeout(() => {
      this.orderSuccessMessage.set('');
    }, 3000);
  }

  private mapProduct(item: Product): ProductDisplay {
    return {
      id: `prod-${item.idProduct}`,
      productId: item.idProduct || 0,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price || 0,
      stock: item.stock || 0,
      imageUrl: item.imageUrl || '/englishimg2.png',
      rating: 4.5,
      reviews: 0
    };
  }
}
