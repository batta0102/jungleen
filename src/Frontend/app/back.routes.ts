import { Routes } from '@angular/router';

export const BACK_ROUTES: Routes = [
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full'
	},
	{
		path: 'dashboard',
		loadComponent: () =>
			import('../../Backend/app/pages/dashboard/dashboard.component').then(
				(m) => m.DashboardComponent
			)
	},
	{
		path: 'courses',
		loadComponent: () =>
			import('../../Backend/app/pages/courses/courses.component').then((m) => m.CoursesComponent),
		children: [
			{
				path: '',
				pathMatch: 'full',
				loadComponent: () =>
					import('../../Backend/app/components/course-list/course-list.component').then(
						(m) => m.CourseListComponent
					)
			},
			{
				path: ':courseType/:courseId/attendance',
				loadComponent: () =>
					import('../../Backend/app/pages/courses/course-attendance.component').then(
						(m) => m.CourseAttendanceComponent
					)
			},
			{
				path: ':courseType/:courseId/attendance/:sessionId',
				loadComponent: () =>
					import('../../Backend/app/pages/courses/session-attendance.component').then(
						(m) => m.SessionAttendanceComponent
					)
			},
			{
				path: 'create',
				loadComponent: () =>
					import('../../Backend/app/components/course-form/course-form.component').then(
						(m) => m.CourseFormComponent
					)
			},
			{
				path: 'classrooms/create',
				loadComponent: () =>
					import('../../Backend/app/components/classroom-form/classroom-form.component').then(
						(m) => m.ClassroomFormComponent
					)
			},
			{
				path: 'classrooms/:id/edit',
				loadComponent: () =>
					import('../../Backend/app/components/classroom-form/classroom-form.component').then(
						(m) => m.ClassroomFormComponent
					)
			},
			{
				path: 'classrooms',
				loadComponent: () =>
					import(
						'../../Backend/app/pages/classrooms-management/classrooms-management.component'
					).then((m) => m.ClassroomsManagementComponent)
			},
			{
				path: 'sessions/create',
				loadComponent: () =>
					import('../../Backend/app/components/session-form/session-form.component').then(
						(m) => m.SessionFormComponent
					)
			},
			{
				path: 'sessions/:id/edit',
				loadComponent: () =>
					import('../../Backend/app/components/session-form/session-form.component').then(
						(m) => m.SessionFormComponent
					)
			},
			{
				path: 'sessions',
				loadComponent: () =>
					import('../../Backend/app/pages/sessions-management/sessions-management.component').then(
						(m) => m.SessionsManagementComponent
					)
			},
			{
				path: 'bookings/create',
				loadComponent: () =>
					import('../../Backend/app/components/booking-form/booking-form.component').then(
						(m) => m.BookingFormComponent
					)
			},
			{
				path: 'bookings/:id/edit',
				loadComponent: () =>
					import('../../Backend/app/components/booking-form/booking-form.component').then(
						(m) => m.BookingFormComponent
					)
			},
			{
				path: 'bookings',
				loadComponent: () =>
					import('../../Backend/app/pages/bookings-management/bookings-management.component').then(
						(m) => m.BookingsManagementComponent
					)
			},
			{
				path: ':type/:id/edit',
				loadComponent: () =>
					import('../../Backend/app/components/course-form/course-form.component').then(
						(m) => m.CourseFormComponent
					)
			},
		]
	},
	{
		path: 'clubs',
		loadComponent: () => import('../../Backend/app/pages/clubs/clubs.component').then((m) => m.ClubsComponent)
	},
	{
		path: 'events',
		loadComponent: () => import('../../Backend/app/pages/events/events.component').then((m) => m.EventsComponent)
	},
	{
		path: 'assessments',
		loadComponent: () =>
			import('../../Backend/app/pages/assessments/assessments.component').then(
				(m) => m.AssessmentsComponent
			)
	},
	{
		path: 'resources',
		loadComponent: () =>
			import('../../Backend/app/pages/resources/resources.component').then((m) => m.ResourcesComponent),
		children: [
			{
				path: '',
				loadComponent: () =>
					import('../../Backend/app/components/resource-list/resource-list.component').then(
						(m) => m.ResourceListComponent
					)
			},
			{
				path: 'create',
				loadComponent: () =>
					import('../../Backend/app/components/resource-form/resource-form.component').then(
						(m) => m.ResourceFormComponent
					)
			},
			{
				path: ':id/edit',
				loadComponent: () =>
					import('../../Backend/app/components/resource-form/resource-form.component').then(
						(m) => m.ResourceFormComponent
					)
			}
		]
	},
	{
		path: 'products-management',
		loadComponent: () =>
			import('../../Backend/app/pages/products-management/products-management.component').then(
				(m) => m.ProductsManagementComponent
			)
	},
	{
		path: 'orders-management',
		loadComponent: () =>
			import('../../Backend/app/pages/orders-management/orders-management.component').then(
				(m) => m.OrdersManagementComponent
			)
	},
	{
		path: 'resource-reviews/:resourceId',
		loadComponent: () =>
			import('../../Backend/app/pages/resource-reviews/resource-reviews-page.component').then(
				(m) => m.ResourceReviewsPageComponent
			)
	},
	{
		path: 'games',
		loadComponent: () => import('../../Backend/app/pages/games/games.component').then((m) => m.GamesComponent)
	},
	{
		path: 'notifications',
		loadComponent: () =>
			import('../../Backend/app/pages/notifications/notifications.component').then(
				(m) => m.NotificationsComponent
			)
	},
	{
		path: 'notifications-api-test',
		loadComponent: () =>
			import('../../Backend/app/pages/notifications/notification-api-test.component').then(
				(m) => m.NotificationApiTestComponent
			)
	},
	{
		path: 'attendance',
		loadComponent: () =>
			import('../../Backend/app/pages/attendance/attendance-page.component').then(
				(m) => m.AttendancePageComponent
			)
	}
];
