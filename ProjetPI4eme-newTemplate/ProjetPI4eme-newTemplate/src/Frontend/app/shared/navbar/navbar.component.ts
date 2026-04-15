import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { UserContextService } from '../../core/user/user-context.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'navbar-host'
  }
})
export class NavbarComponent {
  private readonly user = inject(UserContextService);
  private readonly auth = inject(AuthService);

  readonly role = this.user.role;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly currentUser = this.auth.currentUser;

  readonly profileLink = computed(() => {
    const role = this.role();
    return role === 'admin' ? '/front/profile/admin' : role === 'tutor' ? '/front/profile/tutor' : '/front/profile/student';
  });

  readonly spaceLabel = computed(() => {
    const role = this.role();
    return role === 'tutor' ? 'Tutor space' : 'Student space';
  });



  async logout(): Promise<void> {
    await this.auth.logout();
  }

  // English-only UI (no i18n layer).
}
