import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Product Reference Interface
 * Represents a product reference in Order
 */
export interface OrderProduct {
  idProduct?: number;
  name?: string;
  price?: number;
}

/**
 * Order Interface
 * Represents an order from the API Gateway
 * Maps to backend Spring Boot Order entity with attributes:
 * - idOrder: Long
 * - totalAmount: Double
 * - status: String
 * - orderDate: LocalDateTime
 * - paymentMethod: String
 * - product: Product (contains idProduct)
 */
export interface Order {
  idOrder?: number;
  product?: OrderProduct;
  totalAmount: number;
  status: string;
  orderDate?: string | Date;
  paymentMethod: string;
}

/**
 * Order Service
 * Handles all order-related API calls to API Gateway
 * Uses proxy /api -> http://localhost:8085
 * Base URL: /api/orders
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = '/api/orders';

  /**
   * HTTP Headers for JSON requests
   */
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  /**
   * Get all orders
   * @returns Observable<Order[]>
   */
  getAllOrders(): Observable<Order[]> {
    console.log('[OrderService] GET /api/orders/allOrders');
    return this.http.get<Order[]>(`${this.baseUrl}/allOrders`).pipe(
      tap(orders => {
        console.log(`[OrderService] ✅ Loaded ${orders.length} orders`);
      }),
      catchError(error => {
        console.error('[OrderService] ❌ Error loading orders:', error);
        this.logErrorDetails('getAllOrders', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single order by ID
   * @param id - Order ID
   * @returns Observable<Order>
   */
  getOrderById(id: number): Observable<Order> {
    console.log(`[OrderService] GET /api/orders/getOrder/${id}`);
    return this.http.get<Order>(`${this.baseUrl}/getOrder/${id}`).pipe(
      tap(order => console.log('[OrderService] ✅ Loaded order:', order)),
      catchError(error => {
        console.error(`[OrderService] ❌ Error loading order ${id}:`, error);
        this.logErrorDetails(`getOrder(${id})`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new order
   * @param order - Order data (idOrder will be removed if present)
   * @returns Observable<Order>
   */
  addOrder(order: Order): Observable<Order> {
    // Remove idOrder for new orders to avoid issues
    const { idOrder, ...orderData } = order;
    
    console.log('[OrderService] POST /api/orders/addOrder', orderData);
    
    return this.http.post<Order>(
      `${this.baseUrl}/addOrder`,
      orderData,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[OrderService] ✅ Order added successfully:', response);
      }),
      catchError(error => {
        console.error('[OrderService] ❌ Error adding order:', error);
        this.logErrorDetails('addOrder', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Error logging helper
   * Provides detailed diagnostic info for CORS, network, and API errors
   */
  private logErrorDetails(method: string, error: any): void {
    console.group(`[OrderService] Error Details for ${method}()`);
    
    if (error.status === 0) {
      console.error('⚠️ CORS/Network Error (Status 0)');
      console.error('Possible causes:');
      console.error('  1. API Gateway not running on http://localhost:8085');
      console.error('  2. CORS preflight (OPTIONS) request failed');
      console.error('  3. Incorrect endpoint path (/api/orders/...)');
      console.error('  4. Network connectivity issue');
      console.error('  5. Proxy not enabled - use: npm start (not ng serve directly)');
    } else if (error.status === 404) {
      console.error('404 Not Found - Check endpoint path');
      console.error('URL attempted:', error.url);
    } else if (error.status === 400) {
      console.error('400 Bad Request - Check payload format');
      console.error('Response:', error.error);
    } else if (error.status === 415) {
      console.error('415 Unsupported Media Type - Check Content-Type');
      console.error('Ensure Content-Type is application/json');
    } else if (error.status === 500) {
      console.error('500 Server Error - Backend issue');
      console.error('Response:', error.error);
    } else {
      console.error(`HTTP ${error.status} Error`);
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      console.error('Response:', error.error);
    }
    
    console.groupEnd();
  }

  /**
   * Update an existing order
   * @param id - Order ID
   * @param order - Updated order data
   * @returns Observable<Order>
   */
  updateOrder(id: number, order: Order): Observable<Order> {
    console.log(`[OrderService] PUT /api/orders/updateOrder/${id}`, order);
    
    return this.http.put<Order>(
      `${this.baseUrl}/updateOrder/${id}`,
      order,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[OrderService] ✅ Order updated successfully:', response);
      }),
      catchError(error => {
        console.error('[OrderService] ❌ Error updating order:', error);
        this.logErrorDetails(`updateOrder(${id})`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete an order by ID
   * @param id - Order ID
   * @returns Observable<any>
   */
  deleteOrder(id: number): Observable<any> {
    console.log(`[OrderService] DELETE /api/orders/deleteOrder/${id}`);
    
    const deleteOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json, text/plain, */*'
      })
    };
    
    return this.http.delete<any>(`${this.baseUrl}/deleteOrder/${id}`, deleteOptions).pipe(
      tap((response: any) => {
        console.log(`[OrderService] ✅ Order ${id} deleted successfully`);
      }),
      catchError((error: any) => {
        console.error(`[OrderService] ❌ Error deleting order ${id}:`, error);
        this.logErrorDetails(`deleteOrder(${id})`, error);
        return throwError(() => error);
      })
    );
  }
}
