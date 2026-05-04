import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClubService } from '../../../services/club.service';  // Import du service
import { AuthService } from '../../../../../Frontend/app/core/auth/auth.service';
import { AuthSimpleService } from '../../../../../Frontend/app/services/auth-simple.service';

@Component({
  selector: 'app-create-club',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-club.component.html',
  styleUrls: ['./create-club.component.scss']
})
export class CreateClubComponent {
  clubForm: FormGroup;
  isSubmitting = false;
  selectedIcon = '📚';
  availableIcons = ['📚', '🗣️', '🎭', '📖', '✍️', '🌍', '🎯', '💬', '🎪', '📝'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clubService: ClubService,
    private authService: AuthService,
    private authSimpleService: AuthSimpleService
  ) {
    this.clubForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      niveau: ['', Validators.required],
      capacityMax: [20, [Validators.required, Validators.min(5), Validators.max(100)]],
      icon: ['📚']
    });
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.clubForm.patchValue({ icon });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clubForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    console.log('🔴 Formulaire soumis');
    console.log('📝 Valeurs du formulaire:', this.clubForm.value);
    console.log('✅ Formulaire valide?', this.clubForm.valid);

    if (this.clubForm.invalid) {
      console.log('❌ Formulaire invalide - erreurs:', this.clubForm.errors);
      return;
    }

    this.isSubmitting = true;

    const ownerFromAuth = this.resolveOwnerId();

    if (!ownerFromAuth) {
      this.isSubmitting = false;
      alert('No connected user found. Please log in before creating a club.');
      return;
    }

    const clubData = {
      nom: this.clubForm.value.nom,
      description: this.clubForm.value.description,
      niveau: this.clubForm.value.niveau,
      capacityMax: this.clubForm.value.capacityMax,
      clubOwner: ownerFromAuth,
      status: 'ACTIVE'
    };

    console.log('📤 Envoi des données au service:', clubData);

    this.clubService.createClub(clubData).subscribe({
      next: (response) => {
        console.log('✅ Réponse du serveur:', response);
        this.isSubmitting = false;
        alert('Club créé avec succès !');
        this.router.navigate(['/admin/clubs']);
      },
      error: (error) => {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Statut:', error.status);
        console.error('❌ Message:', error.message);
        this.isSubmitting = false;
        if (error.status === 400) {
          const backendMessage = error?.error?.message || 'Invalid request payload.';
          alert(`Create club failed (400): ${backendMessage}`);
          return;
        }
        alert(`Erreur ${error.status}: ${error.message}`);
      }
    });


  }

  onCancel(): void {
    this.router.navigate(['/admin/clubs']);
  }

  private resolveOwnerId(): string {
    const fromKeycloak = this.authService.currentUser()?.id?.trim();
    if (fromKeycloak) {
      return fromKeycloak;
    }

    const fromSimpleAuth = this.authSimpleService.getCurrentUser()?.id?.trim();
    if (fromSimpleAuth) {
      return fromSimpleAuth;
    }

    const storedCurrentUser = localStorage.getItem('currentUser');
    if (storedCurrentUser) {
      try {
        const parsed = JSON.parse(storedCurrentUser) as { id?: string | number };
        const fromStorage = parsed?.id?.toString().trim();
        if (fromStorage) {
          return fromStorage;
        }
      } catch {
        // Ignore invalid localStorage payload.
      }
    }

    return '';
  }
}
