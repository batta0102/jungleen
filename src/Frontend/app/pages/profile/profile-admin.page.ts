import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DataService } from '../../core/data/data.service';
import { UserContextService, UserRole } from '../../core/user/user-context.service';

@Component({
  selector: 'app-profile-admin-page',
  imports: [RouterLink],
  templateUrl: './profile-admin.page.html',
  styleUrl: './profile-admin.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAdminPage {
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly user = inject(UserContextService);

  readonly role = this.user.role;
  readonly stats = computed(() => ({
    events: this.data.events().length,
    clubs: this.data.clubs().length,
    trainings: this.data.trainings().length
  }));

  setRole(role: string): void {
    if (role !== 'student' && role !== 'tutor' && role !== 'admin') return;
    this.user.setRole(role as UserRole);
    void this.router.navigate([role === 'admin' ? '/front/profile/admin' : role === 'tutor' ? '/front/profile/tutor' : '/front/profile/student']);
  }
}
