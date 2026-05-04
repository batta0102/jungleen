import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ScannerComponent } from './scanner.component';
import { OcrService } from '../../services/ocr.service';

// Déclarations globales pour Jasmine
declare const jasmine: any;
declare const spyOn: any;
declare const fail: any;

describe('ScannerComponent', () => {
  let component: ScannerComponent;
  let fixture: ComponentFixture<ScannerComponent>;
  let ocrServiceSpy: any;
  let routerSpy: any;

  const mockOcrResult = {
    texteOriginal: 'Hello World',
    traduction: 'Bonjour le monde',
    langueSource: 'en'
  };

  beforeEach(async () => {
    const ocrSpy = jasmine.createSpyObj('OcrService', [
      'extraireEtTraduire',
      'ajouterAuVocabulaire',
      'publierMessageClub',
      'getCurrentUserId'
    ]);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ScannerComponent],
      providers: [
        { provide: OcrService, useValue: ocrSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerComponent);
    component = fixture.componentInstance;
    ocrServiceSpy = TestBed.inject(OcrService);
    routerSpy = TestBed.inject(Router);

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jasmine.createSpy('getUserMedia').and.returnValue(Promise.resolve({
          getTracks: () => [{ stop: () => {} }]
        })),
        enumerateDevices: jasmine.createSpy('enumerateDevices').and.returnValue(Promise.resolve([
          { kind: 'videoinput', deviceId: 'camera1' }
        ]))
      },
      writable: true
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBe(false);
    expect(component.isAnalyzing).toBe(false);
    expect(component.hasCamera).toBe(true); // Camera should be detected after ngOnInit
    expect(component.capturedImage).toBeNull();
    expect(component.extractedText).toBeNull();
    expect(component.translatedText).toBeNull();
  });

  it('should check camera availability on init', async () => {
    await fixture.whenStable();
    expect(component.hasCamera).toBe(true);
  });

  it('should handle camera not available', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jasmine.createSpy('getUserMedia').and.returnValue(Promise.reject(new Error('Camera not available'))),
        enumerateDevices: jasmine.createSpy('enumerateDevices').and.returnValue(Promise.resolve([]))
      },
      writable: true
    });

    component.ngOnInit();
    await fixture.whenStable();
    expect(component.hasCamera).toBe(false);
    expect(component.errorMessage).toContain('caméra');
  });

  it('should take photo when video element is available', () => {
    // Mock video and canvas elements
    const mockVideo = {
      videoWidth: 1280,
      videoHeight: 720,
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      onloadedmetadata: null,
      onerror: null
    };
    const mockCanvas = {
      width: 1280,
      height: 720,
      getContext: jasmine.createSpy('getContext').and.returnValue({
        drawImage: jasmine.createSpy('drawImage'),
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/jpeg;base64,mock')
      })
    } as any;

    // Mock ElementRef
    component.videoElement = { nativeElement: mockVideo } as any;
    component.canvasElement = { nativeElement: mockCanvas } as any;

    component.takePhoto();

    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockVideo.play).toHaveBeenCalled();
    expect(mockCanvas.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1280, 720);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
    expect(component.capturedImage).toBe('data:image/jpeg;base64,mock');
  });

  it('should analyze image with OCR', async () => {
    component.capturedImage = 'data:image/jpeg;base64,mock';
    ocrServiceSpy.extraireEtTraduire.and.returnValue(of(mockOcrResult));

    component.analyzeImage();
    await fixture.whenStable();

    expect(component.isAnalyzing).toBe(false);
    expect(component.extractedText).toBe('Hello World');
    expect(component.translatedText).toBe('Bonjour le monde');
    expect(component.successMessage).toBe('Analyse réussie !');
  });

  it('should handle OCR analysis error', async () => {
    component.capturedImage = 'data:image/jpeg;base64,mock';
    ocrServiceSpy.extraireEtTraduire.and.returnValue(throwError(() => new Error('OCR Error')));

    component.analyzeImage();
    await fixture.whenStable();

    expect(component.isAnalyzing).toBe(false);
    expect(component.errorMessage).toBe('Erreur lors de l\'analyse de l\'image');
  });

  it('should handle empty image', () => {
    component.capturedImage = null;
    component.analyzeImage();
    expect(component.errorMessage).toBe('Veuillez d\'abord capturer ou importer une image');
  });

  it('should add to vocabulary', async () => {
    component.extractedText = 'Hello';
    component.translatedText = 'Bonjour';
    ocrServiceSpy.getCurrentUserId.and.returnValue(1);
    ocrServiceSpy.ajouterAuVocabulaire.and.returnValue(of({ success: true }));

    component.addToVocabulary();
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(component.successMessage).toBe('Mot ajouté au vocabulaire avec succès !');
  });

  it('should handle vocabulary add error', async () => {
    component.extractedText = 'Hello';
    component.translatedText = 'Bonjour';
    ocrServiceSpy.getCurrentUserId.and.returnValue(1);
    ocrServiceSpy.ajouterAuVocabulaire.and.returnValue(throwError(() => new Error('Vocab Error')));

    component.addToVocabulary();
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('Erreur lors de l\'ajout au vocabulaire');
  });

  it('should handle empty text for vocabulary', () => {
    component.extractedText = '';
    component.translatedText = 'Bonjour';
    component.addToVocabulary();
    expect(component.errorMessage).toBe('Aucun texte à ajouter au vocabulaire');
  });

  it('should share to club', async () => {
    component.extractedText = 'Hello';
    component.translatedText = 'Bonjour';
    ocrServiceSpy.getCurrentUserId.and.returnValue(1);
    ocrServiceSpy.publierMessageClub.and.returnValue(of({ success: true }));

    spyOn(window, 'confirm').and.returnValue(true);

    component.shareToClub();
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(component.successMessage).toBe('Message partagé dans le forum avec succès !');
  });

  it('should handle share to club error', async () => {
    component.extractedText = 'Hello';
    component.translatedText = 'Bonjour';
    ocrServiceSpy.getCurrentUserId.and.returnValue(1);
    ocrServiceSpy.publierMessageClub.and.returnValue(throwError(() => new Error('Share Error')));

    spyOn(window, 'confirm').and.returnValue(true);

    component.shareToClub();
    await fixture.whenStable();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('Erreur lors du partage dans le forum');
  });

  it('should handle empty text for sharing', () => {
    component.extractedText = '';
    component.translatedText = 'Bonjour';
    component.shareToClub();
    expect(component.errorMessage).toBe('Aucun texte à partager dans le forum');
  });

  it('should stop camera when component is destroyed', () => {
    const mockTrack = { stop: jasmine.createSpy('stop') };
    const mockStream = { getTracks: () => [mockTrack] };

    // Mock stream
    component.stream = mockStream as any;

    // Destroy component
    component.ngOnDestroy();

    expect(mockTrack.stop).toHaveBeenCalled();
  });
});
