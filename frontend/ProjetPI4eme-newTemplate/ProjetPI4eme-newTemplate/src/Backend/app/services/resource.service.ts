import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Resource, ResourceResponse } from '../models/resource.model';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private http = inject(HttpClient);
  private apiUrl = '/api/resources';

  /**
   * Get all resources
   */
  getAll(): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(`${this.apiUrl}/displayResources`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a single resource by ID
   */
  getById(id: number): Observable<ResourceResponse> {
    return this.http.get<ResourceResponse>(`${this.apiUrl}/getResource/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new resource
   */
  create(resource: Resource): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(`${this.apiUrl}/addResource`, resource).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing resource
   */
  update(id: number, resource: Resource): Observable<ResourceResponse> {
    return this.http.put<ResourceResponse>(`${this.apiUrl}/updateResource/${id}`, resource).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a resource
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteResource/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
