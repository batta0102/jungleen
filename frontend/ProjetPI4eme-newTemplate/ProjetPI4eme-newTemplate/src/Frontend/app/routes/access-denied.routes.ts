import { Routes } from '@angular/router';

export const ACCESS_DENIED_ROUTES: Routes = [
  {
    path: 'access-denied',
    loadComponent: () => import('../pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent),
    title: 'Accès Refusé'
  }
];
