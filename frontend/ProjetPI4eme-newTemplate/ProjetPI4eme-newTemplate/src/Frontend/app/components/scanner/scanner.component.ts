import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { OcrService } from '../../services/ocr.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  // États du composant
  isLoading = false;
  isAnalyzing = false;
  hasCamera = false;
  stream: MediaStream | null = null;
  
  // Données de l'image et résultats
  capturedImage: string | null = null;
  extractedText: string | null = null;
  translatedText: string | null = null;
  originalLanguage: string | null = null;
  
  // Messages d'état
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private ocrService: OcrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkCameraAvailability();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  /**
   * Vérifier si la caméra est disponible
   */
  async checkCameraAvailability(): Promise<void> {
    console.log('🔍 Début vérification caméra...');
    
    // Vérifier si l'API mediaDevices est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ API mediaDevices non disponible');
      this.hasCamera = false;
      this.errorMessage = 'Votre navigateur ne supporte pas l\'accès à la caméra';
      return;
    }
    
    try {
      // Lister les dispositifs disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📷 Dispositifs trouvés:', devices);
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📹 Caméras détectées:', videoDevices);
      
      this.hasCamera = videoDevices.length > 0;
      
      if (this.hasCamera) {
        console.log('✅ Caméra disponible, démarrage...');
        this.startCamera();
      } else {
        console.log('❌ Aucune caméra détectée');
        this.errorMessage = 'Aucune caméra détectée sur cet appareil. Vérifiez que votre caméra est bien connectée.';
      }
    } catch (error) {
      console.error('❌ Erreur vérification caméra:', error);
      this.hasCamera = false;
      this.errorMessage = 'Impossible d\'accéder à la caméra. Vérifiez les permissions dans les paramètres de votre navigateur.';
    }
  }

  /**
   * Démarrer la caméra
   */
  async startCamera(): Promise<void> {
    console.log('🎥 Tentative démarrage caméra...');
    
    try {
      // Demander l'accès à la caméra avec options spécifiques
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment'
        },
        audio: false
      });
      
      console.log('✅ Stream obtenu:', this.stream);
      
      if (this.videoElement?.nativeElement) {
        const video = this.videoElement.nativeElement;
        video.srcObject = this.stream;
        
        // Attendre que la vidéo soit chargée
        video.onloadedmetadata = () => {
          console.log('📹 Métadonnées vidéo chargées');
          video.play().then(() => {
            console.log('🎬 Lecture vidéo démarrée');
          }).catch(err => {
            console.error('❌ Erreur lecture vidéo:', err);
            this.errorMessage = 'Erreur lors de la lecture de la vidéo: ' + err.message;
          });
        };
        
        // Écouter les erreurs de vidéo
        video.onerror = (event) => {
          console.error('❌ Erreur vidéo:', event);
          this.errorMessage = 'Erreur lors du chargement de la vidéo';
        };
      }
    } catch (error: any) {
      console.error('❌ Erreur démarrage caméra:', error);
      
      // Messages d'erreur spécifiques
      if (error.name === 'NotAllowedError') {
        this.errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
      } else if (error.name === 'NotFoundError') {
        this.errorMessage = 'Aucune caméra trouvée sur cet appareil.';
      } else if (error.name === 'NotReadableError') {
        this.errorMessage = 'La caméra est déjà utilisée par une autre application.';
      } else {
        this.errorMessage = 'Impossible de démarrer la caméra: ' + error.message;
      }
    }
  }

  /**
   * Arrêter la caméra
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Prendre une photo depuis la webcam
   */
  takePhoto(): void {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) return;
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Définir les dimensions du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image actuelle de la vidéo
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir en base64
    this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
    this.clearMessages();
  }

  /**
   * Gérer l'upload d'un fichier image
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.capturedImage = reader.result as string;
        this.clearMessages();
      };
      reader.readAsDataURL(file);
    } else {
      this.errorMessage = 'Veuillez sélectionner une image valide';
    }
  }

  /**
   * Analyser l'image avec OCR
   */
  async analyzeImage(): Promise<void> {
    if (!this.capturedImage) {
      this.errorMessage = 'Veuillez d\'abord capturer ou importer une image';
      return;
    }
    
    this.isAnalyzing = true;
    this.clearMessages();
    
    try {
      console.log('Début analyse OCR...');
      
      // Convertir base64 en File
      const file = await this.base64ToFile(this.capturedImage, 'scanned-image.jpg');
      console.log('Fichier converti:', file);
      
      // Appeler l'API OCR avec traduction
      console.log('Appel API OCR...');
      const result = await this.ocrService.extraireEtTraduire(file).toPromise();
      
      console.log('Résultat reçu:', result);
      
      if (result) {
        this.extractedText = result.texteOriginal;
        this.translatedText = result.traduction;
        this.originalLanguage = result.langueSource;
        this.successMessage = 'Analyse réussie !';
        
        console.log('Texte extrait:', this.extractedText);
        console.log('Traduction:', this.translatedText);
      } else {
        console.error('Résultat vide');
        this.errorMessage = 'Le résultat de l\'analyse est vide';
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      this.errorMessage = 'Erreur lors de l\'analyse de l\'image';
    } finally {
      console.log('Fin analyse, isAnalyzing =', this.isAnalyzing);
      this.isAnalyzing = false;
      console.log('isAnalyzing mis à false');
      
      // Forcer la détection de changements pour mettre à jour l'interface
      this.cdr.detectChanges();
      console.log('Change detection forcée');
    }
  }

  /**
   * Ajouter le mot au vocabulaire
   */
  async addToVocabulary(): Promise<void> {
    if (!this.extractedText || !this.translatedText) {
      this.errorMessage = 'Aucun texte à ajouter au vocabulaire';
      return;
    }
    
    this.isLoading = true;
    this.clearMessages();
    
    try {
      const userId = this.ocrService.getCurrentUserId();
      const clubId = 4; // Club ID par défaut ou depuis le route
      
      await this.ocrService.ajouterAuVocabulaire(
        userId, 
        clubId, 
        this.extractedText.trim(), 
        this.translatedText.trim()
      ).toPromise();
      
      this.successMessage = 'Mot ajouté au vocabulaire avec succès !';
    } catch (error) {
      console.error('Erreur ajout vocabulaire:', error);
      this.errorMessage = 'Erreur lors de l\'ajout au vocabulaire';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Partager au club
   */
  async shareToClub(): Promise<void> {
    if (!this.extractedText || !this.translatedText) {
      this.errorMessage = 'Aucun contenu à partager';
      return;
    }
    
    const confirmShare = confirm(`Voulez-vous partager ce scan dans le forum du club ?\n\n"${this.extractedText}" → "${this.translatedText}"`);
    
    if (!confirmShare) return;
    
    this.isLoading = true;
    this.clearMessages();
    
    try {
      const userId = this.ocrService.getCurrentUserId();
      const clubId = 4;
      const message = `📸 Nouveau scan : ${this.extractedText} → ${this.translatedText}`;
      
      await this.ocrService.publierMessageClub(clubId, userId, message).toPromise();
      
      this.successMessage = 'Message partagé dans le forum avec succès !';
      
      // Rediriger vers le forum après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/clubs', clubId]);
      }, 2000);
    } catch (error) {
      console.error('Erreur partage:', error);
      this.errorMessage = 'Erreur lors du partage dans le forum';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Réinitialiser le composant
   */
  reset(): void {
    this.capturedImage = null;
    this.extractedText = null;
    this.translatedText = null;
    this.originalLanguage = null;
    this.clearMessages();
  }

  /**
   * Effacer les messages d'erreur et succès
   */
  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Convertir base64 en File
   */
  private async base64ToFile(base64: string, filename: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/jpeg' });
  }
}
