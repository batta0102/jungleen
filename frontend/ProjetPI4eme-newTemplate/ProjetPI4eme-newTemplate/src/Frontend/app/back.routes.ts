import { Routes } from '@angular/router';

// Backend (Admin) components
import { DashboardComponent } from '../../Backend/app/pages/dashboard/dashboard.component';
import { CoursesComponent } from '../../Backend/app/pages/courses/courses.component';
import { CourseFormComponent } from '../../Backend/app/pages/courses/course-form.component';
import { ClassroomsManagementComponent } from '../../Backend/app/pages/courses/classrooms-management.component';
import { ClassroomCreateComponent } from '../../Backend/app/pages/courses/classroom-create.component';
import { ClubsComponent } from '../../Backend/app/pages/clubs/clubs.component';
import { EventsComponent } from '../../Backend/app/pages/events/events.component';
import { AssessmentsComponent } from '../../Backend/app/pages/assessments/assessments.component';
import { ResourcesComponent } from '../../Backend/app/pages/resources/resources.component';
import { ResourceListComponent } from '../../Backend/app/components/resource-list/resource-list.component';
import { ResourceFormComponent } from '../../Backend/app/components/resource-form/resource-form.component';
import { ResourceReviewsPageComponent } from '../../Backend/app/pages/resource-reviews/resource-reviews-page.component';
import { ProductsManagementComponent } from '../../Backend/app/pages/products-management/products-management.component';
import { OrdersManagementComponent } from '../../Backend/app/pages/orders-management/orders-management.component';
import { DeliveryManagementComponent } from '../../Backend/app/pages/delivery-management/delivery-management.component';
import { GamesComponent } from '../../Backend/app/pages/games/games.component';
import { NotificationsComponent } from '../../Backend/app/pages/notifications/notifications.component';
import { AnalyticsComponent } from '../../Backend/app/pages/analytics/analytics.component';
import { CareerCenterManagementComponent } from '../../Backend/app/pages/career-center-management/career-center-management.component';
import { CreateClubComponent } from '../../Backend/app/pages/clubs/create-club/create-club.component';
import { EditClubComponent } from '../../Backend/app/pages/clubs/edit-club/edit-club.component';
import { ForumMessages } from '../../Backend/app/pages/clubs/forum-messages/forum-messages';
import { MembershipManagementComponent } from '../../Backend/app/pages/membership-management/membership-management.component';

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
		path: 'courses/new',
		component: CourseFormComponent
	},
	{
		path: 'courses/create',
		component: CourseFormComponent
	},
	{
		path: 'courses/:id/edit',
		component: CourseFormComponent
	},
	{
		path: 'courses/classrooms',
		component: ClassroomsManagementComponent
	},
	{
		path: 'courses/classrooms/create',
		component: ClassroomCreateComponent
	},
	{
		path: 'courses/classrooms/:id/edit',
		component: ClassroomCreateComponent
	},
	{
		path: 'courses/sessions',
		component: CoursesComponent
	},
	{
		path: 'courses/bookings',
		component: CoursesComponent
	},
	{
		path: 'courses/:courseType/:courseId/attendance/:sessionId',
		component: CoursesComponent
	},
	{
		path: 'courses/:courseType/:courseId/attendance',
		component: CoursesComponent
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
		path: 'clubs/create',
		component: CreateClubComponent
	},
	{
		path: 'clubs/edit/:id',
		component: EditClubComponent
	},
	{
		path: 'clubs/:id/forum',
		component: ForumMessages
	},
	{
		path: 'membership-management',
		component: MembershipManagementComponent
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
		path: 'career-center',
		component: CareerCenterManagementComponent
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
		path: 'delivery-management',
		component: DeliveryManagementComponent
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
		path: 'analytics',
		component: AnalyticsComponent
	},
	{
		path: 'notifications',
		component: NotificationsComponent
	}
];
