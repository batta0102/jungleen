import { Routes } from '@angular/router';
import { FRONT_ROUTES } from './front.routes';
import { BACK_ROUTES } from './back.routes';
import { FrontLayoutComponent } from './layouts/front-layout.component';
import { BackLayoutComponent } from './layouts/back-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { tutorRoleChildGuard, tutorRoleGuard } from './core/auth/tutor-role.guard';

/**
 * Root application routes with two main namespaces and separate layouts:
 * - /front/... → Frontend user application with navbar
 * - /back/... → Backend admin application with navigation
 */
export const routes: Routes = [
	{
		path: '',
		redirectTo: 'front',
		pathMatch: 'full'
	},
	{
		path: 'clubs',
		title: 'Clubs',
		loadComponent: () => import('./pages/clubs/clubs.page').then((m) => m.ClubsPage)
	},
	{
		path: 'clubs/:id',
		title: 'Club Details',
		loadComponent: () => import('./pages/club-detail/club-detail-simple.component').then((m) => m.ClubDetailSimpleComponent)
	},
	{
		path: 'clubs/:id/forum',
		title: 'Club Forum',
		loadComponent: () => import('./pages/forum-messages/forum-messages.component').then((m) => m.ForumMessages)
	},
	{
		path: 'clubs/:clubId/messages/:messageId',
		title: 'Message Details',
		loadComponent: () => import('./pages/message-detail/message-detail.component').then((m) => m.MessageDetailComponent)
	},
	{
		path: 'scanner',
		title: 'Scanner OCR',
		loadComponent: () => import('./components/scanner/scanner.component').then((m) => m.ScannerComponent)
	},
	{
		path: 'vocabulaire',
		title: 'Mon vocabulaire',
		loadComponent: () => import('./components/vocabulaire/vocabulaire.component').then((m) => m.VocabulaireComponent)
	},
	{
		path: 'buddies',
		children: [
			{
				path: '',
				loadComponent: () => import('./pages/user-buddies/user-buddies.component').then((m) => m.UserBuddiesComponent),
				canActivate: [authGuard],
				title: 'Mes Buddies'
			},
			{
				path: 'request',
				loadComponent: () => import('./pages/user-buddy-request/user-buddy-request.component').then((m) => m.UserBuddyRequestComponent),
				canActivate: [authGuard],
				title: 'Demander un Buddy'
			},
			{
				path: ':id',
				loadComponent: () => import('./pages/user-buddy-detail/user-buddy-detail.component').then((m) => m.UserBuddyDetailComponent),
				canActivate: [authGuard],
				title: 'Details du Buddy'
			},
			{
				path: ':id/plan-session',
				loadComponent: () => import('./pages/user-plan-session/user-plan-session.component').then((m) => m.UserPlanSessionComponent),
				canActivate: [authGuard],
				title: 'Planifier une Session'
			},
			{
				path: ':id/sessions',
				loadComponent: () => import('./pages/user-buddy-sessions/user-buddy-sessions.component').then((m) => m.UserBuddySessionsComponent),
				canActivate: [authGuard],
				title: 'Sessions du Buddy'
			}
		]
	},
	{
		path: 'admin/buddies/requests',
		title: 'Demandes de Buddies',
		canActivate: [tutorRoleGuard],
		loadComponent: () => import('./pages/admin-buddy-requests/admin-buddy-requests.component').then((m) => m.AdminBuddyRequestsComponent)
	},
	{
		path: 'admin/buddies/requests/manage',
		title: 'Demandes de Buddies',
		canActivate: [tutorRoleGuard],
		loadComponent: () => import('./pages/admin-buddy-requests/admin-buddy-requests.component').then((m) => m.AdminBuddyRequestsComponent)
	},
	{
		path: 'admin/buddies/monitoring',
		title: 'Monitoring des Buddies',
		canActivate: [tutorRoleGuard],
		loadComponent: () => import('./pages/admin-buddies-monitoring/admin-buddies-monitoring.component').then((m) => m.AdminBuddiesMonitoringComponent)
	},
	{
		path: 'admin/clubs/:id/buddies',
		title: 'Buddies du Club',
		canActivate: [tutorRoleGuard],
		loadComponent: () => import('./pages/admin-club-buddies/admin-club-buddies.component').then((m) => m.AdminClubBuddiesComponent)
	},
	{
		path: 'front',
		component: FrontLayoutComponent,
		children: FRONT_ROUTES
	},
	{
		path: 'admin',
		component: BackLayoutComponent,
		canActivate: [tutorRoleGuard],
		canActivateChild: [tutorRoleChildGuard],
		children: BACK_ROUTES
	},
	{
		path: 'back',
		component: BackLayoutComponent,
		canActivate: [tutorRoleGuard],
		canActivateChild: [tutorRoleChildGuard],
		children: BACK_ROUTES
	},
	{
		path: '**',
		redirectTo: 'front'
	}
];
