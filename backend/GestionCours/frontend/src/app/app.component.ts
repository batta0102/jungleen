import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="app-shell">
      <header class="header">
        <a routerLink="/" class="logo">GestionCours</a>
        <nav>
          <a routerLink="/attendance" routerLinkActive="active">Présences</a>
          <a routerLink="/back/courses/classrooms" routerLinkActive="active">Salles 3D</a>
        </nav>
      </header>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; background: var(--bg-card); border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    .logo { font-weight: 700; color: var(--primary); text-decoration: none; font-size: 1.25rem; }
    nav a { margin-left: 1.5rem; color: var(--text-muted); text-decoration: none; }
    nav a:hover, nav a.active { color: var(--primary); }
    .main { flex: 1; padding: 1.5rem; }
  `],
})
export class AppComponent {}
