import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClubMembership } from './membership';

@Injectable({
  providedIn: 'root'
})
export class MembershipSyncService {
  private membershipUpdates = new BehaviorSubject<{id: number, status: string} | null>(null);
  
  // Notifier quand un membership est mis à jour
  notifyMembershipUpdate(id: number, status: 'VALIDEE' | 'REFUSEE') {
    console.log(`🔄 Notification de mise à jour: Membership ${id} -> ${status}`);
    this.membershipUpdates.next({ id, status });
  }
  
  // Écouter les mises à jour
  getMembershipUpdates() {
    return this.membershipUpdates.asObservable();
  }
  
  // Effacer la notification
  clearUpdate() {
    this.membershipUpdates.next(null);
  }
}
