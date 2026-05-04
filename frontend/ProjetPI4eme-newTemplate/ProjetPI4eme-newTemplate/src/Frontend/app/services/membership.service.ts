import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Membership {
  idInscription: number;
  userId: number;
  clubId: number;
  clubNom: string;
  status: string;
  dateInscription: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = 'http://localhost:8085/api/memberships';

  constructor(private http: HttpClient) {}

  getAllMemberships(): Observable<Membership[]> {
    return this.http.get<Membership[]>(this.apiUrl);
  }

  getMembershipById(id: number): Observable<Membership> {
    return this.http.get<Membership>(`${this.apiUrl}/${id}`);
  }

  getMembershipsByClub(clubId: number): Observable<Membership[]> {
    return this.http.get<Membership[]>(`${this.apiUrl}/by-club/${clubId}`);
  }

  createMembership(membership: Partial<Membership>): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl, membership);
  }

  updateMembershipStatus(id: number, status: string): Observable<Membership> {
    return this.http.put<Membership>(`${this.apiUrl}/${id}`, { status });
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
