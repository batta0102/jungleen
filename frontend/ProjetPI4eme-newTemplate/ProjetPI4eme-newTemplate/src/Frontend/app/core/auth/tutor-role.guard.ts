import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

function canAccessTutorArea(): boolean {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/front/login']);
    return false;
  }

  const current = auth.currentUser();
  if (current?.role === 'admin' || current?.role === 'teacher' || current?.role === 'tutor') {
    return true;
  }

  router.navigate(['/front/profile/student']);
  return false;
}

export const tutorRoleGuard: CanActivateFn = () => canAccessTutorArea();
export const tutorRoleChildGuard: CanActivateChildFn = () => canAccessTutorArea();
