import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'attendance', pathMatch: 'full' },
  { path: 'attendance', loadComponent: () => import('./pages/attendance/attendance.page').then(m => m.AttendancePage) },
  { path: 'onsite-sessions/recommendation', loadComponent: () => import('./pages/onsite-session-recommendation/onsite-session-recommendation.page').then(m => m.OnsiteSessionRecommendationPage) },
  {
    path: 'back/courses/classrooms',
    loadComponent: () =>
      import('./pages/back/courses/classrooms/classrooms.page').then((m) => m.ClassroomsPage),
  },
  { path: '**', redirectTo: 'attendance' },
];
