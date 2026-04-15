import { Routes } from '@angular/router';

// Backend (Admin) components
import { DashboardComponent } from '../../Backend/app/pages/dashboard/dashboard.component';
import { CoursesComponent } from '../../Backend/app/pages/courses/courses.component';
import { ClubsComponent } from '../../Backend/app/pages/clubs/clubs.component';
import { EventsComponent } from '../../Backend/app/pages/events/events.component';
import { AssessmentsComponent } from '../../Backend/app/pages/assessments/assessments.component';
import { ResourcesComponent } from '../../Backend/app/pages/resources/resources.component';
import { ResourceListComponent } from '../../Backend/app/components/resource-list/resource-list.component';
import { ResourceFormComponent } from '../../Backend/app/components/resource-form/resource-form.component';
import { ResourceReviewsPageComponent } from '../../Backend/app/pages/resource-reviews/resource-reviews-page.component';
import { ProductsManagementComponent } from '../../Backend/app/pages/products-management/products-management.component';
import { OrdersManagementComponent } from '../../Backend/app/pages/orders-management/orders-management.component';
import { GamesComponent } from '../../Backend/app/pages/games/games.component';
import { NotificationsComponent } from '../../Backend/app/pages/notifications/notifications.component';
import { CareerCenterManagementComponent } from '../../Backend/app/pages/career-center-management/career-center-management.component';

/**
 * Backend (Admin) application routes
 * These routes are mounted under the 'back' namespace
 * Accessible at: http://localhost:4200/back/...
 */
export const BACK_ROUTES: Routes = [
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full'
	},
	{
		path: 'dashboard',
		component: DashboardComponent
	},
	{
		path: 'courses',
		component: CoursesComponent
	},
	{
		path: 'clubs',
		component: ClubsComponent
	},
	{
		path: 'events',
		component: EventsComponent
	},
	{
		path: 'assessments',
		component: AssessmentsComponent
	},
	{
		path: 'resources',
		component: ResourcesComponent,
		children: [
			{
				path: '',
				component: ResourceListComponent
			},
			{
				path: 'create',
				component: ResourceFormComponent
			},
			{
				path: ':id/edit',
				component: ResourceFormComponent
			}
		]
	},
	{
		path: 'products-management',
		component: ProductsManagementComponent
	},
	{
		path: 'orders-management',
		component: OrdersManagementComponent
	},
	{
		path: 'resource-reviews/:resourceId',
		component: ResourceReviewsPageComponent
	},
	{
		path: 'games',
		component: GamesComponent
	},
	{
		path: 'career-center',
		component: CareerCenterManagementComponent
	},
	{
		path: 'notifications',
		component: NotificationsComponent
	}
];
