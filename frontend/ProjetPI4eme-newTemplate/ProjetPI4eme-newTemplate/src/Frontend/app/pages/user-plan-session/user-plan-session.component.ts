import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BuddySessionService } from '../../services/buddy-session.service';
import { BuddyService } from '../../services/buddy.service';
import { UserService } from '../../services/user.service';
import { BuddyPair, BuddyMatchStatus, CreateSessionDTO, SessionStatus, SatisfactionLevel, BuddySession, ConfirmSessionDTO, } from '../../models/buddy.models';


@Component({
  selector: 'app-user-plan-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-plan-session.component.html',
  styleUrls: ['./user-plan-session.component.scss']
})
export class UserPlanSessionComponent implements OnInit, OnDestroy {
  sessionForm: FormGroup;
  buddy: BuddyPair | null = null;
  buddyId: number | null = null; 
  loading = true;
  submitting = false;
  error: string | null = null;
  success = false;
  currentUser: any = null;
  countdown = 2;
  private countdownInterval: any;
  BuddyMatchStatus = BuddyMatchStatus;
  
  // Options prédéfinies pour la durée
  durationOptions = [
    { value: 30, label: '30 minutes', icon: '⚡' },
    { value: 45, label: '45 minutes', icon: '🕐' },
    { value: 60, label: '1 heure', icon: '🕑' },
    { value: 90, label: '1h30', icon: '🕐' },
    { value: 120, label: '2 heures', icon: '🕑' }
  ];

