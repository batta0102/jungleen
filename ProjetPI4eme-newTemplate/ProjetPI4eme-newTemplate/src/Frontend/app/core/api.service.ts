import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private backend1Url = '/api/backend1';
  private backend2Url = '/api/backend2';

  constructor(private http: HttpClient) { }

  // Backend 1 - Projet 1
  getBackend1Data(endpoint: string): Observable<any> {
    return this.http.get(`${this.backend1Url}/${endpoint}`);
  }

  postBackend1Data(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.backend1Url}/${endpoint}`, data);
  }

  // Backend 2 - Projet 2
  getBackend2Data(endpoint: string): Observable<any> {
    return this.http.get(`${this.backend2Url}/${endpoint}`);
  }

  postBackend2Data(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.backend2Url}/${endpoint}`, data);
  }
}
