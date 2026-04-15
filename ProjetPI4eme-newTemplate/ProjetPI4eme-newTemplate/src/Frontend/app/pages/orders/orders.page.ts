import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../shared/order/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss'
})
export class OrdersPage implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
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
    this.loadOrders();
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
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load orders. Check if API Gateway is running on port 8085.');
        this.loading.set(false);
        console.error('[OrdersPage] Error loading orders:', err);
      }
    });
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
        error: (err) => {
          this.error.set(`Failed to update order: ${err.message ?? err}`);
          this.loading.set(false);
          console.error('[OrdersPage] Error updating order:', err);
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
      error: (err) => {
        this.error.set(`Failed to add order: ${err.message ?? err}`);
        this.loading.set(false);
        console.error('[OrdersPage] Error adding order:', err);
      }
    });
  }

  /**
   * Delete an order
   */
  deleteOrder(order: Order): void {
    if (!order.idOrder) {
      return;
    }

    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orderService.deleteOrder(order.idOrder).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (err) => {
        this.error.set(`Failed to delete order: ${err.message ?? err}`);
        this.loading.set(false);
        console.error('[OrdersPage] Error deleting order:', err);
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
   * Update product ID in the current order
   */
  updateProductId(productId: number): void {
    this.currentOrder.update((order) => ({
      ...order,
      product: { ...order.product, idProduct: productId }
    }));
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByIdOrder(index: number, order: Order): number {
    return order.idOrder ?? index;
  }
}
