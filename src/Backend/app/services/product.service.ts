import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Product Interface
 * Represents a product from the API Gateway
 */
export interface Product {
  idProduct?: number;
  name: string;
  category: string;
  description: string;
  image?: string;
  price?: number;
  stock: number;
}

/**
 * Product Service for Backend Admin
 * Handles all product-related API calls to API Gateway
 * Uses proxy /api -> http://localhost:8085
 * Base URL: /api/products
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';


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
   * GET all products
   */
  getAllProducts(): Observable<Product[]> {
    console.log('[ProductService] GET /api/products/allProducts');
    return this.http.get<Product[]>(`${this.baseUrl}/allProducts`).pipe(
      tap(products => {
        console.log(`[ProductService] ✅ Loaded ${products.length} products`);
      }),
      catchError(error => {
        console.error('[ProductService] ❌ Error loading products:', error);
        this.logErrorDetails(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET single product by ID
   */
  getProductById(id: number): Observable<Product> {
    console.log(`[ProductService] GET /api/products/getProduct/${id}`);
    return this.http.get<Product>(`${this.baseUrl}/getProduct/${id}`).pipe(
      tap(product => console.log('[ProductService] ✅ Loaded product:', product)),
      catchError(error => {
        console.error(`[ProductService] ❌ Error loading product ${id}:`, error);
        this.logErrorDetails(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST - Add new product
   * Note: Remove idProduct if present (new products don't have IDs)
   */
  addProduct(product: Product): Observable<Product> {
    const { idProduct, ...productData } = product;
    
    console.log('[ProductService] POST /api/products/addProduct', productData);
    return this.http.post<Product>(
      `${this.baseUrl}/addProduct`,
      productData,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[ProductService] ✅ Product added:', response);
      }),
      catchError(error => {
        console.error('[ProductService] ❌ Error adding product:', error);
        this.logErrorDetails(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Error logging helper
   * Provides detailed diagnostic info for CORS, network, and API errors
   */
  private logErrorDetails(error: any): void {
    if (error.status === 0) {
      console.error('[ProductService] ⚠️ CORS/Network Error (Status 0)');
      console.error('  Possible causes:');
      console.error('    1. API Gateway not running on http://localhost:8085');
      console.error('    2. CORS preflight (OPTIONS) request failed');
      console.error('    3. Incorrect endpoint path');
      console.error('    4. Network connectivity issue');
      console.error('    5. Proxy not enabled - use: npm start (not ng serve directly)');
    } else if (error.status === 404) {
      console.error('[ProductService] 404 Not Found - Check endpoint path');
      console.error('  URL attempted:', error.url);
    } else if (error.status === 400) {
      console.error('[ProductService] 400 Bad Request - Check payload format');
      console.error('  Response:', error.error);
    } else if (error.status === 415) {
      console.error('[ProductService] 415 Unsupported Media Type - Check Content-Type');
      console.error('  Ensure Content-Type is application/json');
    } else if (error.status === 500) {
      console.error('[ProductService] 500 Server Error');
      console.error('  Response:', error.error);
    } else {
      console.error(`[ProductService] HTTP ${error.status} Error:`, error);
    }
  }

  /**
   * PUT - Update existing product
   */
  updateProduct(id: number, product: Product): Observable<Product> {
    console.log(`[ProductService] PUT /api/products/updateProduct/${id}`, product);
    return this.http.put<Product>(
      `${this.baseUrl}/updateProduct/${id}`,
      product,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[ProductService] ✅ Product updated:', response);
      }),
      catchError(error => {
        console.error(`[ProductService] ❌ Error updating product ${id}:`, error);
        this.logErrorDetails(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * DELETE - Delete product by ID
   */
  deleteProduct(id: number): Observable<void> {
    console.log(`[ProductService] DELETE /api/products/deleteProduct/${id}`);
    return this.http.delete<void>(`${this.baseUrl}/deleteProduct/${id}`).pipe(
      tap(() => {
        console.log(`[ProductService] ✅ Product ${id} deleted`);
      }),
      catchError(error => {
        console.error(`[ProductService] ❌ Error deleting product ${id}:`, error);
        this.logErrorDetails(error);
        return throwError(() => error);
      })
    );
  }
}

