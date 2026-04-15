import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface NavItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="sticky top-0 z-50 w-full border-b border-border bg-primary text-background backdrop-blur-sm px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <!-- Logo -->
        <div
          class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          (click)="navigateTo('dashboard')">
          <img src="/logojungle.png" alt="Jungle logo" class="h-12 w-12 rounded-lg object-cover" />
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
            class="text-sm font-medium transition-colors">
            {{ item.label }}
          </button>
        </div>

        <!-- Right Section -->
        <div class="hidden md:flex items-center space-x-4">
          <button class="p-2 text-background/80 hover:text-background hover:bg-primary-hover/60 rounded-lg transition-colors">
            🔍
          </button>
          <div class="relative">
            <button
              (click)="navigateTo('notifications')"
              class="p-2 text-background/80 hover:text-background hover:bg-primary-hover/60 rounded-lg transition-colors">
              🔔
            </button>
            <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white"></span>
          </div>
          <button class="flex h-9 w-9 items-center justify-center rounded-full bg-background text-primary hover:bg-warning hover:text-primary transition-colors">
            👤
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="lg:hidden">
          <button
            (click)="toggleMobileMenu()"
            class="p-2 text-background/80 hover:text-background hover:bg-primary-hover/60 rounded-lg transition-colors">
            {{ isMobileMenuOpen() ? '✕' : '≡' }}
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div *ngIf="isMobileMenuOpen()" class="lg:hidden mt-4 pb-4 space-y-2">
        <button
          *ngFor="let item of navItems"
          (click)="navigateTo(item.id)"
          [class]="getMobileNavItemClass(item.id)"
          class="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {{ item.label }}
        </button>
      </div>
    </nav>
  `,
  styles: []
})
export class NavigationComponent {
  isMobileMenuOpen = signal(false);

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Home' },
    { id: 'courses', label: 'Courses' },
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
    // Extract the route segment after /back/
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
