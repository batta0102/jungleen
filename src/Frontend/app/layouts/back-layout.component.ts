import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NotificationBellComponent } from '../shared/notification-bell/notification-bell.component';

interface NavItem {
  id: string;
  label: string;
  icon?: 'calendar-check' | 'user-check';
}

/**
 * Backend (Admin) Layout Component
 * Combines BackendNavigation + RouterOutlet for admin pages
 * Inline implementation to avoid cross-module import issues
 */
@Component({
  selector: 'app-back-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationBellComponent],
  template: `
    <div class="min-h-screen w-full bg-background">
      <!-- Navigation Bar -->
      <nav class="sticky top-0 z-50 w-full border-b border-border bg-primary text-background backdrop-blur-sm px-6 py-4">
        <div class="mx-auto flex max-w-7xl items-center justify-between">
          <!-- Logo -->
          <div
            class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            (click)="navigateTo('dashboard')">
            <img src="/logojungle.png" alt="Jungle logo" class="h-12 w-12 rounded-lg object-cover" (error)="$any($event.target).style.display='none'" />
            <span class="font-serif text-2xl font-semibold tracking-tight text-background">
              Jungle
            </span>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center space-x-8">
            <button
              *ngFor="let item of navItems"
              (click)="navigateTo(item.id)"
              [class]="getNavItemClass(item.id)"
              class="inline-flex items-center gap-2 text-sm font-medium transition-colors">
              <span *ngIf="item.icon === 'calendar-check'" class="inline-flex shrink-0" aria-hidden="true" style="width: 1.125rem; height: 1.125rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
              </span>
              <span *ngIf="item.icon === 'user-check'" class="inline-flex shrink-0" aria-hidden="true" style="width: 1.125rem; height: 1.125rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M19 16l2 2 4-4"/></svg>
              </span>
              {{ item.label }}
            </button>
          </div>

          <div class="flex items-center gap-2 md:gap-4">
            <app-notification-bell class="shrink-0" />
            <div class="hidden md:flex items-center space-x-4">
              <button
                type="button"
                class="p-2 text-background/80 hover:text-background hover:bg-primary-hover/60 rounded-lg transition-colors"
              >
                🔍
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-background text-primary hover:bg-warning hover:text-primary transition-colors"
              >
                👤
              </button>
            </div>

            <div class="lg:hidden">
              <button
                (click)="toggleMobileMenu()"
                class="p-2 text-background/80 hover:text-background hover:bg-primary-hover/60 rounded-lg transition-colors">
                {{ isMobileMenuOpen() ? '✕' : '≡' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div *ngIf="isMobileMenuOpen()" class="lg:hidden mt-4 pb-4 space-y-2">
          <button
            *ngFor="let item of navItems"
            (click)="navigateTo(item.id)"
            [class]="getMobileNavItemClass(item.id)"
            class="flex items-center gap-2 w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <span *ngIf="item.icon === 'calendar-check'" class="inline-flex shrink-0" aria-hidden="true" style="width: 1.125rem; height: 1.125rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
            </span>
            <span *ngIf="item.icon === 'user-check'" class="inline-flex shrink-0" aria-hidden="true" style="width: 1.125rem; height: 1.125rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M19 16l2 2 4-4"/></svg>
            </span>
            {{ item.label }}
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: []
})
export class BackLayoutComponent {
  isMobileMenuOpen = signal(false);

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Home' },
    { id: 'courses', label: 'Courses' },
    { id: 'attendance', label: 'Attendance', icon: 'calendar-check' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'events', label: 'Events' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'resources', label: 'Resources' },
    { id: 'games', label: 'Games' }
  ];

  currentRoute = signal('dashboard');

  constructor(private router: Router) {
    this.updateCurrentRoute();
    this.router.events.subscribe(() => {
      this.updateCurrentRoute();
    });
  }

  updateCurrentRoute(): void {
    const url = this.router.url;
    const match = url.match(/^\/back\/([^/]+)/);
    const route = match ? match[1] : 'dashboard';
    this.currentRoute.set(route);
  }

  navigateTo(page: string): void {
    this.router.navigate([`/back/${page}`]);
    this.isMobileMenuOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(state => !state);
  }

  getNavItemClass(itemId: string): string {
    const isActive = this.currentRoute() === itemId;
    return isActive
      ? 'text-background font-semibold'
      : 'text-background/80 hover:text-background';
  }

  getMobileNavItemClass(itemId: string): string {
    const isActive = this.currentRoute() === itemId;
    return isActive
      ? 'bg-primary text-background'
      : 'text-text hover:bg-light';
  }
}

