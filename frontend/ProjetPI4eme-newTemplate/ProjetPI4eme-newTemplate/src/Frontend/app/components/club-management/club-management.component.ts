import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Club, CreateClubDTO, UpdateClubDTO, ClubService } from '../../services/club.service';

@Component({
  selector: 'app-club-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './club-management.component.html',
  styleUrls: ['./club-management.component.css']
})
export class ClubManagementComponent implements OnInit, OnDestroy {
  private clubService = inject(ClubService);
  private fb = inject(FormBuilder);
  
  // État du composant
  clubs: Club[] = [];
  isLoading = false;
  error: string | null = null;
  showForm = false;
  editingClub: Club | null = null;
  
  // Gestion des abonnements
  private destroy$ = new Subject<void>();
  
  // Formulaire
  clubForm: FormGroup = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    adresse: ['', [Validators.required]],
    ville: ['', [Validators.required]],
    pays: ['', [Validators.required]],
    telephone: ['', [Validators.pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/)]],
    email: ['', [Validators.email]],
    siteWeb: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]]
  });

  ngOnInit(): void {
    console.log('🏢 ClubManagementComponent initialisé');
    this.loadClubs();
  }

  ngOnDestroy(): void {
    console.log('🏢 ClubManagementComponent détruit');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste des clubs
   */
  loadClubs(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('📡 Chargement des clubs...');
    
    this.clubService.getAllClubs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (clubs) => {
        console.log('✅ Clubs chargés:', clubs);
        this.clubs = clubs;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement clubs:', error);
        this.error = error.message || 'Erreur lors du chargement des clubs';
        this.isLoading = false;
      }
    });
  }

  /**
   * Affiche le formulaire pour créer un club
   */
  showCreateForm(): void {
    console.log('📝 Affichage formulaire de création');
    this.editingClub = null;
    this.showForm = true;
    this.clubForm.reset();
  }

  /**
   * Affiche le formulaire pour modifier un club
   */
  showEditForm(club: Club): void {
    console.log('✏️ Affichage formulaire de modification pour:', club);
    this.editingClub = club;
    this.showForm = true;
    this.clubForm.patchValue({
      nom: club.nom,
      description: club.description,
      adresse: club.adresse,
      ville: club.ville,
      pays: club.pays,
      telephone: club.telephone,
      email: club.email,
      siteWeb: club.siteWeb
    });
  }

  /**
   * Cache le formulaire
   */
  hideForm(): void {
    console.log('🙈 Cache du formulaire');
    this.showForm = false;
    this.editingClub = null;
    this.clubForm.reset();
  }

  /**
   * Soumet le formulaire (création ou modification)
   */
  onSubmit(): void {
    if (this.clubForm.invalid) {
      console.log('❌ Formulaire invalide:', this.clubForm.value);
      this.markFormGroupTouched(this.clubForm);
      return;
    }

    const clubData: CreateClubDTO = this.clubForm.value;
    
    if (this.editingClub) {
      this.updateClub(this.editingClub.idClub, clubData);
    } else {
      this.createClub(clubData);
    }
  }

  /**
   * Crée un nouveau club
   */
  createClub(clubData: CreateClubDTO): void {
    console.log('➕ Création du club:', clubData);
    
    this.clubService.createClub(clubData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (club) => {
        console.log('✅ Club créé avec succès:', club);
        this.clubs.unshift(club);
        this.hideForm();
      },
      error: (error) => {
        console.error('❌ Erreur création club:', error);
        this.error = error.message || 'Erreur lors de la création du club';
      }
    });
  }

  /**
   * Met à jour un club existant
   */
  updateClub(id: number, clubData: CreateClubDTO): void {
    console.log(`✏️ Mise à jour du club ${id}:`, clubData);
    
    const updateData: UpdateClubDTO = { ...clubData, id };
    
    this.clubService.updateClub(id, updateData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (club) => {
        console.log('✅ Club mis à jour avec succès:', club);
        const index = this.clubs.findIndex(c => c.idClub === id);
        if (index !== -1) {
          this.clubs[index] = club;
        }
        this.hideForm();
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour club:', error);
        this.error = error.message || 'Erreur lors de la mise à jour du club';
      }
    });
  }

  /**
   * Supprime un club
   */
  deleteClub(club: Club): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le club "${club.nom}" ?`)) {
      console.log('❌ Suppression annulée par l\'utilisateur');
      return;
    }

    console.log('🗑️ Suppression du club:', club);
    
    this.clubService.deleteClub(club.idClub).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log('✅ Club supprimé avec succès');
        this.clubs = this.clubs.filter(c => c.idClub !== club.idClub);
      },
      error: (error) => {
        console.error('❌ Erreur suppression club:', error);
        this.error = error.message || 'Erreur lors de la suppression du club';
      }
    });
  }

  /**
   * Recharge la liste des clubs
   */
  refreshClubs(): void {
    console.log('🔄 Rechargement manuel des clubs');
    this.loadClubs();
  }

  /**
   * Marque tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  /**
   * Vérifie si un champ du formulaire a une erreur
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.clubForm.get(fieldName);
    return field?.touched && field?.errors?.[errorType];
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.clubForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['email']) {
        return 'Email invalide';
      }
      if (field.errors['pattern']) {
        return 'Format invalide';
      }
    }
    
    return '';
  }
}
