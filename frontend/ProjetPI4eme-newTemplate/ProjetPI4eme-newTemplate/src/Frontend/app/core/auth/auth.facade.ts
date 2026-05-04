import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly auth = inject(AuthService);

  studentId(): number | null {
    return this.currentUserNumericId();
  }

  tutorId(): number | null {
    return this.currentUserNumericId();
  }

  private currentUserNumericId(): number | null {
    const id = this.auth.currentUser()?.id;
    if (!id) return null;
    const numeric = Number(id);
    return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
  }
}
