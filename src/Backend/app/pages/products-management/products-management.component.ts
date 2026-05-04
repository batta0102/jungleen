import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './products-management.component.html',
  styleUrl: './products-management.component.scss'
})
export class ProductsManagementComponent implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showForm = signal(false);
  isEditMode = signal(false);

  currentProduct = signal<Product>({
    name: '',
    category: 'Book',
    description: '',
    image: '',
    price: 0,
    stock: 0
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService.getAllProducts().subscribe({
      next: (data: Product[]) => {
        const transformedData = data.map((product) => {
          const anyProduct = product as unknown as Record<string, unknown>;

          if (anyProduct['id'] && !product.idProduct) {
            return { ...product, idProduct: anyProduct['id'] as number };
          }

          if (anyProduct['product_id'] && !product.idProduct) {
            return { ...product, idProduct: anyProduct['product_id'] as number };
          }

          return product;
        });

        this.products.set(transformedData);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load products. Check if API Gateway is running on port 8085.');
        this.loading.set(false);
        console.error('[ProductsManagement] Error loading products:', err);
      }
    });
  }

  openAddForm(): void {
    this.isEditMode.set(false);
    this.currentProduct.set({
      name: '',
      category: 'Book',
      description: '',
      image: '',
      price: 0,
      stock: 0
    });
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.isEditMode.set(true);
    this.currentProduct.set({ ...product });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.currentProduct.set({
      name: '',
      category: 'Book',
      description: '',
      image: '',
      price: 0,
      stock: 0
    });
  }

  saveProduct(): void {
    const product = this.currentProduct();

    if (!product.name.trim() || !product.category || !product.description.trim()) {
      this.error.set('Please fill in all required fields (Name, Category, Description).');
      return;
    }

    if (product.stock === undefined || product.stock === null) {
      this.error.set('Please provide a stock value.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (this.isEditMode() && product.idProduct) {
      this.productService.updateProduct(product.idProduct, product).subscribe({
        next: () => {
          this.loadProducts();
          this.closeForm();
        },
        error: (err) => {
          this.error.set(`Failed to update product: ${err.message ?? err}`);
          this.loading.set(false);
          console.error('[ProductsManagement] Error updating product:', err);
        }
      });
      return;
    }

    const newProduct: Product = { ...product };
    delete (newProduct as Partial<Product>).idProduct;

    this.productService.addProduct(newProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.closeForm();
      },
      error: (err) => {
        this.error.set(`Failed to add product: ${err.message ?? err}`);
        this.loading.set(false);
        console.error('[ProductsManagement] Error adding product:', err);
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!product.idProduct) {
      return;
    }

    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.productService.deleteProduct(product.idProduct).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(`Failed to delete product: ${err.message ?? err}`);
        this.loading.set(false);
        console.error('[ProductsManagement] Error deleting product:', err);
      }
    });
  }

  updateField(field: keyof Product, value: Product[keyof Product]): void {
    this.currentProduct.update((product) => ({ ...product, [field]: value }));
  }

  trackByIdProduct(index: number, product: Product): number {
    return product.idProduct ?? index;
  }

  checkProductOrders(product: Product): void {
    if (!product.idProduct) {
      console.error('Product ID is missing');
      return;
    }

    console.log(`[ProductsManagement] Navigating to orders for product: ${product.name} (ID: ${product.idProduct})`);
    // Navigate to orders page with product ID as query parameter
    this.router.navigate(['/orders-management'], {
      queryParams: { productId: product.idProduct }
    });
  }
}