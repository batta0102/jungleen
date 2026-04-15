import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface SignupResponse {
  id: string;
  message: string;
}

export interface CurrentUserResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  /**
   * Sign up a new user via the user-service API
   */
  signup(request: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, request);
  }

  /**
   * Get the current authenticated user info
   */
  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/me`);
  }

  /**
   * List all users (requires admin role)
   */
  listUsers(max: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?max=${max}`);
  }

  /**
   * Create a new user (requires admin role)
   */
  createUser(request: any): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}`, request);
  }
}
