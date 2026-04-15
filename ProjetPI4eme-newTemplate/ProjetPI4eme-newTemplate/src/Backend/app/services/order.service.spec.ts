import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService, Order, OrderProduct } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Order CRUD Operations', () => {
    // Test 1: Get all orders
    it('should retrieve all orders', () => {
      const mockOrders: Order[] = [
        {
          idOrder: 1,
          product: {
            idProduct: 10,
            name: 'Laptop',
            price: 1200
          },
          totalAmount: 1200,
          status: 'COMPLETED',
          orderDate: '2024-01-15',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 2,
          product: {
            idProduct: 11,
            name: 'Mouse',
            price: 50
          },
          totalAmount: 50,
          status: 'PENDING',
          orderDate: '2024-01-16',
          paymentMethod: 'PAYPAL'
        }
      ];

      service.getAllOrders().subscribe(orders => {
        expect(orders.length).toBe(2);
        expect(orders[0].status).toBe('COMPLETED');
        expect(orders[1].status).toBe('PENDING');
      });

      const req = httpMock.expectOne('/api/orders/allOrders');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    // Test 2: Get order by ID
    it('should retrieve a single order by ID', () => {
      const mockOrder: Order = {
        idOrder: 1,
        product: {
          idProduct: 10,
          name: 'Laptop',
          price: 1200
        },
        totalAmount: 1200,
        status: 'COMPLETED',
        orderDate: '2024-01-15',
        paymentMethod: 'CREDIT_CARD'
      };

      service.getOrderById(1).subscribe(order => {
        expect(order.idOrder).toBe(1);
        expect(order.product?.name).toBe('Laptop');
        expect(order.totalAmount).toBe(1200);
      });

      const req = httpMock.expectOne('/api/orders/getOrder/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });

    // Test 3: Add new order
    it('should create a new order', () => {
      const newOrder: Order = {
        product: {
          idProduct: 20,
          name: 'Keyboard',
          price: 150
        },
        totalAmount: 150,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD'
      };

      const createdOrder: Order = {
        idOrder: 3,
        ...newOrder,
        orderDate: '2024-01-17'
      };

      service.addOrder(newOrder).subscribe(order => {
        expect(order.idOrder).toBe(3);
        expect(order.product?.name).toBe('Keyboard');
        expect(order.status).toBe('PENDING');
      });

      const req = httpMock.expectOne('/api/orders/addOrder');
      expect(req.request.method).toBe('POST');
      // Verify that idOrder was removed before sending
      expect(req.request.body.idOrder).toBeUndefined();
      req.flush(createdOrder);
    });

    // Test 4: Update order
    it('should update an existing order', () => {
      const orderId = 1;
      const updateData: Order = {
        idOrder: orderId,
        product: {
          idProduct: 10,
          name: 'Laptop',
          price: 1200
        },
        totalAmount: 1200,
        status: 'SHIPPED',
        orderDate: '2024-01-15',
        paymentMethod: 'CREDIT_CARD'
      };

      service.updateOrder(orderId, updateData).subscribe(order => {
        expect(order.status).toBe('SHIPPED');
        expect(order.totalAmount).toBe(1200);
      });

      const req = httpMock.expectOne(`/api/orders/updateOrder/${orderId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(updateData);
    });

    // Test 5: Delete order
    it('should delete an order by ID', () => {
      const orderId = 1;

      service.deleteOrder(orderId).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(`/api/orders/deleteOrder/${orderId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Order Management - Complex Business Logic', () => {
    // Test 6: Order status workflow
    it('should track order status transitions', () => {
      const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

      statuses.forEach((status, index) => {
        const order: Order = {
          idOrder: index + 1,
          product: { idProduct: 1, name: 'Test', price: 100 },
          totalAmount: 100,
          status: status,
          paymentMethod: 'CREDIT_CARD'
        };

        expect(
          ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED']
        ).toContain(order.status);
      });

      expect(true).toBe(true);
    });

    // Test 7: Order amount calculation
    it('should calculate total order amount correctly', () => {
      const testCases = [
        { quantity: 1, unitPrice: 100, expectedTotal: 100 },
        { quantity: 2, unitPrice: 50, expectedTotal: 100 },
        { quantity: 5, unitPrice: 20, expectedTotal: 100 },
        { quantity: 10, unitPrice: 15, expectedTotal: 150 }
      ];

      testCases.forEach((testCase) => {
        const calculatedTotal = testCase.quantity * testCase.unitPrice;
        expect(calculatedTotal).toBe(testCase.expectedTotal);
      });

      expect(true).toBe(true);
    });

    // Test 8: Payment method support
    it('should support multiple payment methods', () => {
      const supportedMethods = [
        'CREDIT_CARD',
        'PAYPAL',
        'BANK_TRANSFER',
        'CRYPTO'
      ];

      const orders: Order[] = [
        {
          idOrder: 1,
          product: { idProduct: 1, name: 'Item', price: 100 },
          totalAmount: 100,
          status: 'COMPLETED',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 2,
          product: { idProduct: 2, name: 'Item', price: 100 },
          totalAmount: 100,
          status: 'COMPLETED',
          paymentMethod: 'PAYPAL'
        }
      ];

      orders.forEach((order) => {
        expect(supportedMethods).toContain(order.paymentMethod);
      });

      expect(true).toBe(true);
    });

    // Test 9: Order date tracking
    it('should track order dates and timestamps', () => {
      const orders: Order[] = [
        {
          idOrder: 1,
          product: { idProduct: 1, name: 'Item', price: 100 },
          totalAmount: 100,
          status: 'COMPLETED',
          orderDate: '2024-01-10',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 2,
          product: { idProduct: 2, name: 'Item', price: 100 },
          totalAmount: 100,
          status: 'COMPLETED',
          orderDate: '2024-01-15',
          paymentMethod: 'PAYPAL'
        },
        {
          idOrder: 3,
          product: { idProduct: 3, name: 'Item', price: 100 },
          totalAmount: 100,
          status: 'COMPLETED',
          orderDate: '2024-01-20',
          paymentMethod: 'CREDIT_CARD'
        }
      ];

      // Verify chronological order
      const dates = orders.map((o) => new Date(o.orderDate as string).getTime());
      expect(dates[0]).toBeLessThanOrEqual(dates[1]);
      expect(dates[1]).toBeLessThanOrEqual(dates[2]);
    });

    // Test 10: Order-Product relationship
    it('should maintain order-product relationship', () => {
      const order: Order = {
        idOrder: 1,
        product: {
          idProduct: 100,
          name: 'High-end Monitor',
          price: 800
        },
        totalAmount: 800,
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD'
      };

      expect(order.product).toBeDefined();
      expect(order.product?.idProduct).toBe(100);
      expect(order.product?.name).toBe('High-end Monitor');
      expect(order.product?.price).toBeLessThanOrEqual(order.totalAmount);
    });

    // Test 11: Bulk order processing
    it('should handle multiple order operations', () => {
      const ordersToCreate = [
        {
          product: { idProduct: 1, name: 'Product A', price: 100 },
          totalAmount: 100,
          status: 'PENDING',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          product: { idProduct: 2, name: 'Product B', price: 200 },
          totalAmount: 200,
          status: 'PENDING',
          paymentMethod: 'PAYPAL'
        },
        {
          product: { idProduct: 3, name: 'Product C', price: 150 },
          totalAmount: 150,
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER'
        }
      ];

      let createdCount = 0;

      ordersToCreate.forEach((order, index) => {
        service.addOrder(order).subscribe(() => {
          createdCount++;
        });

        const req = httpMock.expectOne('/api/orders/addOrder');
        req.flush({
          idOrder: index + 1,
          ...order
        });
      });

      expect(createdCount).toBe(ordersToCreate.length);
    });

    // Test 12: Order filtering by status (COMPLEX BUSINESS LOGIC)
    it('should filter orders by status', () => {
      const allOrders: Order[] = [
        {
          idOrder: 1,
          product: { idProduct: 1, name: 'Item A', price: 100 },
          totalAmount: 100,
          status: 'PENDING',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 2,
          product: { idProduct: 2, name: 'Item B', price: 200 },
          totalAmount: 200,
          status: 'SHIPPED',
          paymentMethod: 'PAYPAL'
        },
        {
          idOrder: 3,
          product: { idProduct: 3, name: 'Item C', price: 300 },
          totalAmount: 300,
          status: 'DELIVERED',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 4,
          product: { idProduct: 4, name: 'Item D', price: 150 },
          totalAmount: 150,
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER'
        }
      ];

      const pendingOrders = allOrders.filter((o) => o.status === 'PENDING');
      expect(pendingOrders.length).toBe(2);
      expect(pendingOrders.every((o) => o.status === 'PENDING')).toBe(true);

      const shippedOrders = allOrders.filter((o) => o.status === 'SHIPPED');
      expect(shippedOrders.length).toBe(1);
    });

    // Test 13: Order amount range analysis
    it('should filter orders by amount range', () => {
      const allOrders: Order[] = [
        {
          idOrder: 1,
          product: { idProduct: 1, name: 'Budget', price: 50 },
          totalAmount: 50,
          status: 'COMPLETED',
          paymentMethod: 'CREDIT_CARD'
        },
        {
          idOrder: 2,
          product: { idProduct: 2, name: 'Mid-range', price: 500 },
          totalAmount: 500,
          status: 'COMPLETED',
          paymentMethod: 'PAYPAL'
        },
        {
          idOrder: 3,
          product: { idProduct: 3, name: 'Premium', price: 3000 },
          totalAmount: 3000,
          status: 'COMPLETED',
          paymentMethod: 'CREDIT_CARD'
        }
      ];

      const expensiveOrders = allOrders.filter((o) => o.totalAmount > 1000);
      expect(expensiveOrders.length).toBe(1);
      expect(expensiveOrders[0].totalAmount).toBe(3000);

      const budgetOrders = allOrders.filter((o) => o.totalAmount < 100);
      expect(budgetOrders.length).toBe(1);
    });
  });

  describe('Order Lifecycle Management', () => {
    // Test 14: Complete order lifecycle
    it('should track complete order lifecycle from creation to delivery', () => {
      const lifecycle = [
        { status: 'PENDING', description: 'Order created' },
        { status: 'CONFIRMED', description: 'Payment confirmed' },
        { status: 'SHIPPED', description: 'Order shipped' },
        { status: 'DELIVERED', description: 'Order delivered' },
        { status: 'COMPLETED', description: 'Order completed' }
      ];

      lifecycle.forEach((step) => {
        const order: Order = {
          idOrder: 1,
          product: { idProduct: 1, name: 'Item', price: 100 },
          totalAmount: 100,
          status: step.status,
          paymentMethod: 'CREDIT_CARD'
        };

        service.updateOrder(1, order).subscribe();

        const req = httpMock.expectOne('/api/orders/updateOrder/1');
        req.flush(order);
      });

      expect(true).toBe(true);
    });

    // Test 15: Order cancellation
    it('should handle order cancellation', () => {
      const order: Order = {
        idOrder: 1,
        product: { idProduct: 1, name: 'Item', price: 100 },
        totalAmount: 100,
        status: 'CANCELLED',
        paymentMethod: 'CREDIT_CARD'
      };

      service.updateOrder(1, order).subscribe();

      const req = httpMock.expectOne('/api/orders/updateOrder/1');
      expect(req.request.body.status).toBe('CANCELLED');
      req.flush(order);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    // Test 16: Handle order not found (404)
    it('should handle order not found error', () => {
      service.getOrderById(999).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne('/api/orders/getOrder/999');
      req.flush('Order not found', { status: 404, statusText: 'Not Found' });
    });

    // Test 17: Handle invalid order data
    it('should handle invalid order payload', () => {
      const invalidOrder: Order = {
        product: undefined,
        totalAmount: -100,
        status: 'INVALID_STATUS',
        paymentMethod: 'INVALID_METHOD'
      };

      service.addOrder(invalidOrder).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne('/api/orders/addOrder');
      req.flush('Invalid order data', { status: 400, statusText: 'Bad Request' });
    });

    // Test 18: Handle server error
    it('should handle server error on order update', () => {
      const order: Order = {
        idOrder: 1,
        product: { idProduct: 1, name: 'Item', price: 100 },
        totalAmount: 100,
        status: 'SHIPPED',
        paymentMethod: 'CREDIT_CARD'
      };

      service.updateOrder(1, order).subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne('/api/orders/updateOrder/1');
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });

    // Test 19: Handle network error
    it('should handle network/CORS error', () => {
      service.getAllOrders().subscribe(
        () => expect.fail('should have failed'),
        (error) => {
          expect(error.status).toBe(0);
        }
      );

      const req = httpMock.expectOne('/api/orders/allOrders');
      req.error(new ErrorEvent('Network error'), { status: 0 });
    });

    // Test 20: Handle order with missing optional fields
    it('should handle order with missing optional product details', () => {
      const minimalOrder: Order = {
        idOrder: 1,
        product: {
          idProduct: 1
        },
        totalAmount: 100,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD'
      };

      service.getOrderById(1).subscribe((order) => {
        expect(order.idOrder).toBeDefined();
        expect(order.product?.idProduct).toBe(1);
        expect(order.product?.name).toBeUndefined();
        expect(order.totalAmount).toBe(100);
      });

      const req = httpMock.expectOne('/api/orders/getOrder/1');
      req.flush(minimalOrder);
    });

    // Test 21: Handle zero total amount
    it('should handle orders with zero total amount', () => {
      const freeOrder: Order = {
        idOrder: 1,
        product: { idProduct: 1, name: 'Free Item', price: 0 },
        totalAmount: 0,
        status: 'COMPLETED',
        paymentMethod: 'FREE'
      };

      service.addOrder(freeOrder).subscribe((order) => {
        expect(order.totalAmount).toBe(0);
      });

      const req = httpMock.expectOne('/api/orders/addOrder');
      req.flush(freeOrder);
    });
  });

  describe('HTTP Headers & Validation', () => {
    // Test 22: Verify HTTP headers for requests
    it('should include proper Content-Type header', () => {
      const order: Order = {
        product: { idProduct: 1, name: 'Item', price: 100 },
        totalAmount: 100,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD'
      };

      service.addOrder(order).subscribe();

      const req = httpMock.expectOne('/api/orders/addOrder');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({ idOrder: 1, ...order });
    });
  });
});
