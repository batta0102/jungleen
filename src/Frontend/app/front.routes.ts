import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Frontend application routes
 * These routes are mounted under the 'front' namespace
 * Accessible at: http://localhost:4200/front/...
 */
export const FRONT_ROUTES: Routes = [
	// Public routes - NO authentication required
	{
		path: '',
		title: 'Jungle in English',
		pathMatch: 'full',
		loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage)
	},
	{
		path: 'login',
		title: 'Login | Jungle in English',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage)
	},
	{
		path: 'signup',
		title: 'Sign up | Jungle in English',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/auth/signup.page').then((m) => m.SignupPage)
	},
	{
		path: 'events',
		title: 'Events | Jungle in English',
		loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage)
	},
	{
		path: 'clubs',
		title: 'Clubs | Jungle in English',
		loadComponent: () => import('./pages/clubs/clubs.page').then((m) => m.ClubsPage)
	},
	{
		path: 'clubs/:clubId',
		title: 'Club Details | Jungle in English',
		loadComponent: () => import('./pages/clubs/club-detail.page').then((m) => m.ClubDetailPage)
	},
	{
		path: 'trainings',
		title: 'Courses | Jungle in English',
		loadComponent: () => import('./pages/trainings/trainings.page').then((m) => m.TrainingsPage)
	},
	{
		path: 'trainings/:trainingId',
		title: 'Course Details | Jungle in English',
		loadComponent: () => import('./pages/trainings/training-detail.page').then((m) => m.TrainingDetailPage)
	},
	{
		path: 'library',
		title: 'Bibliothèque | Jungle in English',
		loadComponent: () => import('./pages/library/library.page').then((m) => m.LibraryPage)
	},
	{
		path: 'products',
		title: 'Products | Jungle in English',
		loadComponent: () => import('./pages/products/products.page').then((m) => m.ProductsPage)
	},
	{
		path: 'qcm',
		title: 'QCM | Jungle in English',
		loadComponent: () => import('./pages/qcm/qcm.page').then((m) => m.QcmPage)
	},
	{
		path: 'evaluations',
		title: 'Evaluations | Jungle in English',
		loadComponent: () => import('./pages/evaluations/evaluations.page').then((m) => m.EvaluationsPage)
	},
	{
		path: 'gamification',
		title: 'Gamification | Jungle in English',
		loadComponent: () => import('./pages/gamification/gamification.page').then((m) => m.GamificationPage)
	},
	{
		path: 'profile',
		redirectTo: 'profile/student',
		pathMatch: 'full'
	},
	{
		path: 'profile/student',
		title: 'Student Space | Jungle in English',
		loadComponent: () => import('./pages/profile/profile-student.page').then((m) => m.ProfileStudentPage)
	},
	{
		path: 'profile/tutor',
		title: 'Tutor Space | Jungle in English',
		loadComponent: () => import('./pages/profile/profile-tutor.page').then((m) => m.ProfileTutorPage)
	},
	{
		path: 'profile/admin',
		title: 'Admin Space | Jungle in English',
		loadComponent: () => import('./pages/profile/profile-admin.page').then((m) => m.ProfileAdminPage)
	}
];
