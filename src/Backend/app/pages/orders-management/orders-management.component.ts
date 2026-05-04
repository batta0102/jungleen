import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './orders-management.component.html',
  styleUrl: './orders-management.component.scss'
})
export class OrdersManagementComponent implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  orders = signal<Order[]>([]);
  filteredOrders = signal<Order[]>([]);
  filterProductId = signal<number | null>(null);
  productList = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  showForm = signal(false);
  isEditMode = signal(false);

  currentOrder = signal<Order>({
    product: { idProduct: 0 },
    totalAmount: 0,
    status: 'Pending',
    paymentMethod: 'Credit Card'
  });

  ngOnInit(): void {
    // Load products first, then orders
    this.loadProducts();
    
    // Check for productId in query parameters
    this.route.queryParams.subscribe((params) => {
      const productId = params['productId'];
      if (productId) {
        const id = parseInt(productId, 10);
        this.filterProductId.set(id);
        console.log(`[OrdersManagement] Filtering orders for product ID: ${id}`);
      }
    });
    
    this.loadOrders();
  }

  /**
   * Load all available products from API Gateway
   */
  loadProducts(): void {
    console.log('[OrdersManagement] Loading available products...');
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.productList.set(products);
        console.log(`[OrdersManagement] ✅ Loaded ${products.length} available products`);
      },
      error: (err: any) => {
        console.error('[OrdersManagement] ⚠️ Failed to load products:', err);
        // Don't fail the whole page if products fail to load
        this.productList.set([]);
      }
    });
  }

  /**
   * Load all orders from API Gateway
   */
  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderService.getAllOrders().subscribe({
      next: (data: Order[]) => {
        this.orders.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err.status === 0 
          ? 'Failed to load orders. Check if API Gateway is running on http://localhost:8085 or if proxy is enabled (npm start).'
          : `Failed to load orders: HTTP ${err.status} ${err.statusText}`;
        this.error.set(errorMsg);
        this.loading.set(false);
        console.error('[OrdersManagement] Error loading orders:', err);
      }
    });
  }

  /**
   * Apply product ID filter to orders
   */
  applyFilter(): void {
    const productId = this.filterProductId();
    
    if (productId === null) {
      this.filteredOrders.set(this.orders());
    } else {
      const filtered = this.orders().filter(
        (order) => order.product?.idProduct === productId
      );
      this.filteredOrders.set(filtered);
      console.log(`[OrdersManagement] Filtered ${filtered.length} orders for product ID ${productId}`);
    }
  }

  /**
   * Clear the product filter and show all orders
   */
  clearFilter(): void {
    this.filterProductId.set(null);
    this.applyFilter();
    console.log('[OrdersManagement] Filter cleared - showing all orders');
  }

  /**
   * Open form for adding a new order
   */
  openAddForm(): void {
    this.isEditMode.set(false);
    this.currentOrder.set({
      product: { idProduct: 0 },
      totalAmount: 0,
      status: 'Pending',
      paymentMethod: 'Credit Card'
    });
    this.showForm.set(true);
  }

  /**
   * Open form for editing an existing order
   */
  openEditForm(order: Order): void {
    this.isEditMode.set(true);
    this.currentOrder.set({ ...order });
    this.showForm.set(true);
  }

  /**
   * Close the form modal
   */
  closeForm(): void {
    this.showForm.set(false);
    this.currentOrder.set({
      product: { idProduct: 0 },
      totalAmount: 0,
      status: 'Pending',
      paymentMethod: 'Credit Card'
    });
  }

  /**
   * Save the current order (add or update)
   */
  saveOrder(): void {
    const order = this.currentOrder();

    if (!order.product?.idProduct || order.product.idProduct === 0) {
      this.error.set('Please select a product.');
      return;
    }

    if (!order.totalAmount || order.totalAmount === 0) {
      this.error.set('Please provide a total amount.');
      return;
    }

    if (!order.status || order.status.trim() === '') {
      this.error.set('Please provide a status.');
      return;
    }

    if (!order.paymentMethod || order.paymentMethod.trim() === '') {
      this.error.set('Please provide a payment method.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (this.isEditMode() && order.idOrder) {
      this.orderService.updateOrder(order.idOrder, order).subscribe({
        next: () => {
          this.loadOrders();
          this.closeForm();
        },
        error: (err: any) => {
          this.error.set(`Failed to update order: ${err.message ?? err}`);
          this.loading.set(false);
          console.error('[OrdersManagement] Error updating order:', err);
        }
      });
      return;
    }

    const newOrder: Order = { ...order };
    delete (newOrder as Partial<Order>).idOrder;

    this.orderService.addOrder(newOrder).subscribe({
      next: () => {
        this.loadOrders();
        this.closeForm();
      },
      error: (err: any) => {
        this.error.set(`Failed to add order: ${err.message ?? err}`);
        this.loading.set(false);
        console.error('[OrdersManagement] Error adding order:', err);
      }
    });
  }

  /**
   * Delete an order
   */
  deleteOrder(order: Order): void {
    if (!order.idOrder) {
      console.error('[OrdersManagement] No order ID provided');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete Order #${order.idOrder}? This action cannot be undone.`);
    if (!confirmed) {
      console.log('[OrdersManagement] Delete cancelled by user');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    console.log(`[OrdersManagement] Initiating delete for order ${order.idOrder}`);
    
    this.orderService.deleteOrder(order.idOrder).subscribe({
      next: (response: any) => {
        console.log('[OrdersManagement] Order deleted successfully:', response);
        alert(`Order #${order.idOrder} has been deleted successfully!`);
        this.loadOrders();
      },
      error: (err: any) => {
        console.error('[OrdersManagement] Error deleting order:', err);
        console.error('[OrdersManagement] Error status:', err.status);
        console.error('[OrdersManagement] Error response:', err.error);
        this.error.set(`Failed to delete order #${order.idOrder}: ${err.message ?? 'Unknown error'}`);
        this.loading.set(false);
      },
      complete: () => {
        console.log('[OrdersManagement] Delete request completed');
      }
    });
  }

  /**
   * Update a field in the current order
   */
  updateField(field: keyof Order, value: Order[keyof Order]): void {
    this.currentOrder.update((order) => ({ ...order, [field]: value }));
  }

  /**
   * Update product ID and load product details (name, price)
   */
  updateProductId(productId: number): void {
    const selectedProduct = this.getProductById(productId);
    
    if (!selectedProduct) {
      console.warn(`[OrdersManagement] Product ID ${productId} not found`);
      this.currentOrder.update((order) => ({
        ...order,
        product: { idProduct: productId }
      }));
      return;
    }

    console.log(`[OrdersManagement] Selected product:`, selectedProduct);
    
    // Update order with product details and auto-fill total amount if creating new order
    this.currentOrder.update((order) => {
      const updatedOrder = {
        ...order,
        product: {
          idProduct: selectedProduct.idProduct,
          name: selectedProduct.name,
          price: selectedProduct.price
        }
      };
      
      // Auto-fill total amount with product price on new order
      if (!this.isEditMode() && selectedProduct.price && order.totalAmount === 0) {
        updatedOrder.totalAmount = selectedProduct.price;
      }
      
      return updatedOrder;
    });
  }

  /**
   * Get product by ID from the product list
   */
  getProductById(productId: number): Product | undefined {
    return this.productList().find((p) => p.idProduct === productId);
  }

  /**
   * Get product name by ID (for display in table)
   */
  getProductName(productId?: number): string {
    if (!productId) return 'N/A';
    const product = this.getProductById(productId);
    return product?.name || `Product #${productId}`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByIdOrder(index: number, order: Order): number {
    return order.idOrder ?? index;
  }
}
