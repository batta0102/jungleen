import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root Application Component
 * Displays the router outlet for the entire application
 * Layout switching (Frontend/Backend) is handled by routes
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.scss'
})
export class App {}