  // Sujets suggérés
  subjectSuggestions = [
    'Conversation libre',
    'Pratique de la prononciation',
    'Vocabulaire professionnel',
    'Préparation à un examen',
    'Discussion culturelle',
    'Exercices de grammaire',
    'Jeux de rôle',
    'Analyse de textes'
  ];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private buddyService: BuddyService,
    private sessionService: BuddySessionService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.sessionForm = this.createForm();
  }

  ngOnInit(): void {
  // Auto-login pour le développement
  if (!this.userService.isAuthenticated()) {
    console.log('🚀 Auto-login as user 1 for development');
    this.userService.loginAsUser(1);
  }
  
  // 🔍 DÉBOGAGE COMPLET DE L'URL
  console.log('🔍 URL complète:', window.location.href);
  console.log('🔍 Chemin:', window.location.pathname);
  
  // ✅ RÉCUPÉRER L'ID DU BUDDY DEPUIS L'URL
  const paramMap = this.route.snapshot.paramMap;
  console.log('🔍 paramMap:', paramMap);
  console.log('🔍 Clés dans paramMap:', Array.from(paramMap.keys));
  console.log('🔍 Valeur de id:', paramMap.get('id'));
  
  let buddyId = paramMap.get('id');
  
  // 🔄 Alternative : essayer avec params si paramMap ne fonctionne pas
  if (!buddyId) {
    console.log('🔄 paramMap n\'a pas fonctionné, essai avec params...');
    const params = this.route.snapshot.params;
    console.log('🔍 params:', params);
    console.log('🔍 Clés dans params:', Object.keys(params));
    buddyId = params['id'];
    console.log('🔍 ID du buddy depuis params:', buddyId);
  }
  
  console.log('🔍 ID du buddy final:', buddyId);
  
  if (!buddyId) {
    console.error('❌ ID du buddy non trouvé dans l\'URL');
    console.error('❌ paramMap complet:', paramMap);
    this.error = 'ID de buddy non spécifié';
    this.loading = false;
    return;
  }
  
  // Stocker l'ID pour l'utiliser plus tard
  this.buddyId = +buddyId;  // Convertir en number
  console.log('🔍 buddyId stocké:', this.buddyId);
  
  // Lire le paramètre date de l'URL
  this.route.queryParams.subscribe(params => {
    if (params['date']) {
      const suggestedDate = new Date(params['date']);
      console.log('📅 Date suggérée reçue:', suggestedDate);
      
      // Convertir la date au format requis
      const year = suggestedDate.getFullYear();
      const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
      const day = String(suggestedDate.getDate()).padStart(2, '0');
      const hours = String(suggestedDate.getHours()).padStart(2, '0');
      const minutes = String(suggestedDate.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('📅 Date formatée:', formattedDate);
      
      this.sessionForm.patchValue({
        dateSession: formattedDate
      });
    }
  });
  
  this.loadUserData();
  this.loadBuddyDetails();  // Cette méthode doit utiliser this.buddyId
}

  ngOnDestroy(): void {
    this.stopCountdown();
    this.subscriptions.unsubscribe();
  }

  /**
   * Crée le formulaire réactif
   */
  private createForm(): FormGroup {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convertir la date d'aujourd'hui en format datetime-local
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}T00:00`;
    
    return this.fb.group({
      dateSession: [formattedToday, [Validators.required]],
      dureeMinutes: [60, [Validators.required, Validators.min(15), Validators.max(180)]],
      sujet: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      lieu: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Charge les données de l'utilisateur
   */
  private loadUserData(): void {
    this.currentUser = this.userService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }
    
    console.log('✅ Utilisateur connecté:', this.currentUser);
  }

  /**
   * Charge les détails du buddy
   */
  loadBuddyDetails(): void {
  if (!this.buddyId) {
    console.error('❌ buddyId non défini');
    return;
  }

  console.log(`🔍 Chargement des détails du buddy ${this.buddyId}`);
  
  const buddySub = this.buddyService.getBuddyPairById(this.buddyId).subscribe({
    next: (buddy: BuddyPair) => {
      console.log('✅ Buddy reçu:', buddy);
      console.log('🔍 ID du buddy reçu:', buddy.idPair);
      console.log('🔍 Statut du buddy reçu:', buddy.status);
      console.log('🔍 BuddyMatchStatus.ACTIVE:', BuddyMatchStatus.ACTIVE);
      console.log('🔍 Comparaison status !== BuddyMatchStatus.ACTIVE:', buddy.status !== BuddyMatchStatus.ACTIVE);
      
      this.buddy = buddy;
      
      if (buddy.status !== BuddyMatchStatus.ACTIVE) {
        console.error('❌ Buddy non actif, statut:', buddy.status);
        this.error = 'Impossible de planifier une session : ce buddy n\'est pas actif';
        this.loading = false;
        return;
      }
      
      console.log('✅ Buddy actif, arrêt du loading');
      this.loading = false;
      this.cdr.detectChanges(); // Forcer la détection de changement
    },
    error: (error: any) => {
      console.error('❌ Erreur lors du chargement du buddy:', error);
      
      // Fallback vers des données mock pour le développement
      console.log('🔄 Utilisation des données mock pour le développement');
      this.buddy = this.createMockBuddy(this.buddyId!);
      this.loading = false;
      this.cdr.detectChanges(); // Forcer la détection de changement
    }
  });

  this.subscriptions.add(buddySub);
}

  /**
   * Crée un buddy mock pour le développement
   */
  private createMockBuddy(buddyId: number): BuddyPair {
    const currentUser = this.userService.getCurrentUser();
    return {
      idPair: buddyId,
      userID_1: currentUser?.id || 1,
      userID_2: currentUser?.id === 1 ? 2 : 1,
      clubId: 1,
      status: BuddyMatchStatus.ACTIVE,
      dateCreation: new Date(),
      dateActivation: new Date(),
      user1: {
        id: currentUser?.id || 1,
        nom: currentUser?.nom || 'Utilisateur 1',
        email: currentUser?.email || 'user1@example.com',
        avatar: currentUser?.avatar || '👤'
      },
      user2: {
        id: currentUser?.id === 1 ? 2 : 1,
        nom: 'Alice Martin',
        email: 'alice@example.com',
        avatar: '👩‍🎓'
      },
      club: {
        idClub: 1,
        nom: 'English Club'
      }
    };
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    return this.sessionForm.valid && !this.submitting;
  }

  /**
   * Obtient le texte d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.sessionForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['min']) {
        return `Minimum ${field.errors['min'].min} minutes`;
      }
      if (field.errors['max']) {
        return `Maximum ${field.errors['max'].max} minutes`;
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['maxlength']) {
        return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  /**
   * Soumet le formulaire de session
   */
  onSubmit(): void {
    console.log('🚀 onSubmit appelé');
    console.log('🔍 isFormValid():', this.isFormValid());
    console.log('🔍 Formulaire valide?', this.sessionForm.valid);
    console.log('🔍 En cours de soumission?', this.submitting);
    console.log('🔍 Valeurs formulaire:', this.sessionForm.value);
    
  if (!this.isFormValid()) {
    console.error('❌ Formulaire invalide ou déjà en soumission');
    return;
  }

  // 🔍 DÉBOGAGE - Vérifier l'état de buddy
  console.log('🔍 Vérification buddy:', this.buddy);
  console.log('🔍 buddy existe?', this.buddy !== null);
  console.log('🔍 idPair:', this.buddy?.idPair);
  console.log('🔍 Type idPair:', typeof this.buddy?.idPair);

  if (!this.buddy || !this.buddy.idPair) {
    console.error('❌ ERREUR: buddy ou idPair est null/undefined');
    this.error = 'Impossible de récupérer l\'ID du buddy';
    this.submitting = false;
    return;
  }

  this.submitting = true;
  this.error = null;

  const formValues = this.sessionForm.value;
  
  // ✅ FORMATAGE CORRECT POUR LocalDateTime
  const dateValue = new Date(formValues.dateSession);
  
  // Format: yyyy-MM-ddTHH:mm:ss
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  const hours = String(dateValue.getHours()).padStart(2, '0');
  const minutes = String(dateValue.getMinutes()).padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:00`;
  
  console.log('📅 Date formatée:', formattedDate);
  
  // 🔧 RETOUR AU FORMAT NORMAL : buddyPair: {idPair: X}
  // Le backend devrait normalement accepter ce format avec @ManyToOne
  const sessionData = {
    buddyPair: {
      idPair: this.buddy.idPair
    },
    date: formattedDate,
    duree: formValues.dureeMinutes,
    sujet: formValues.sujet,
    lieu: formValues.lieu || null,
    notes: formValues.description || null,
    status: "PLANIFIEE",
    confirmeParUtilisateur1: false,
    confirmeParUtilisateur2: false,
    satisfactionUtilisateur1: null,
    satisfactionUtilisateur2: null
  };

  console.log('📤 Envoi session:', JSON.stringify(sessionData, null, 2));

  this.sessionService.createSession(sessionData).subscribe({
    next: (response: any) => {
      console.log('✅ Session planifiée:', response);
      this.success = true;
      this.submitting = false;
      
      setTimeout(() => {
        this.router.navigate(['/buddies', this.buddy!.idPair]);
      }, 2000);
    },
    error: (error: any) => {
      console.error('❌ Erreur:', error);
      this.error = this.getErrorMessage(error);
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
      return 'Données invalides';
    }
    if (error.status === 403) {
      return 'Vous n\'êtes pas autorisé à planifier cette session';
    }
    if (error.status === 409) {
      return 'Une session existe déjà à cette date pour ce buddy';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Démarre le compte à rebours
   */
  private startCountdown(): void {
    this.countdown = 2;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.cdr.detectChanges();
      
      if (this.countdown <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  /**
   * Arrête le compte à rebours
   */
  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Réinitialise le formulaire
   */
  resetForm(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.sessionForm.reset({
      dateSession: today,
      dureeMinutes: 60,
      sujet: '',
      lieu: '',
      description: ''
    });
    
    this.success = false;
    this.error = null;
  }

  /**
   * Retourne à la page du buddy
   */
  goBack(): void {
    if (this.buddy) {
      this.router.navigate(['/buddies', this.buddy.idPair]);
    } else {
      this.router.navigate(['/buddies']);
    }
  }

  /**
   * Obtient le nom du partenaire
   */
  getPartnerName(): string {
    if (!this.buddy || !this.currentUser) return 'Inconnu';
    
    if (this.buddy.userID_1 === this.currentUser.id && this.buddy.user2) {
      return this.buddy.user2.nom;
    } else if (this.buddy.userID_2 === this.currentUser.id && this.buddy.user1) {
      return this.buddy.user1.nom;
    }
    
    return 'Inconnu';
  }

  /**
   * Obtient l'avatar du partenaire
   */
  getPartnerAvatar(): string {
    if (!this.buddy || !this.currentUser) return '👤';
    
    if (this.buddy.userID_1 === this.currentUser.id && this.buddy.user2?.avatar) {
      return this.buddy.user2.avatar;
    } else if (this.buddy.userID_2 === this.currentUser.id && this.buddy.user1?.avatar) {
      return this.buddy.user1.avatar;
    }
    
    return '👤';
  }

  /**
   * Obtient le nom du club
   */
  getClubName(): string {
    return this.buddy?.club?.nom || 'Club non spécifié';
  }

  /**
   * Sélectionne une durée prédéfinie
   */
  selectDuration(duration: number): void {
    this.sessionForm.get('dureeMinutes')?.setValue(duration);
  }

  /**
   * Sélectionne un sujet suggéré
   */
  selectSubject(subject: string): void {
    this.sessionForm.get('sujet')?.setValue(subject);
  }

  /**
   * Vérifie si la date sélectionnée est dans le passé
   */
  isDateInPast(): boolean {
    const selectedDate = this.sessionForm.get('dateSession')?.value;
    if (!selectedDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    
    return selected < today;
  }

  /**
   * Obtient la date minimale (aujourd'hui)
   */
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Obtient la date maximale (30 jours dans le futur)
   */
  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  }

  /**
   * Formate la durée pour l'affichage
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes === 60) {
      return '1 heure';
    } else if (minutes < 120) {
      return `1h${minutes - 60}`;
    } else {
      return `${Math.floor(minutes / 60)}h${minutes % 60}`;
    }
  }

  /**
   * Vérifie si l'heure est valide (pas la nuit)
   */
  isValidTime(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 8 && hour <= 22; // Entre 8h et 22h
  }

  /**
   * Ajoute un message d'avertissement pour les dates passées
   */
  getDateWarning(): string {
    if (this.isDateInPast()) {
      return '⚠️ Attention : vous avez sélectionné une date dans le passé';
    }
    
    const selectedDate = this.sessionForm.get('dateSession')?.value;
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!this.isValidTime(date)) {
        return '⚠️ Attention : cette session est prévue en dehors des heures habituelles (8h-22h)';
      }
    }
    
    return '';
  }

  /**
   * Vérifie si la date actuelle vient d'une suggestion
   */
  hasSuggestedDate(): boolean {
    const selectedDate = this.sessionForm.get('dateSession')?.value;
    if (!selectedDate) return false;
    
    // Vérifier si la date correspond à une suggestion (simple vérification)
    const urlParams = new URLSearchParams(window.location.search);
    const suggestedDate = urlParams.get('date');
    
    if (suggestedDate) {
      const suggested = new Date(suggestedDate);
      
      // Convertir la date suggérée au format datetime-local
      const year = suggested.getFullYear();
      const month = String(suggested.getMonth() + 1).padStart(2, '0');
      const day = String(suggested.getDate()).padStart(2, '0');
      const hours = String(suggested.getHours()).padStart(2, '0');
      const minutes = String(suggested.getMinutes()).padStart(2, '0');
      
      const formattedSuggested = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      return selectedDate === formattedSuggested;
    }
    
    return false;
  }

  /**
   * Efface la date suggérée pour permettre à l'utilisateur de choisir une autre date
   */
  clearSuggestedDate(): void {
    // Remplacer l'URL pour enlever le paramètre de date
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    
    // Réinitialiser la date du formulaire à la date actuelle au format datetime-local
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}T00:00`;
    
    this.sessionForm.patchValue({
      dateSession: formattedToday
    });
    
    console.log('📅 Date suggérée effacée, utilisateur peut choisir une autre date');
  }
}
