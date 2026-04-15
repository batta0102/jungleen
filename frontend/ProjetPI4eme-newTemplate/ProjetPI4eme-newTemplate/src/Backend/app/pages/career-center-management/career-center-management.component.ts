import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  CandidatureDto,
  InterviewDto,
  JobOfferDto,
  InterviewPayload,
  RecruitmentService,
  RecruitmentStatus
} from '../../services/recruitment.service';

@Component({
  selector: 'app-career-center-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './career-center-management.component.html',
  styleUrls: ['./career-center-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerCenterManagementComponent {
  readonly Math = Math;
  private readonly recruitmentService = inject(RecruitmentService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly offers = signal<JobOfferDto[]>([]);
  readonly candidatures = signal<CandidatureDto[]>([]);
  readonly interviews = signal<InterviewDto[]>([]);

  // Store original data separately
  readonly allOffers = signal<JobOfferDto[]>([]);
  readonly allCandidatures = signal<CandidatureDto[]>([]);
  readonly allInterviews = signal<InterviewDto[]>([]);

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalCandidatures = signal(0);
  readonly totalInterviews = signal(0);
  
  // Search
  readonly searchCandidature = signal('');
  readonly searchInterview = signal('');
  readonly searchOffer = signal('');

  readonly editingOfferId = signal<number | null>(null);
  readonly offerTitle = signal('');
  readonly offerContent = signal('');
  readonly offerDescription = signal('');
  readonly offerLevel = signal('Beginner');
  readonly offerExperience = signal(0);
  readonly offerActive = signal(true);

  readonly interviewCandidatureId = signal<number | null>(null);
  readonly interviewDate = signal('');
  readonly interviewType = signal('EN_LIGNE');
  readonly interviewResult = signal('EN_ATTENTE');
  readonly interviewComment = signal('');
  readonly meetLink = signal<string>('');

  readonly statusOptions: RecruitmentStatus[] = [
    'EN_ATTENTE',
    'CV_VALIDE',
    'INTERVIEW_PLANIFIEE',
    'INTERVIEW_ACCEPTEE',
    'INTERVIEW_REFUSEE',
    'TEST_EN_ATTENTE',
    'CERTIFIE',
    'REFUSE'
  ];

  readonly activeOffersCount = computed(() => this.offers().filter((offer) => offer.actif).length);
  readonly candidaturesCount = computed(() => this.candidatures().length);

  // Simple dynamic search
  readonly searchQuery = signal('');
  readonly filteredCandidatures = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allCandidatures();
    return this.allCandidatures().filter(c =>
      c.nom?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  });
  
  onSearchChange(): void {
    const query = this.searchQuery().toLowerCase().trim();
    console.log('🔍 Search changed:', query);
    console.log('🔍 Filtered results:', this.filteredCandidatures().length);
  }

  constructor() {
    this.loadData();
    // Generate meet link immediately since EN_LIGNE is default
    this.meetLink.set(this.generateMeetLink());
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      offers: this.recruitmentService.getOffers(),
      candidatures: this.recruitmentService.getCandidatures(),
      interviews: this.recruitmentService.getInterviews()
    }).subscribe({
      next: ({ offers, candidatures, interviews }) => {
        // Store original data
        this.allOffers.set(offers ?? []);
        this.allCandidatures.set(candidatures ?? []);
        this.allInterviews.set(interviews ?? []);
        
        console.log('📊 Data loaded:');
        console.log('📊 Offers:', offers?.length || 0);
        console.log('📊 Candidatures:', candidatures?.length || 0);
        console.log('📊 Interviews:', interviews?.length || 0);
        
        // Apply initial filtering
        this.loadFilteredData();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load career center data.');
        this.loading.set(false);
      }
    });
  }

  resetOfferForm(): void {
    this.editingOfferId.set(null);
    this.offerTitle.set('');
    this.offerContent.set('');
    this.offerDescription.set('');
    this.offerLevel.set('Beginner');
    this.offerExperience.set(0);
    this.offerActive.set(true);
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadFilteredData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadFilteredData();
  }

  // Search methods
  onCandidatureSearch(): void {
    console.log('🔍 Candidature search:', this.searchCandidature());
    this.currentPage.set(1);
    this.loadFilteredData();
  }

  onInterviewSearch(): void {
    console.log('🔍 Interview search:', this.searchInterview());
    this.currentPage.set(1);
    this.loadFilteredData();
  }

  onOfferSearch(): void {
    console.log('🔍 Offer search:', this.searchOffer());
    this.currentPage.set(1);
    this.loadFilteredData();
  }

  private loadFilteredData(): void {
    console.log('🔍 loadFilteredData called');
    console.log('🔍 Search candidature:', this.searchCandidature());
    console.log('🔍 Search interview:', this.searchInterview());
    console.log('🔍 Current page:', this.currentPage());
    console.log('🔍 Page size:', this.pageSize());
    
    this.loading.set(true);
    this.error.set(null);

    // Get all original data first
    const allCandidatures = this.allCandidatures();
    const allInterviews = this.allInterviews();
    const allOffers = this.allOffers();
    
    console.log('🔍 Total candidatures:', allCandidatures.length);
    console.log('🔍 Total interviews:', allInterviews.length);
    console.log('🔍 Total offers:', allOffers.length);

    // Filter data based on search terms
    const filteredCandidatures = allCandidatures.filter(c => 
      !this.searchCandidature() || 
      c.nom.toLowerCase().includes(this.searchCandidature().toLowerCase()) ||
      c.email.toLowerCase().includes(this.searchCandidature().toLowerCase())
    );

    const filteredInterviews = allInterviews.filter(i => 
      !this.searchInterview() || 
      (i.candidature?.nom.toLowerCase().includes(this.searchInterview().toLowerCase()) ||
       i.type.toLowerCase().includes(this.searchInterview().toLowerCase()))
    );

    const filteredOffers = allOffers.filter(o => 
      !this.searchOffer() || 
      o.titre.toLowerCase().includes(this.searchOffer().toLowerCase())
    );

    console.log('🔍 Filtered candidatures:', filteredCandidatures.length);
    console.log('🔍 Filtered interviews:', filteredInterviews.length);
    console.log('🔍 Filtered offers:', filteredOffers.length);

    // Apply pagination
    const candidatureStart = (this.currentPage() - 1) * this.pageSize();
    const interviewStart = (this.currentPage() - 1) * this.pageSize();
    const offerStart = (this.currentPage() - 1) * this.pageSize();

    const paginatedCandidatures = filteredCandidatures.slice(candidatureStart, candidatureStart + this.pageSize());
    const paginatedInterviews = filteredInterviews.slice(interviewStart, interviewStart + this.pageSize());
    const paginatedOffers = filteredOffers.slice(offerStart, offerStart + this.pageSize());

    console.log('🔍 Paginated candidatures:', paginatedCandidatures.length);
    console.log('🔍 Paginated interviews:', paginatedInterviews.length);
    console.log('🔍 Paginated offers:', paginatedOffers.length);

    // Update display signals
    this.candidatures.set(paginatedCandidatures);
    this.interviews.set(paginatedInterviews);
    this.offers.set(paginatedOffers);
    this.totalCandidatures.set(filteredCandidatures.length);
    this.totalInterviews.set(filteredInterviews.length);
    this.loading.set(false);
  }

  generateMeetLink(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (n: number): string => {
      let result = '';
      for (let i = 0; i < n; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
    };
    return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
  }

  onInterviewTypeChange(): void {
    if (this.interviewType() === 'EN_LIGNE') {
      this.meetLink.set(this.generateMeetLink());
    } else {
      this.meetLink.set('');
    }
  }

  editOffer(offer: JobOfferDto): void {
    this.editingOfferId.set(offer.id);
    this.offerTitle.set(offer.titre ?? '');
    this.offerContent.set(offer.contenu ?? offer.description ?? '');
    this.offerDescription.set(offer.description ?? offer.contenu ?? '');
    this.offerLevel.set(offer.niveauRequis ?? 'Beginner');
    this.offerExperience.set(offer.experienceRequise ?? 0);
    this.offerActive.set(offer.actif);
    this.message.set(null);
  }

  saveOffer(): void {
    const title = this.offerTitle().trim();
    const content = this.offerContent().trim();
    const description = this.offerDescription().trim();

    if (!title || !content || !description) {
      this.message.set('Title, summary and description are required.');
      return;
    }

    const payload = {
      titre: title,
      contenu: content,
      description,
      niveauRequis: this.offerLevel().trim() || 'Beginner',
      experienceRequise: Math.max(0, Number(this.offerExperience() || 0)),
      datePublication: new Date().toISOString().slice(0, 10),
      actif: this.offerActive()
    };

    const offerId = this.editingOfferId();
    const request$ = offerId
      ? this.recruitmentService.updateOffer(offerId, payload)
      : this.recruitmentService.createOffer(payload);

    request$.subscribe({
      next: (offer) => {
        if (offerId) {
          this.offers.update((items) => items.map((item) => (item.id === offer.id ? offer : item)));
          this.message.set('Job offering updated successfully.');
        } else {
          this.offers.update((items) => [offer, ...items]);
          this.message.set('Job offering created successfully.');
        }
        this.resetOfferForm();
      },
      error: () => {
        this.message.set('Could not save job offering.');
      }
    });
  }

  deleteOffer(offerId: number): void {
    this.recruitmentService.deleteOffer(offerId).subscribe({
      next: () => {
        this.offers.update((items) => items.filter((offer) => offer.id !== offerId));
        this.candidatures.update((items) => items.filter((item) => item.poste?.id !== offerId));
        this.message.set('Job offering deleted.');
        if (this.editingOfferId() === offerId) {
          this.resetOfferForm();
        }
      },
      error: () => {
        this.message.set('Could not delete job offering.');
      }
    });
  }

  updateStatus(candidatureId: number, statut: string): void {
    this.recruitmentService.updateStatus(candidatureId, statut as RecruitmentStatus).subscribe({
      next: (updated) => {
        this.candidatures.update((items) =>
          items.map((item) => (item.id === candidatureId ? { ...item, statut: updated.statut } : item))
        );
      }
    });
  }

  updateComment(candidature: CandidatureDto): void {
    this.recruitmentService.updateComment(candidature.id, candidature.commentaireAdmin ?? '').subscribe({
      next: (updated) => {
        this.candidatures.update((items) =>
          items.map((item) =>
            item.id === candidature.id ? { ...item, commentaireAdmin: updated.commentaireAdmin } : item
          )
        );
      }
    });
  }

  scheduleInterview(): void {
    const candidatureId = this.interviewCandidatureId();
    if (!candidatureId) {
      this.message.set('Select a candidature before scheduling an interview.');
      return;
    }

    const dateInterview = this.interviewDate();
    if (!dateInterview) {
      this.message.set('Select an interview date and time.');
      return;
    }

    const payload: InterviewPayload = {
      dateInterview: this.toBackendLocalDateTime(dateInterview),
      type: this.interviewType(),
      resultat: this.interviewResult(),
      commentaire: this.interviewComment().trim(),
      meetLink: this.interviewType() === 'EN_LIGNE' ? this.meetLink() : undefined,
      candidature: { id: candidatureId }
    };

    this.recruitmentService.createInterview(payload).subscribe({
      next: (interview) => {
        this.interviews.update((rows) => [interview, ...rows]);
        this.message.set('Interview scheduled successfully.');
        this.interviewCandidatureId.set(null);
        this.interviewDate.set('');
        this.interviewType.set('EN_LIGNE');
        this.interviewResult.set('EN_ATTENTE');
        this.interviewComment.set('');
      },
      error: () => {
        this.message.set('Could not schedule interview.');
      }
    });
  }

  private toBackendLocalDateTime(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const seconds = String(parsed.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  downloadCV(cvJson: string): void {
    try {
      const cvData = JSON.parse(cvJson);
      if (cvData.type === 'file') {
        const byteCharacters = atob(cvData.data);
        const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: cvData.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cvData.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading CV:', error);
    }
  }

  getCvName(cvJson: string): string {
    try {
      const cvData = JSON.parse(cvJson);
      return cvData.name || 'CV';
    } catch {
      return 'CV';
    }
  }

  isCvFile(cvJson: string): boolean {
    try {
      const cvData = JSON.parse(cvJson);
      return cvData.type === 'file';
    } catch {
      return false;
    }
  }
}
