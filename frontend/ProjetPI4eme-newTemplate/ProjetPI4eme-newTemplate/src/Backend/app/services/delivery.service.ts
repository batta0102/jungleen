import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Delivery, CreateDeliveryRequest, UpdateDeliveryRequest, DeliveryStats } from '../models/delivery.model';

/**
 * Delivery Service
 * Handles all delivery-related API calls to the API Gateway
 */
@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8085/deliveries';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  /**
   * Get all deliveries
   */
  getAllDeliveries(): Observable<Delivery[]> {
    console.log('[DeliveryService] Fetching all deliveries...');
    return this.http.get<Delivery[]>(`${this.baseUrl}/all`).pipe(
      tap(deliveries => console.log(`[DeliveryService] Loaded ${deliveries.length} deliveries`)),
      catchError(this.handleError('getAllDeliveries'))
    );
  }

  /**
   * Get a single delivery by ID
   */
  getDeliveryById(id: number): Observable<Delivery> {
    console.log(`[DeliveryService] Fetching delivery with ID: ${id}`);
    return this.http.get<Delivery>(`${this.baseUrl}/${id}`).pipe(
      tap(delivery => console.log('[DeliveryService] Loaded delivery:', delivery)),
      catchError(this.handleError('getDeliveryById'))
    );
  }

  /**
   * Get deliveries by order ID
   */
  getDeliveriesByOrderId(orderId: number): Observable<Delivery[]> {
    console.log(`[DeliveryService] Fetching deliveries for order: ${orderId}`);
    return this.http.get<Delivery[]>(`${this.baseUrl}/order/${orderId}`).pipe(
      tap(deliveries => console.log(`[DeliveryService] Found ${deliveries.length} deliveries for order ${orderId}`)),
      catchError(this.handleError('getDeliveriesByOrderId'))
    );
  }

  /**
   * Get deliveries by status
   */
  getDeliveriesByStatus(status: string): Observable<Delivery[]> {
    console.log(`[DeliveryService] Fetching deliveries with status: ${status}`);
    return this.http.get<Delivery[]>(`${this.baseUrl}/status/${status}`).pipe(
      tap(deliveries => console.log(`[DeliveryService] Found ${deliveries.length} deliveries with status ${status}`)),
      catchError(this.handleError('getDeliveriesByStatus'))
    );
  }

  /**
   * Create a new delivery
   */
  createDelivery(delivery: CreateDeliveryRequest): Observable<Delivery> {
    console.log('[DeliveryService] Creating new delivery:', delivery);
    return this.http.post<Delivery>(
      `${this.baseUrl}/create`,
      delivery,
      this.httpOptions
    ).pipe(
      tap(response => console.log('[DeliveryService] Delivery created:', response)),
      catchError(this.handleError('createDelivery'))
    );
  }

  /**
   * Update an existing delivery
   */
  updateDelivery(id: number, delivery: UpdateDeliveryRequest): Observable<Delivery> {
    console.log(`[DeliveryService] Updating delivery ${id}:`, delivery);
    return this.http.put<Delivery>(
      `${this.baseUrl}/update/${id}`,
      delivery,
      this.httpOptions
    ).pipe(
      tap(response => console.log('[DeliveryService] Delivery updated:', response)),
      catchError(this.handleError('updateDelivery'))
    );
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(id: number, status: string): Observable<Delivery> {
    console.log(`[DeliveryService] Updating delivery ${id} status to: ${status}`);
    return this.http.patch<Delivery>(
      `${this.baseUrl}/${id}/status`,
      { status },
      this.httpOptions
    ).pipe(
      tap(response => console.log('[DeliveryService] Status updated:', response)),
      catchError(this.handleError('updateDeliveryStatus'))
    );
  }

  /**
   * Delete a delivery
   */
  deleteDelivery(id: number): Observable<void> {
    console.log(`[DeliveryService] Deleting delivery: ${id}`);
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`).pipe(
      tap(() => console.log(`[DeliveryService] Delivery ${id} deleted`)),
      catchError(this.handleError('deleteDelivery'))
    );
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): Observable<DeliveryStats> {
    console.log('[DeliveryService] Fetching delivery statistics...');
    return this.http.get<DeliveryStats>(`${this.baseUrl}/stats`).pipe(
      tap(stats => console.log('[DeliveryService] Stats:', stats)),
      catchError(this.handleError('getDeliveryStats'))
    );
  }

  /**
   * Track delivery by tracking number
   */
  trackDelivery(trackingNumber: string): Observable<Delivery> {
    console.log(`[DeliveryService] Tracking delivery: ${trackingNumber}`);
    return this.http.get<Delivery>(`${this.baseUrl}/track/${trackingNumber}`).pipe(
      tap(delivery => console.log('[DeliveryService] Tracking result:', delivery)),
      catchError(this.handleError('trackDelivery'))
    );
  }

  /**
   * Error handler
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`[DeliveryService] ${operation} failed:`, error);
      return throwError(() => error);
    };
  }
}
