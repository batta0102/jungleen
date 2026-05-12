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
		loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage)
	},
	{
		path: 'user-selection',
		title: 'User Selection | Jungle in English',
		loadComponent: () => import('./pages/user-selection/user-selection.page').then((m) => m.UserSelectionPage)
	},
	{
		path: 'signup',
		title: 'Sign up | Jungle in English',
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
		path: 'clubs/:id',
		title: 'Club Details | Jungle in English',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/club-detail/club-detail-simple.component').then((m) => m.ClubDetailSimpleComponent)
	},
	{
		path: 'clubs/:clubId/messages/:messageId',
		title: 'Message du forum',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/message-detail/message-detail.component').then((m) => m.MessageDetailComponent)
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
		path: 'products/:productId',
		title: 'Product Details | Jungle in English',
		loadComponent: () => import('./pages/products/product-detail.page').then((m) => m.ProductDetailPage)
	},
	{
		path: 'qcm',
		title: 'QCM | Jungle in English',
		loadComponent: () => import('./pages/qcm/qcm.page').then((m) => m.QcmPage)
	},
	{
		path: 'candidate-quiz',
		title: 'Candidate Quiz | Jungle in English',
		loadComponent: () => import('./pages/candidate-quiz/candidate-quiz.page').then((m) => m.CandidateQuizPage)
	},
	{
		path: 'career-center',
		title: 'Career Center | Jungle in English',
		loadComponent: () => import('./pages/career-center/career-center.page').then((m) => m.CareerCenterPage)
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
		path: 'ai-practice',
		title: 'AI Practice | Jungle in English',
		loadComponent: () => import('./pages/ai-practice/ai-practice.page').then((m) => m.AiPracticePage)
	},
	{
		path: 'games',
		title: 'Games | Jungle in English',
		loadComponent: () => import('./pages/games/games.page').then((m) => m.FrontendGamesPage)
	},
	{
		path: 'games/crossword',
		title: 'Crossword | Jungle in English',
		loadComponent: () => import('./pages/crossword/crossword.page').then((m) => m.CrosswordPage)
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
	},
	{
		path: 'profile-assessment',
		title: 'Learning Profile Assessment | Jungle in English',
		loadComponent: () => import('./pages/profile/learning-profile-form.component').then((m) => m.LearningProfileFormComponent)
	}
];
