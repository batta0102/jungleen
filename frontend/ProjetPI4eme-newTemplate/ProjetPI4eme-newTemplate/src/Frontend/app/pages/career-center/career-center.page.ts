import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CareerCenterApiService,
  CandidaturePayload,
  JobOfferDto
} from '../../core/services/career-center-api.service';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded
}

@Component({
  selector: 'app-career-center-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './career-center.page.html',
  styleUrl: './career-center.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerCenterPage {
  private readonly careerApi = inject(CareerCenterApiService);

  readonly offers = signal<JobOfferDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly applyMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  // Pagination
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalOffers = signal(0);
  
  // Search
  readonly searchQuery = signal('');

  readonly selectedOffer = signal<JobOfferDto | null>(null);
  readonly applicantName = signal('');
  readonly applicantEmail = signal('');
  readonly applicantCv = signal('');
  readonly uploadedCvFile = signal<UploadedFile | null>(null);
  readonly cvUploadError = signal<string | null>(null);

  readonly activeOffers = computed(() => {
    const allOffers = this.offers();
    const searchQuery = this.searchQuery().toLowerCase().trim();
    
    if (!searchQuery) {
      return allOffers.filter(offer => offer.actif);
    }
    
    return allOffers.filter(offer => 
      offer.actif && (
        offer.titre?.toLowerCase().includes(searchQuery) ||
        offer.description?.toLowerCase().includes(searchQuery) ||
        offer.contenu?.toLowerCase().includes(searchQuery) ||
        offer.niveauRequis?.toLowerCase().includes(searchQuery)
      )
    );
  });
  readonly math = computed(() => Math);

  constructor() {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.careerApi.getJobOffers().subscribe({
      next: (offers) => {
        this.offers.set(offers ?? []);
        this.totalOffers.set(offers?.length || 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load job offerings.');
        this.loading.set(false);
      }
    });
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  openApply(offer: JobOfferDto): void {
    this.selectedOffer.set(offer);
    this.applyMessage.set(null);
    this.applicantName.set('');
    this.applicantEmail.set('');
    this.applicantCv.set('');
    this.uploadedCvFile.set(null);
    this.cvUploadError.set(null);
  }

  closeApply(): void {
    this.selectedOffer.set(null);
    this.submitting.set(false);
  }

  testUploadClick(): void {
    console.log('🖱️ Upload button clicked!');
    const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
    console.log('📁 File input element:', fileInput);
    
    if (fileInput) {
      console.log('✅ File input found, triggering click...');
      fileInput.click();
    } else {
      console.error('❌ File input not found!');
    }
  }

  onCvFileSelected(event: Event): void {
    console.log('🔍 File upload triggered', event);
    
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    console.log('📁 File selected:', {
      file: file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      filesLength: fileInput.files?.length
    });
    
    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    console.log('🔍 File type validation:', {
      fileType: file.type,
      allowedTypes: allowedTypes,
      isAllowed: allowedTypes.includes(file.type)
    });
    
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      this.cvUploadError.set('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      this.uploadedCvFile.set(null);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    console.log('🔍 File size validation:', {
      fileSize: file.size,
      maxSize: maxSize,
      isValidSize: file.size <= maxSize
    });
    
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      this.cvUploadError.set('File size must be less than 5MB');
      this.uploadedCvFile.set(null);
      return;
    }

    console.log('✅ File validation passed, starting base64 conversion...');
    this.cvUploadError.set(null);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      console.log('📖 File read completed');
      const base64Data = reader.result as string;
      console.log('🔍 Base64 data length:', base64Data.length);
      
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data.split(',')[1] // Remove data:mime;base64, prefix
      };
      
      console.log('💾 Storing uploaded file:', {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        dataLength: uploadedFile.data.length
      });
      
      this.uploadedCvFile.set(uploadedFile);
      this.applicantCv.set(uploadedFile.name); // Store filename in cv field
      console.log('✅ File upload completed successfully');
    };
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      this.cvUploadError.set('Failed to read file. Please try again.');
      this.uploadedCvFile.set(null);
    };
    
    reader.readAsDataURL(file);
  }

  removeCvFile(): void {
    this.uploadedCvFile.set(null);
    this.applicantCv.set('');
    this.cvUploadError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  testSubmitClick(): void {
    console.log('🖱️ Submit button clicked!');
    console.log('📊 Current form state:', {
      selectedOffer: this.selectedOffer(),
      applicantName: this.applicantName(),
      applicantEmail: this.applicantEmail(),
      applicantCv: this.applicantCv(),
      uploadedCvFile: this.uploadedCvFile(),
      submitting: this.submitting(),
      cvUploadError: this.cvUploadError()
    });
    
    // Now call the actual submit method
    this.submitApplication();
  }

  submitApplication(): void {
    console.log('🚀 Submit application started');
    
    const offer = this.selectedOffer();
    if (!offer) {
      console.error('❌ No offer selected');
      return;
    }

    const nom = this.applicantName().trim();
    const email = this.applicantEmail().trim();
    const uploadedFile = this.uploadedCvFile();

    console.log('📋 Form data:', {
      nom,
      email,
      uploadedFile: uploadedFile ? {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        dataLength: uploadedFile.data.length
      } : null,
      cvText: this.applicantCv().trim()
    });

    // Validate either uploaded file or text CV
    if (!nom || !email) {
      console.error('❌ Missing required fields:', { nom, email });
      this.applyMessage.set('Please fill in all required fields.');
      return;
    }

    if (!uploadedFile && !this.applicantCv().trim()) {
      console.error('❌ No CV provided');
      this.applyMessage.set('Please either upload a CV file or provide CV text/link.');
      return;
    }

    // Prepare CV data - use uploaded file if available, otherwise use text
    let cvData: string;
    if (uploadedFile) {
      // Create a JSON object with file info and base64 data
      cvData = JSON.stringify({
        type: 'file',
        name: uploadedFile.name,
        mimeType: uploadedFile.type,
        size: uploadedFile.size,
        data: uploadedFile.data
      });
      console.log('📁 Using uploaded file CV data, length:', cvData.length);
    } else {
      // Use text/link input
      cvData = JSON.stringify({
        type: 'text',
        content: this.applicantCv().trim()
      });
      console.log('📝 Using text CV data, length:', cvData.length);
    }

    const payload: CandidaturePayload = {
      nom,
      email,
      cv: cvData,
      poste: { id: offer.id }
    };

    console.log('📤 Submitting payload:', {
      ...payload,
      cv: payload.cv.length > 100 ? payload.cv.substring(0, 100) + '...' : payload.cv
    });

    this.submitting.set(true);
    this.applyMessage.set(null);

    this.careerApi.createCandidature(payload).subscribe({
      next: (response) => {
        console.log('✅ Application submitted successfully:', response);
        this.applyMessage.set(`Application submitted for "${offer.titre}".`);
        this.submitting.set(false);
        this.closeApply();
      },
      error: (error) => {
        console.error('❌ Application submission failed:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.applyMessage.set('Could not submit your application. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
