import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClubService } from '../../services/club';
import { BuddyService } from '../../services/buddy.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { BuddyMatchStatus } from '../../models/buddy.models';

// Interface pour les membres du club
interface ClubMember {
  id: number;
  nom: string;
  email: string;
  avatar?: string;
  role?: string;
  niveau?: string;
}

// Interface pour les clubs
interface Club {
  idClub: number;
  nom: string;
  description: string;
  niveau: string;
  capacityMax: number;
  status: string;
  members?: ClubMember[];
}

// Enum pour les niveaux
enum NiveauCible {
  DEBUTANT = 'DEBUTANT',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  AVANCE = 'AVANCE'
}

@Component({
  selector: 'app-user-buddy-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-buddy-request.component.html',
  styleUrls: ['./user-buddy-request.component.scss']
})
export class UserBuddyRequestComponent implements OnInit, OnDestroy {
  buddyRequestForm: FormGroup;
  clubs: Club[] = [];
  availableMembers: ClubMember[] = [];
  loading = true;
  submitting = false;
  error: string | null = null;
  success = false;
  currentUser: any = null;
  selectedClubId: number | null = null;
  
  // Enums pour le template
  readonly NiveauCible = NiveauCible;
  readonly niveauOptions = [
    { value: NiveauCible.DEBUTANT, label: 'Beginner', icon: '🌱', description: 'I\'m starting and want to learn the basics' },
    { value: NiveauCible.INTERMEDIAIRE, label: 'Intermediate', icon: '🌿', description: 'I have basics and want to improve' },
    { value: NiveauCible.AVANCE, label: 'Advanced', icon: '🌳', description: 'I\'m comfortable and want to perfect my skills' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private clubService: ClubService,
    private buddyService: BuddyService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.buddyRequestForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('🚀 UserBuddyRequestComponent - ngOnInit started');
    console.log('🔍 Loading state initial:', this.loading);
    
    this.loadUserData();
    this.loadAvailableStudents();
    this.loadClubs();
    
    // Gérer le paramètre clubId de l'URL
    this.route.queryParams.subscribe(params => {
      const clubId = params['clubId'];
      if (clubId) {
        console.log('📝 Club ID depuis URL:', clubId);
        this.selectedClubId = parseInt(clubId);
        // Mettre le clubId dans le formulaire pour la validation
        this.buddyRequestForm.get('clubId')?.setValue(parseInt(clubId));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Crée le formulaire réactif
   */
  private createForm(): FormGroup {
    return this.fb.group({
      clubId: [null, [Validators.required]],
      partnerId: [null, [Validators.required]],
      niveauCible: [NiveauCible.INTERMEDIAIRE, [Validators.required]],
      message: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Charge les données de l'utilisateur
   */
  private loadUserData(): void {
    this.currentUser = this.userService.getCurrentUser();

    if (!this.currentUser) {
      const authUser = this.authService.currentUser();
      if (authUser) {
        const mappedUser = this.userService.getUserByEmail(authUser.email);

        if (mappedUser) {
          this.currentUser = mappedUser;
          this.userService.loginAsUser(mappedUser.id);
        } else {
          const defaultStudent = this.userService.getUsersByRole('student')[0] ?? null;
          if (defaultStudent) {
            this.currentUser = defaultStudent;
            this.userService.loginAsUser(defaultStudent.id);
          }
        }
      }
    }
    
    if (!this.currentUser) {
      this.error = 'User not connected';
      this.loading = false;
      return;
    }
    
    console.log('✅ Utilisateur connecté:', this.currentUser);
  }

  /**
   * Charge la liste des étudiants de l'application
   */
  private loadAvailableStudents(): void {
    console.log('🔍 Chargement des étudiants de l\'application...');

    const students = this.userService.getUsersByRole('student');
    this.availableMembers = students
      .filter(student => student.id !== this.currentUser?.id)
      .map(student => ({
        id: student.id,
        nom: student.nom,
        email: student.email,
        avatar: student.avatar,
        role: 'Student',
        niveau: 'Student'
      }));

    console.log('✅ Étudiants disponibles chargés:', this.availableMembers);
    this.cdr.detectChanges();
  }

  /**
   * Charge la liste des clubs
   */
  private loadClubs(): void {
    console.log('🔍 Chargement des clubs...');
    console.log('🔍 Loading state avant chargement:', this.loading);
    
    const clubsSub = this.clubService.getAllClubs().subscribe({
      next: (clubs: Club[]) => {
        console.log('✅ Clubs reçus:', clubs);
        this.clubs = clubs.filter(club => club.status === 'ACTIVE');
        this.loading = false;
        console.log('🔍 Loading state après chargement:', this.loading);
        console.log('🔍 Nombre de clubs filtrés:', this.clubs.length);
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des clubs:', error);
        this.error = 'Unable to load clubs';
        this.loading = false;
        console.log('🔍 Loading state après erreur:', this.loading);
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(clubsSub);
  }

  /**
   * Gère le changement de club sélectionné
   */
  onClubChange(): void {
    // Le partenaire provient désormais de la liste des étudiants de l'application.
    // On conserve la réinitialisation pour éviter une sélection devenue invalide.
    this.buddyRequestForm.get('partnerId')?.setValue(null);
    this.buddyRequestForm.get('partnerId')?.markAsUntouched();
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    const isValid = this.buddyRequestForm.valid && !this.submitting;
    console.log('🔍 Form validity check:', {
      valid: this.buddyRequestForm.valid,
      submitting: this.submitting,
      clubId: this.buddyRequestForm.get('clubId')?.value,
      partnerId: this.buddyRequestForm.get('partnerId')?.value,
      niveauCible: this.buddyRequestForm.get('niveauCible')?.value,
      message: this.buddyRequestForm.get('message')?.value,
      errors: this.buddyRequestForm.errors
    });
    return isValid;
  }

  /**
   * Obtient le texte d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.buddyRequestForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['maxlength']) {
        return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  /**
   * Obtient le label du niveau sélectionné
   */
  getSelectedNiveauLabel(): string {
    const niveauValue = this.buddyRequestForm.get('niveauCible')?.value;
    if (!niveauValue) return '';
    
    const niveauOption = this.niveauOptions.find(o => o.value === niveauValue);
    return niveauOption?.label || '';
  }

  /**
   * Soumet le formulaire de demande
   */
  onSubmit(): void {
  if (!this.isFormValid()) {
    return;
  }

  this.submitting = true;
  
  const formData = this.buddyRequestForm.value;
  
  // CORRECTION : Structure exacte attendue par le backend
  const buddyRequest = {
    userID_1: this.currentUser.id,                    // Changé de userId1 à userID_1
    userID_2: formData.partnerId,                      // Changé de userId2 à userID_2
    club: {                                             // Le club doit être un objet
      idClub: this.selectedClubId || formData.clubId
    },
    niveauCible: formData.niveauCible,                  // Ajout du niveau cible
    // Les champs optionnels peuvent être ajoutés si nécessaire
    // dateCreation sera géré par le backend
    // status sera "EN_ATTENTE" par défaut
    // actif sera false par défaut
  };

  console.log('📤 Envoi de la demande de buddy:', buddyRequest);
  console.log('📝 Niveau cible:', formData.niveauCible);
  console.log('📝 Message:', formData.message);

  // Appeler le service pour créer la demande
  this.buddyService.createBuddyPair(buddyRequest).subscribe({
    next: (response) => {
      console.log('✅ Demande de buddy créée:', response);
      this.success = true;
      this.submitting = false;
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/buddies']);
      }, 2000);
    },
    error: (error) => {
      console.error('❌ Erreur lors de la création de la demande:', error);
      this.error = 'Unable to send request. Please try again.';
      this.submitting = false;
    }
  });
}

  /**
   * Extrait un message d'erreur pertinent
   */
  private getErrorMessage(error: any): string {
    if (error.status === 400) {
      if (error.error?.message) {
        return error.error.message;
      }
      return 'Invalid data';
    }
    if (error.status === 409) {
      return 'A buddy request already exists for these users';
    }
    if (error.status === 403) {
      return 'You are not authorized to make this request';
    }
    return 'An error occurred. Please try again.';
  }

  /**
   * Réinitialise le formulaire
   */
  resetForm(): void {
    this.buddyRequestForm.reset();
    this.availableMembers = [];
    this.success = false;
    this.error = null;
  }

  /**
   * Retourne à la page de détails du club
   */
  goBack(): void {
    if (this.selectedClubId) {
      this.router.navigate(['/clubs', this.selectedClubId]);
    } else {
      this.router.navigate(['/clubs']);
    }
  }

  /**
   * Redirige vers les clubs
   */
  goToClubs(): void {
    this.router.navigate(['/clubs']);
  }

  /**
   * Obtient le nom du club sélectionné
   */
  getSelectedClubName(): string {
    if (this.selectedClubId) {
      // Si on vient avec un clubId, chercher dans tous les clubs
      const club = this.clubs.find(c => c.idClub === this.selectedClubId);
      return club?.nom || `Club ${this.selectedClubId}`;
    } else {
      // Mode normal: chercher dans le formulaire
      const clubId = this.buddyRequestForm.get('clubId')?.value;
      const club = this.clubs.find(c => c.idClub === clubId);
      return club?.nom || '';
    }
  }

  /**
   * Obtient la description du club sélectionné
   */
  getSelectedClubDescription(): string {
    if (this.selectedClubId) {
      const club = this.clubs.find(c => c.idClub === this.selectedClubId);
      return club?.description || '';
    } else {
      const clubId = this.buddyRequestForm.get('clubId')?.value;
      const club = this.clubs.find(c => c.idClub === clubId);
      return club?.description || '';
    }
  }

  /**
   * Obtient le nom du partenaire sélectionné
   */
  getSelectedPartnerName(): string {
    const partnerId = this.buddyRequestForm.get('partnerId')?.value;
    const partner = this.availableMembers.find(m => m.id === partnerId);
    return partner?.nom || '';
  }

  /**
   * Vérifie si un partenaire est déjà buddy avec l'utilisateur
   */
  isAlreadyBuddy(partnerId: number): boolean {
    // Cette fonction nécessiterait un appel API pour vérifier
    // Pour l'instant, on retourne false
    return false;
  }

  /**
   * Filtre les membres disponibles (exclure ceux déjà buddies)
   */
  getFilteredMembers(): ClubMember[] {
    return this.availableMembers.filter(member => !this.isAlreadyBuddy(member.id));
  }

  /**
   * Fonction de tracking pour *ngFor des clubs
   */
  trackClubId(index: number, club: Club): number {
    return club.idClub;
  }
}
