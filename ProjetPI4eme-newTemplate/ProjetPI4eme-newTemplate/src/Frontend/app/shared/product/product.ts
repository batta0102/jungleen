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
  imageUrl?: string;
  price?: number;
  stock: number;
}

/**
 * Product Service
 * Handles all product-related API calls to API Gateway
 * Base URL: http://localhost:8085/products
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8085/products';

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
   * Get all products
   * @returns Observable<Product[]>
   */
  getAllProducts(): Observable<Product[]> {
    console.log('[ProductService] Fetching all products...');
    return this.http.get<Product[]>(`${this.baseUrl}/allProducts`).pipe(
      tap(products => {
        console.log(`[ProductService] Loaded ${products.length} products`);
        console.log('[ProductService] First product:', products[0]);
        console.log('[ProductService] Product keys:', products[0] ? Object.keys(products[0]) : 'No products');
      }),
      catchError(error => {
        console.error('[ProductService] Error loading products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @returns Observable<Product>
   */
  getProductById(id: number): Observable<Product> {
    console.log(`[ProductService] Fetching product with ID: ${id}`);
    return this.http.get<Product>(`${this.baseUrl}/getProduct/${id}`).pipe(
      tap(product => console.log('[ProductService] Loaded product:', product)),
      catchError(error => {
        console.error(`[ProductService] Error loading product ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a new product
   * @param product - Product data (idProduct will be removed if present)
   * @returns Observable<Product>
   */
  addProduct(product: Product): Observable<Product> {
    // Remove idProduct for new products to avoid issues
    const { idProduct, ...productData } = product;
    
    console.log('[ProductService] Adding new product:', productData);
    console.log('[ProductService] Request URL:', `${this.baseUrl}/addProduct`);
    
    return this.http.post<Product>(
      `${this.baseUrl}/addProduct`,
      productData,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[ProductService] Product added successfully:', response);
      }),
      catchError(error => {
        console.error('[ProductService] Error adding product:', error);
        console.error('[ProductService] Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing product
   * @param id - Product ID
   * @param product - Updated product data
   * @returns Observable<Product>
   */
  updateProduct(id: number, product: Product): Observable<Product> {
    console.log(`[ProductService] Updating product ${id}:`, product);
    
    return this.http.put<Product>(
      `${this.baseUrl}/updateProduct/${id}`,
      product,
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('[ProductService] Product updated successfully:', response);
      }),
      catchError(error => {
        console.error(`[ProductService] Error updating product ${id}:`, error);
        console.error('[ProductService] Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a product
   * @param id - Product ID
   * @returns Observable<void>
   */
  deleteProduct(id: number): Observable<void> {
    console.log(`[ProductService] Deleting product ${id}`);
    
    return this.http.delete<void>(`${this.baseUrl}/deleteProduct/${id}`).pipe(
      tap(() => {
        console.log(`[ProductService] Product ${id} deleted successfully`);
      }),
      catchError(error => {
        console.error(`[ProductService] Error deleting product ${id}:`, error);
        return throwError(() => error);
      })
    );
  }
}
