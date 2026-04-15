import { Routes } from '@angular/router';
import { FRONT_ROUTES } from './front.routes';
import { BACK_ROUTES } from './back.routes';
import { FrontLayoutComponent } from './layouts/front-layout.component';
import { BackLayoutComponent } from './layouts/back-layout.component';
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
		redirectTo: 'admin',
		pathMatch: 'full'
	},
	{
		path: '**',
		redirectTo: 'front'
	}
];
