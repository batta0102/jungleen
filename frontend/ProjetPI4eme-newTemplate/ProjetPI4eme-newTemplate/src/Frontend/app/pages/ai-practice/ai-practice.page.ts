import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AiChatService,
  ChatMessage,
  ChatResponse,
  Correction,
  Script,
  ScriptLine,
  UserMemory,
} from '../../core/ai/ai-chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { GamificationService } from '../../core/gamification/gamification.service';
import { StatsTrackerService } from '../../core/gamification/stats-tracker.service';
import { LeaderboardService } from '../../core/gamification/leaderboard.service';
import lottie, { AnimationItem } from 'lottie-web';

type AppMode = 'chat' | 'voice' | 'script';

interface ReadingScore {
  lineIndex: number;
  score: number;
  feedback: string;
  corrections: Correction[];
}

@Component({
  selector: 'app-ai-practice-page',
  imports: [CommonModule],
  templateUrl: './ai-practice.page.html',
  styleUrl: './ai-practice.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPracticePage implements OnInit, AfterViewChecked, OnDestroy {
  private readonly aiService = inject(AiChatService);
  private readonly authService = inject(AuthService);
  private readonly gami = inject(GamificationService);
  private readonly statsTracker = inject(StatsTrackerService);
  private readonly leaderboard = inject(LeaderboardService);

  /** Tracks when the current AI session started */
  private sessionStartTime = Date.now();
  private sessionMessageCount = 0;

  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scriptContainer') scriptContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('lottieContainer') lottieContainer!: ElementRef<HTMLDivElement>;

  /* ══════════ LOTTIE ══════════ */
  private lottieAnim: AnimationItem | null = null;
  private currentLottieEmotion: string = '';

  /* ══════════ STATE ══════════ */

  // Core
  messages = signal<ChatMessage[]>([]);
  inputText = signal('');
  isLoading = signal(false);
  mode = signal<AppMode>('chat');
  isRecording = signal(false);
  isSpeaking = signal(false);

  // User memory
  userMemory = signal<UserMemory | null>(null);
  greeting = signal<string>('');

  // Script reading
  currentScript = signal<Script | null>(null);
  currentLineIndex = signal(0);
  scriptScores = signal<ReadingScore[]>([]);
  isGeneratingScript = signal(false);
  scriptTopicInput = signal('');
  isReadingLine = signal(false);
  lastSpokenText = signal('');
  showScriptPicker = signal(true);

  // Avatar emotion
  avatarEmotion = signal<'idle' | 'happy' | 'thinking' | 'speaking' | 'celebrating'>('idle');

  /* ══════════ DERIVED ══════════ */

  conversationHistory = computed(() =>
    this.messages().map((m) => ({ role: m.role, content: m.content }))
  );

  currentLine = computed<ScriptLine | null>(() => {
    const script = this.currentScript();
    const idx = this.currentLineIndex();
    return script ? script.lines[idx] ?? null : null;
  });

  scriptProgress = computed(() => {
    const script = this.currentScript();
    if (!script) return 0;
    return Math.round((this.currentLineIndex() / script.lines.length) * 100);
  });

  averageScore = computed(() => {
    const scores = this.scriptScores();
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
  });

  /* ══════════ SPEECH ══════════ */

  private recognition: any = null;
  private synthesis =
    typeof window !== 'undefined' ? window.speechSynthesis : null;
  private shouldScroll = false;

  /* ══════════ LIFECYCLE ══════════ */

  constructor() {
    this.initSpeechRecognition();

    // React to emotion changes to update Lottie animations
    effect(() => {
      const emotion = this.avatarEmotion();
      this.updateLottieAnimation(emotion);
    });
  }

  ngOnInit(): void {
    this.initUserMemory();
  }

  /* ═══════════════════════════════════════════
     LOTTIE ANIMATION ENGINE
     ═══════════════════════════════════════════ */

  private updateLottieAnimation(emotion: string): void {
    if (typeof window === 'undefined') return;
    if (emotion === this.currentLottieEmotion) return;
    this.currentLottieEmotion = emotion;

    // Wait for view to be available
    setTimeout(() => {
      const container = this.lottieContainer?.nativeElement;
      if (!container) return;

      // Destroy previous animation
      if (this.lottieAnim) {
        this.lottieAnim.destroy();
        this.lottieAnim = null;
      }

      const animData = this.getLottieData(emotion);
      if (!animData) return;

      this.lottieAnim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animData,
      });
    }, 50);
  }

  /** Generate procedural Lottie JSON for each emotion state */
  private getLottieData(emotion: string): any {
    const w = 200, h = 200, fr = 30;

    switch (emotion) {
      case 'thinking':
        return this.createThinkingLottie(w, h, fr);
      case 'speaking':
        return this.createSpeakingLottie(w, h, fr);
      case 'celebrating':
        return this.createCelebratingLottie(w, h, fr);
      case 'happy':
        return this.createHappyLottie(w, h, fr);
      default:
        return this.createIdleLottie(w, h, fr);
    }
  }

  /** Idle: gentle orbiting particles */
  private createIdleLottie(w: number, h: number, fr: number): any {
    const layers: any[] = [];
    const colors = [
      [0.08, 0.72, 0.65],  // teal
      [0.06, 0.65, 0.41],  // green
      [0.24, 0.56, 0.89],  // blue
    ];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 70;
      const cx = w / 2 + Math.cos(angle) * r;
      const cy = h / 2 + Math.sin(angle) * r;
      const cx2 = w / 2 + Math.cos(angle + Math.PI) * r;
      const cy2 = h / 2 + Math.sin(angle + Math.PI) * r;
      const color = colors[i % colors.length];

      layers.push({
        ty: 4, nm: `particle-${i}`, sr: 1, ks: {
          o: { a: 1, k: [
            { t: 0, s: [40], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: fr * 2, s: [80], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: fr * 4, s: [40] },
          ]},
          p: { a: 1, k: [
            { t: i * 12, s: [cx, cy], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: i * 12 + fr * 3, s: [cx2, cy2], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: i * 12 + fr * 6, s: [cx, cy] },
          ]},
          s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0] },
        },
        ip: 0, op: fr * 6, st: 0,
        shapes: [{
          ty: 'el', d: 1, s: { a: 0, k: [6, 6] }, p: { a: 0, k: [0, 0] },
        }, {
          ty: 'fl', c: { a: 0, k: [...color, 1] }, o: { a: 0, k: 60 },
        }],
      });
    }

    return { v: '5.7.0', fr, ip: 0, op: fr * 6, w, h, layers };
  }

  /** Thinking: orbiting dots forming a circle */
  private createThinkingLottie(w: number, h: number, fr: number): any {
    const layers: any[] = [];
    const numDots = 8;

    for (let i = 0; i < numDots; i++) {
      const delay = (i / numDots) * fr * 2;
      const startAngle = (i / numDots) * Math.PI * 2;
      const r = 65;

      const keyframes: any[] = [];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * Math.PI * 2;
        keyframes.push({
          t: delay + (s / steps) * fr * 3,
          s: [w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r],
          ...(s < steps ? { i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } } : {}),
        });
      }

      layers.push({
        ty: 4, nm: `think-dot-${i}`, sr: 1, ks: {
          o: { a: 1, k: [
            { t: delay, s: [30], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr, s: [90], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 2, s: [30] },
          ]},
          p: { a: 1, k: keyframes },
          s: { a: 1, k: [
            { t: delay, s: [60, 60], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr, s: [120, 120], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr * 2, s: [60, 60] },
          ]},
          r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0] },
        },
        ip: 0, op: fr * 3 + delay + 1, st: 0,
        shapes: [{
          ty: 'el', d: 1, s: { a: 0, k: [8, 8] }, p: { a: 0, k: [0, 0] },
        }, {
          ty: 'fl', c: { a: 0, k: [0.65, 0.55, 0.98, 1] }, o: { a: 0, k: 80 },
        }],
      });
    }

    return { v: '5.7.0', fr, ip: 0, op: fr * 5, w, h, layers };
  }

  /** Speaking: sound wave ripples expanding outward */
  private createSpeakingLottie(w: number, h: number, fr: number): any {
    const layers: any[] = [];

    for (let i = 0; i < 3; i++) {
      const delay = i * 10;
      layers.push({
        ty: 4, nm: `wave-${i}`, sr: 1, ks: {
          o: { a: 1, k: [
            { t: delay, s: [70], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 1.5, s: [0] },
          ]},
          p: { a: 0, k: [w / 2, h / 2] },
          s: { a: 1, k: [
            { t: delay, s: [30, 30], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr * 1.5, s: [200, 200] },
          ]},
          r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0] },
        },
        ip: 0, op: fr * 2 + delay, st: 0,
        shapes: [{
          ty: 'el', d: 1, s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] },
        }, {
          ty: 'st', c: { a: 0, k: [0.08, 0.72, 0.65, 1] }, o: { a: 0, k: 60 }, w: { a: 0, k: 2 },
        }],
      });
    }

    return { v: '5.7.0', fr, ip: 0, op: fr * 2, w, h, layers };
  }

  /** Celebrating: firework bursts of stars */
  private createCelebratingLottie(w: number, h: number, fr: number): any {
    const layers: any[] = [];
    const starColors = [
      [0.92, 0.70, 0.03], // gold
      [0.08, 0.72, 0.65], // teal
      [0.98, 0.45, 0.09], // orange
      [0.65, 0.55, 0.98], // purple
      [0.13, 0.77, 0.37], // green
    ];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 50 + Math.random() * 40;
      const color = starColors[i % starColors.length];
      const delay = Math.floor(Math.random() * fr);

      layers.push({
        ty: 4, nm: `star-${i}`, sr: 1, ks: {
          o: { a: 1, k: [
            { t: delay, s: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 1.5, s: [0] },
          ]},
          p: { a: 1, k: [
            { t: delay, s: [w / 2, h / 2], i: { x: 0.2, y: 1 }, o: { x: 0.8, y: 0 } },
            { t: delay + fr * 1.5, s: [w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist] },
          ]},
          s: { a: 1, k: [
            { t: delay, s: [0, 0], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr * 0.5, s: [120, 120], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr * 1.5, s: [40, 40] },
          ]},
          r: { a: 1, k: [
            { t: delay, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 1.5, s: [180] },
          ]},
          a: { a: 0, k: [0, 0] },
        },
        ip: 0, op: fr * 2, st: 0,
        shapes: [{
          ty: 'sr', sy: 1, d: 1, pt: { a: 0, k: 5 }, p: { a: 0, k: [0, 0] },
          or: { a: 0, k: 6 }, ir: { a: 0, k: 3 }, r: { a: 0, k: 0 },
        }, {
          ty: 'fl', c: { a: 0, k: [...color, 1] }, o: { a: 0, k: 90 },
        }],
      });
    }

    return { v: '5.7.0', fr, ip: 0, op: fr * 2, w, h, layers };
  }

  /** Happy: floating hearts/sparkles rising */
  private createHappyLottie(w: number, h: number, fr: number): any {
    const layers: any[] = [];

    for (let i = 0; i < 6; i++) {
      const x = 40 + (i / 5) * (w - 80);
      const delay = i * 8;

      layers.push({
        ty: 4, nm: `sparkle-${i}`, sr: 1, ks: {
          o: { a: 1, k: [
            { t: delay, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 0.5, s: [90], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 2, s: [0] },
          ]},
          p: { a: 1, k: [
            { t: delay, s: [x, h - 20], i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 } },
            { t: delay + fr * 2, s: [x + (Math.random() - 0.5) * 40, 20] },
          ]},
          s: { a: 1, k: [
            { t: delay, s: [50, 50], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr, s: [120, 120], i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] } },
            { t: delay + fr * 2, s: [60, 60] },
          ]},
          r: { a: 1, k: [
            { t: delay, s: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
            { t: delay + fr * 2, s: [i % 2 ? 45 : -45] },
          ]},
          a: { a: 0, k: [0, 0] },
        },
        ip: 0, op: fr * 3, st: 0,
        shapes: [{
          ty: 'sr', sy: 1, d: 1, pt: { a: 0, k: 4 }, p: { a: 0, k: [0, 0] },
          or: { a: 0, k: 5 }, ir: { a: 0, k: 2.5 }, r: { a: 0, k: 45 },
        }, {
          ty: 'fl', c: { a: 0, k: [0.08, 0.72, 0.65, 1] }, o: { a: 0, k: 70 },
        }],
      });
    }

    return { v: '5.7.0', fr, ip: 0, op: fr * 3, w, h, layers };
  }

  /* ═══════════════════════════════════════════
     USER MEMORY INITIALIZATION
     ═══════════════════════════════════════════ */

  private initUserMemory(): void {
    const user = this.authService.currentUser();
    const userId = user?.id ?? 'guest';
    const userName = user?.name ?? 'Explorer';

    const mem = this.aiService.loadMemory(userId, userName);
    this.userMemory.set(mem);

    // Load conversation history
    const savedHistory = this.aiService.loadHistory(userId);

    // Build personalized greeting
    const isReturning = mem.sessionCount > 1;
    let greet: string;

    if (isReturning) {
      const streakText = mem.streakDays > 1
        ? ` You're on a ${mem.streakDays}-day streak! 🔥`
        : '';
      greet = `Welcome back, ${userName}! 🌿${streakText} Ready to continue practicing? I remember where we left off.`;

      if (mem.lastConversationSummary) {
        greet += `\n\nLast time we talked about: ${mem.lastConversationSummary}`;
      }
    } else {
      greet = `Hello ${userName}! 🌴 I'm your Jungle English Tutor! I'll remember everything about our sessions together — your progress, your favorite topics, and areas we can improve. Let's get started!`;
    }
    this.greeting.set(greet);

    // Restore history or start fresh
    if (savedHistory.length > 0) {
      this.messages.set(savedHistory);
    } else {
      this.messages.set([
        {
          role: 'assistant',
          content: greet,
          corrections: [],
          timestamp: new Date(),
        },
      ]);
    }
  }

  /* ═══════════════════════════════════════════
     SPEECH RECOGNITION
     ═══════════════════════════════════════════ */

  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      this.isRecording.set(false);

      if (this.mode() === 'script') {
        this.lastSpokenText.set(transcript);
        this.evaluateReading(transcript);
      } else {
        this.sendMessage(transcript);
      }
    };

    this.recognition.onerror = () => {
      this.isRecording.set(false);
      this.isReadingLine.set(false);
    };
    this.recognition.onend = () => {
      this.isRecording.set(false);
      this.isReadingLine.set(false);
    };
  }

  toggleRecording(): void {
    if (!this.recognition) return;
    if (this.isRecording()) {
      this.recognition.stop();
      this.isRecording.set(false);
    } else {
      this.recognition.start();
      this.isRecording.set(true);
    }
  }

  /* ═══════════════════════════════════════════
     TEXT-TO-SPEECH (OpenAI TTS → Web Speech fallback)
     ═══════════════════════════════════════════ */

  private currentAudio: HTMLAudioElement | null = null;
  private bestVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  /** Pre-select the best available Web Speech voice */
  private initBestVoice(): void {
    if (this.voicesLoaded || typeof window === 'undefined') return;
    const loadVoices = () => {
      const voices = this.synthesis?.getVoices() ?? [];
      if (voices.length === 0) return;
      this.voicesLoaded = true;

      // Preference order: neural/natural voices → Google → Microsoft → any English
      const preferred = [
        // Neural / natural voices (highest quality)
        (v: SpeechSynthesisVoice) => /natural|neural/i.test(v.name) && /en[-_]US/i.test(v.lang),
        (v: SpeechSynthesisVoice) => /natural|neural/i.test(v.name) && /en/i.test(v.lang),
        // Google voices (very good on Chrome)
        (v: SpeechSynthesisVoice) => /Google US English/i.test(v.name),
        (v: SpeechSynthesisVoice) => /Google.*English/i.test(v.name),
        // Microsoft voices (good on Edge/Windows)
        (v: SpeechSynthesisVoice) => /Microsoft.*Online.*Natural/i.test(v.name) && /en/i.test(v.lang),
        (v: SpeechSynthesisVoice) => /Microsoft.*(Aria|Jenny|Guy|Ana)/i.test(v.name),
        (v: SpeechSynthesisVoice) => /Microsoft.*Zira/i.test(v.name),
        // Samantha (macOS default, pretty good)
        (v: SpeechSynthesisVoice) => /Samantha/i.test(v.name),
        // Any en-US voice
        (v: SpeechSynthesisVoice) => /en[-_]US/i.test(v.lang),
        // Any English voice
        (v: SpeechSynthesisVoice) => /en/i.test(v.lang),
      ];

      for (const test of preferred) {
        const match = voices.find(test);
        if (match) {
          this.bestVoice = match;
          console.log('🗣️ Selected TTS voice:', match.name);
          return;
        }
      }
    };

    loadVoices();
    // Voices load async in Chrome
    this.synthesis?.addEventListener('voiceschanged', loadVoices);
  }

  /**
   * Speak text using OpenAI TTS API first (natural human voice).
   * Falls back to Web Speech API with the best available voice.
   */
  speak(text: string): void {
    // Stop any current playback
    this.stopSpeaking();

    this.isSpeaking.set(true);
    this.avatarEmotion.set('speaking');

    // Try OpenAI TTS first
    this.aiService.textToSpeech(text, 'nova').subscribe({
      next: (audioBlob: Blob) => {
        if (audioBlob && audioBlob.size > 0) {
          this.playAudioBlob(audioBlob);
        } else {
          this.speakWithWebSpeech(text);
        }
      },
      error: () => {
        // Backend unavailable or no API key → fallback
        this.speakWithWebSpeech(text);
      },
    });
  }

  /** Play audio blob from OpenAI TTS */
  private playAudioBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    this.currentAudio = new Audio(url);
    this.currentAudio.playbackRate = 1.0;

    this.currentAudio.onended = () => {
      this.isSpeaking.set(false);
      this.avatarEmotion.set('idle');
      URL.revokeObjectURL(url);
      this.currentAudio = null;
    };
    this.currentAudio.onerror = () => {
      this.isSpeaking.set(false);
      this.avatarEmotion.set('idle');
      URL.revokeObjectURL(url);
      this.currentAudio = null;
    };

    this.currentAudio.play().catch(() => {
      // Autoplay blocked → fallback to Web Speech
      URL.revokeObjectURL(url);
      this.currentAudio = null;
      this.speakWithWebSpeech(
        this.currentLine()?.text ?? ''
      );
    });
  }

  /** Fallback: Web Speech API with the best available voice */
  private speakWithWebSpeech(text: string): void {
    if (!this.synthesis) {
      this.isSpeaking.set(false);
      this.avatarEmotion.set('idle');
      return;
    }

    this.initBestVoice();
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Use the best voice we found
    if (this.bestVoice) {
      utterance.voice = this.bestVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.avatarEmotion.set('speaking');
    };
    utterance.onend = () => {
      this.isSpeaking.set(false);
      this.avatarEmotion.set('idle');
    };
    utterance.onerror = () => {
      this.isSpeaking.set(false);
      this.avatarEmotion.set('idle');
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    // Stop OpenAI TTS audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    // Stop Web Speech API
    this.synthesis?.cancel();
    this.isSpeaking.set(false);
    this.avatarEmotion.set('idle');
  }

  /* ═══════════════════════════════════════════
     INPUT HANDLING
     ═══════════════════════════════════════════ */

  onInputChange(event: Event): void {
    this.inputText.set((event.target as HTMLInputElement).value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }

  handleSend(): void {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) return;
    this.inputText.set('');
    this.sendMessage(text);
  }

  onTopicInput(event: Event): void {
    this.scriptTopicInput.set((event.target as HTMLInputElement).value);
  }

  /* ═══════════════════════════════════════════
     CORE CHAT
     ═══════════════════════════════════════════ */

  sendMessage(text: string): void {
    this.sessionMessageCount += 1;
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      corrections: [],
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, userMsg]);
    this.isLoading.set(true);
    this.avatarEmotion.set('thinking');
    this.shouldScroll = true;

    const history = this.conversationHistory().slice(-20);

    this.aiService.sendMessage(text, history).subscribe({
      next: (response: ChatResponse) => {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.reply,
          corrections: response.corrections ?? [],
          timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, assistantMsg]);
        this.isLoading.set(false);
        this.shouldScroll = true;

        // Update memory with corrections
        if (response.corrections?.length) {
          this.aiService.updateMemoryAfterMessage(response.corrections);
          this.avatarEmotion.set('happy');
        } else {
          this.avatarEmotion.set('happy');
        }
        setTimeout(() => this.avatarEmotion.set('idle'), 2000);

        // Award small XP per chat exchange (5 XP)
        this.gami.awardXp(5);
        this.statsTracker.addDailyXp(5);
        this.leaderboard.sync();

        // Auto-speak in voice mode
        if (this.mode() === 'voice') {
          this.speak(response.reply);
        }

        // Save history
        this.persistHistory();
      },
      error: () => {
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content:
            "Oops! I couldn't process that. Please make sure the server is running and try again.",
          corrections: [],
          timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, errorMsg]);
        this.isLoading.set(false);
        this.avatarEmotion.set('idle');
        this.shouldScroll = true;
      },
    });
  }

  /* ═══════════════════════════════════════════
     SCRIPT READING MODE
     ═══════════════════════════════════════════ */

  generateNewScript(topic?: string): void {
    this.isGeneratingScript.set(true);
    this.avatarEmotion.set('thinking');
    const t = topic || this.scriptTopicInput() || undefined;

    this.aiService.generateScript(t).subscribe({
      next: (script) => {
        this.currentScript.set(script);
        this.currentLineIndex.set(0);
        this.scriptScores.set([]);
        this.showScriptPicker.set(false);
        this.isGeneratingScript.set(false);
        this.avatarEmotion.set('happy');
        setTimeout(() => this.avatarEmotion.set('idle'), 1500);
      },
      error: () => {
        // Fallback: generate a sample script client-side
        this.currentScript.set(this.getFallbackScript(t));
        this.currentLineIndex.set(0);
        this.scriptScores.set([]);
        this.showScriptPicker.set(false);
        this.isGeneratingScript.set(false);
        this.avatarEmotion.set('idle');
      },
    });
  }

  /** Tutor reads their line aloud */
  tutorReadsLine(): void {
    const line = this.currentLine();
    if (!line || line.speaker !== 'tutor') return;
    this.speak(line.text);
  }

  /** Student records their reading of the line */
  studentReadsLine(): void {
    const line = this.currentLine();
    if (!line || line.speaker !== 'student') return;
    if (!this.recognition) return;

    this.isReadingLine.set(true);
    this.lastSpokenText.set('');
    this.recognition.start();
    this.isRecording.set(true);
  }

  /** Evaluate spoken text against expected */
  private evaluateReading(spoken: string): void {
    const line = this.currentLine();
    if (!line) return;
    this.isReadingLine.set(false);
    this.avatarEmotion.set('thinking');

    this.aiService.scoreReading(line.text, spoken).subscribe({
      next: (result) => {
        const score: ReadingScore = {
          lineIndex: this.currentLineIndex(),
          score: result.score,
          feedback: result.feedback,
          corrections: result.corrections,
        };
        this.scriptScores.update((s) => [...s, score]);

        if (result.corrections.length) {
          this.aiService.updateMemoryAfterMessage(result.corrections);
        }

        this.avatarEmotion.set(result.score >= 80 ? 'celebrating' : 'happy');
        setTimeout(() => this.avatarEmotion.set('idle'), 2000);
      },
      error: () => {
        // Fallback local scoring
        const score = this.localScore(line.text, spoken);
        this.scriptScores.update((s) => [
          ...s,
          {
            lineIndex: this.currentLineIndex(),
            score,
            feedback: score >= 80 ? 'Great job!' : 'Try to be more precise.',
            corrections: [],
          },
        ]);
        this.avatarEmotion.set(score >= 80 ? 'celebrating' : 'happy');
        setTimeout(() => this.avatarEmotion.set('idle'), 2000);
      },
    });
  }

  /** Simple local word-match scorer as fallback */
  private localScore(expected: string, spoken: string): number {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const expWords = normalize(expected);
    const spkWords = normalize(spoken);
    if (expWords.length === 0) return 100;
    let matches = 0;
    for (const w of expWords) {
      if (spkWords.includes(w)) matches++;
    }
    return Math.round((matches / expWords.length) * 100);
  }

  /** Advance to next line in script */
  nextLine(): void {
    const script = this.currentScript();
    if (!script) return;
    const next = this.currentLineIndex() + 1;
    if (next < script.lines.length) {
      this.currentLineIndex.set(next);
    } else {
      this.completeScript();
    }
  }

  /** Go back to previous line */
  previousLine(): void {
    if (this.currentLineIndex() > 0) {
      this.currentLineIndex.update((i) => i - 1);
    }
  }

  /** Script completed — mark in memory, award XP, record AI session */
  private completeScript(): void {
    const script = this.currentScript();
    if (script) {
      this.aiService.markScriptCompleted(script.id);

      // Award XP based on script difficulty
      const xpByDifficulty = { beginner: 50, intermediate: 100, advanced: 150 };
      const xp = xpByDifficulty[script.difficulty] ?? 50;
      this.gami.awardXp(xp);

      // Record the AI session in stats
      const now = new Date();
      const durationSec = Math.round((now.getTime() - this.sessionStartTime) / 1000);
      this.statsTracker.recordAiSession({
        startedAt: new Date(this.sessionStartTime).toISOString(),
        endedAt: now.toISOString(),
        durationSec,
        messageCount: this.sessionMessageCount,
        scriptsCompleted: 1
      });
      this.statsTracker.addDailyXp(xp);
      this.leaderboard.sync();
    }
    this.avatarEmotion.set('celebrating');
    setTimeout(() => {
      this.avatarEmotion.set('idle');
    }, 3000);
  }

  /** Return to script picker */
  backToScriptPicker(): void {
    this.currentScript.set(null);
    this.scriptScores.set([]);
    this.showScriptPicker.set(true);
  }

  isScriptComplete(): boolean {
    const script = this.currentScript();
    if (!script) return false;
    return this.currentLineIndex() >= script.lines.length - 1 && this.scriptScores().length > 0;
  }

  getScoreForLine(index: number): ReadingScore | undefined {
    return this.scriptScores().find((s) => s.lineIndex === index);
  }

  /* ═══════════════════════════════════════════
     MODE SWITCHING
     ═══════════════════════════════════════════ */

  switchMode(newMode: AppMode): void {
    this.stopSpeaking();
    this.mode.set(newMode);
    if (newMode === 'script') {
      this.showScriptPicker.set(!this.currentScript());
    }
  }

  /* ═══════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════ */

  private persistHistory(): void {
    const user = this.authService.currentUser();
    const userId = user?.id ?? 'guest';
    this.aiService.saveHistory(userId, this.messages());
  }

  /* ═══════════════════════════════════════════
     FALLBACK SCRIPTS — keyed by topic for accurate matching
     ═══════════════════════════════════════════ */

  private readonly scriptBank: Record<string, Script> = {
    'coffee': {
      id: 'coffee-shop',
      title: '☕ At the Coffee Shop',
      description: 'Practice ordering coffee and making small talk',
      difficulty: 'beginner',
      lines: [
        { speaker: 'tutor', text: 'Good morning! Welcome to the Jungle Café. What can I get for you today?' },
        { speaker: 'student', text: 'Good morning! I would like a large cappuccino, please.', hint: 'Order a drink politely' },
        { speaker: 'tutor', text: 'Great choice! Would you like any sugar or milk with that?' },
        { speaker: 'student', text: 'Just a little sugar, please. No extra milk.', hint: 'Specify your preferences' },
        { speaker: 'tutor', text: 'Of course! Would you like to add a pastry? Our croissants are fresh today.' },
        { speaker: 'student', text: 'That sounds delicious! I will have one croissant, please.', hint: 'Accept the offer' },
        { speaker: 'tutor', text: 'Perfect! That will be four dollars and fifty cents. Can I get your name for the order?' },
        { speaker: 'student', text: 'Sure, my name is Alex. Thank you very much!', hint: 'Give your name and thank them' },
        { speaker: 'tutor', text: 'You are welcome, Alex! Your order will be ready in just a moment. Have a great day!' },
        { speaker: 'student', text: 'Thank you! You too. Have a wonderful day!', hint: 'Say goodbye politely' },
      ],
    },
    'interview': {
      id: 'job-interview',
      title: '💼 Job Interview',
      description: 'Practice answering common interview questions',
      difficulty: 'intermediate',
      lines: [
        { speaker: 'tutor', text: 'Please have a seat. Thank you for coming in today. Can you tell me a little about yourself?' },
        { speaker: 'student', text: 'Thank you for having me. I am a recent graduate with a degree in computer science.', hint: 'Introduce yourself briefly' },
        { speaker: 'tutor', text: 'Interesting! What attracted you to this position?' },
        { speaker: 'student', text: 'I am really passionate about technology and I believe this company offers great opportunities to grow.', hint: 'Express enthusiasm' },
        { speaker: 'tutor', text: 'Can you describe a challenge you have faced and how you overcame it?' },
        { speaker: 'student', text: 'During my final project at university, I had to learn a new programming language in just two weeks. I dedicated extra hours each day and successfully completed the project on time.', hint: 'Tell a specific story' },
        { speaker: 'tutor', text: 'That shows great dedication! Where do you see yourself in five years?' },
        { speaker: 'student', text: 'I see myself as a senior developer, leading a team and contributing to innovative projects.', hint: 'Share your career vision' },
        { speaker: 'tutor', text: 'Excellent! Do you have any questions for us?' },
        { speaker: 'student', text: 'Yes, I would like to know more about the team I would be working with and what a typical day looks like.', hint: 'Ask a thoughtful question' },
      ],
    },
    'airport': {
      id: 'airport-travel',
      title: '✈️ At the Airport',
      description: 'Navigate airport conversations with confidence',
      difficulty: 'intermediate',
      lines: [
        { speaker: 'tutor', text: 'Next in line, please! May I see your passport and boarding pass?' },
        { speaker: 'student', text: 'Of course, here you go. I am flying to London today.', hint: 'Present your documents' },
        { speaker: 'tutor', text: 'Thank you. Did you pack your bags yourself? Do you have any liquids over one hundred milliliters?' },
        { speaker: 'student', text: 'Yes, I packed everything myself. All my liquids are in a small clear bag.', hint: 'Answer security questions' },
        { speaker: 'tutor', text: 'Perfect. Your flight is boarding at gate B twelve. It departs at three forty-five.' },
        { speaker: 'student', text: 'Thank you! Could you tell me where gate B twelve is, please?', hint: 'Ask for directions' },
        { speaker: 'tutor', text: 'Sure! Go straight ahead, past the duty-free shop, then turn right. You will see the signs.' },
        { speaker: 'student', text: 'That is very helpful. Thank you so much! Have a nice day.', hint: 'Thank and say goodbye' },
        { speaker: 'tutor', text: 'You too! Enjoy your flight. Remember, boarding starts thirty minutes before departure.' },
        { speaker: 'student', text: 'I will keep that in mind. Thanks again for your help!', hint: 'Confirm and thank' },
      ],
    },
    'restaurant': {
      id: 'restaurant-dining',
      title: '🍽️ Dinner at the Restaurant',
      description: 'Practice ordering food and talking to a waiter',
      difficulty: 'beginner',
      lines: [
        { speaker: 'tutor', text: 'Good evening! Welcome to the Jungle Restaurant. Table for two?' },
        { speaker: 'student', text: 'Good evening! Actually, just a table for one, please.', hint: 'Correct politely' },
        { speaker: 'tutor', text: 'Of course! Right this way. Here is the menu. Can I get you something to drink?' },
        { speaker: 'student', text: 'I would like a glass of water and an orange juice, please.', hint: 'Order drinks' },
        { speaker: 'tutor', text: 'Wonderful! Are you ready to order your meal, or do you need a few more minutes?' },
        { speaker: 'student', text: 'I think I am ready. I will have the grilled chicken salad, please.', hint: 'Order your meal' },
        { speaker: 'tutor', text: 'Excellent choice! Would you like any side dishes, like fries or rice?' },
        { speaker: 'student', text: 'Rice would be great, thank you. And could I have some extra bread?', hint: 'Add sides and make a request' },
        { speaker: 'tutor', text: 'Of course! Would you like to see the dessert menu after your meal?' },
        { speaker: 'student', text: 'Yes, please! I have heard your chocolate cake is amazing.', hint: 'Show interest in dessert' },
        { speaker: 'tutor', text: 'It is our most popular dessert! I will bring it after your main course. Enjoy your meal!' },
        { speaker: 'student', text: 'Thank you so much! Everything looks delicious.', hint: 'Thank the waiter' },
      ],
    },
    'shopping': {
      id: 'shopping-clothes',
      title: '🛍️ Shopping for Clothes',
      description: 'Practice shopping conversations and bargaining',
      difficulty: 'beginner',
      lines: [
        { speaker: 'tutor', text: 'Hi there! Welcome to our store. Are you looking for anything in particular today?' },
        { speaker: 'student', text: 'Hi! Yes, I am looking for a new jacket. Do you have any in size medium?', hint: 'State what you need' },
        { speaker: 'tutor', text: 'Absolutely! We have several styles. Do you prefer casual or more formal?' },
        { speaker: 'student', text: 'I would prefer something casual that I can wear every day.', hint: 'Share your preference' },
        { speaker: 'tutor', text: 'How about this one? It comes in blue, black, and green. Would you like to try it on?' },
        { speaker: 'student', text: 'The blue one looks nice! Yes, I would love to try it on. Where is the fitting room?', hint: 'Pick a color and ask for fitting room' },
        { speaker: 'tutor', text: 'The fitting rooms are right over there on the left. Take your time!' },
        { speaker: 'student', text: 'This fits perfectly! How much does it cost?', hint: 'Ask about the price' },
        { speaker: 'tutor', text: 'That one is forty-five dollars. We also have a sale today — buy one, get the second half off!' },
        { speaker: 'student', text: 'That is a great deal! I will take this one and maybe look at a shirt too.', hint: 'Show interest in the deal' },
        { speaker: 'tutor', text: 'Great! The shirts are in the next aisle. Would you like me to help you find one?' },
        { speaker: 'student', text: 'Yes, please! I am looking for something that matches this jacket.', hint: 'Accept help' },
      ],
    },
    'doctor': {
      id: 'doctor-visit',
      title: '🏥 At the Doctor\'s Office',
      description: 'Practice discussing health and medical appointments',
      difficulty: 'intermediate',
      lines: [
        { speaker: 'tutor', text: 'Hello! Please come in and have a seat. What brings you in today?' },
        { speaker: 'student', text: 'Hello, doctor. I have been feeling unwell. I have had a bad headache for the past three days.', hint: 'Describe your symptoms' },
        { speaker: 'tutor', text: 'I am sorry to hear that. Have you experienced any other symptoms, like fever, dizziness, or nausea?' },
        { speaker: 'student', text: 'Yes, I have been feeling a bit dizzy, especially in the mornings. But no fever.', hint: 'Give more details' },
        { speaker: 'tutor', text: 'I see. Are you currently taking any medications or do you have any allergies?' },
        { speaker: 'student', text: 'I am not taking any medications. I am allergic to penicillin, though.', hint: 'Mention allergies' },
        { speaker: 'tutor', text: 'Thank you for telling me. Let me check your blood pressure. Have you been getting enough sleep recently?' },
        { speaker: 'student', text: 'To be honest, I have been staying up late and only sleeping about five hours a night.', hint: 'Be honest about habits' },
        { speaker: 'tutor', text: 'That is likely the cause. I recommend sleeping at least seven hours. I will prescribe something for the headaches.' },
        { speaker: 'student', text: 'Thank you, doctor. How often should I take the medicine, and should I come back for a follow-up?', hint: 'Ask about treatment' },
      ],
    },
    'hotel': {
      id: 'hotel-checkin',
      title: '🏨 Hotel Check-In',
      description: 'Practice checking in and asking about hotel services',
      difficulty: 'beginner',
      lines: [
        { speaker: 'tutor', text: 'Good afternoon! Welcome to the Jungle Hotel. Do you have a reservation?' },
        { speaker: 'student', text: 'Good afternoon! Yes, I have a reservation under the name Smith for three nights.', hint: 'Confirm your reservation' },
        { speaker: 'tutor', text: 'Let me check... Yes, I found it! A double room with a sea view. May I see your identification?' },
        { speaker: 'student', text: 'Here is my passport. Could you also tell me if breakfast is included?', hint: 'Show ID and ask about breakfast' },
        { speaker: 'tutor', text: 'Breakfast is served from seven to ten in the restaurant on the second floor. Here is your room key, room three oh five.' },
        { speaker: 'student', text: 'Thank you! Is there a gym or swimming pool in the hotel?', hint: 'Ask about facilities' },
        { speaker: 'tutor', text: 'Yes! The gym is on the ground floor and the pool is on the rooftop. Both are open until ten pm.' },
        { speaker: 'student', text: 'That sounds wonderful! One last question — what is the wifi password?', hint: 'Ask practical questions' },
        { speaker: 'tutor', text: 'The wifi name is JungleHotel and the password is on this card. Enjoy your stay!' },
        { speaker: 'student', text: 'Thank you so much for all the information. I am sure I will enjoy it here!', hint: 'Thank and express satisfaction' },
      ],
    },
    'phone': {
      id: 'phone-call',
      title: '📞 Making a Phone Call',
      description: 'Practice formal phone conversations',
      difficulty: 'advanced',
      lines: [
        { speaker: 'tutor', text: 'Good morning, you have reached the Jungle Company. How may I direct your call?' },
        { speaker: 'student', text: 'Good morning. I would like to speak with someone from the customer service department, please.', hint: 'Ask to be connected' },
        { speaker: 'tutor', text: 'Certainly. May I ask who is calling and what this is regarding?' },
        { speaker: 'student', text: 'My name is Jordan Taylor. I am calling about an issue with my recent order.', hint: 'Identify yourself and state purpose' },
        { speaker: 'tutor', text: 'Thank you, Jordan. Let me transfer you. Please hold for a moment... Hello, this is customer service. How can I help?' },
        { speaker: 'student', text: 'Hello. I placed an order last week but I received the wrong item. I would like to arrange a return.', hint: 'Explain the problem clearly' },
        { speaker: 'tutor', text: 'I am sorry about that. Could you give me your order number so I can look into this?' },
        { speaker: 'student', text: 'Of course. The order number is seven four two one. I also have the confirmation email if you need it.', hint: 'Provide details' },
        { speaker: 'tutor', text: 'I found your order. We will send a return label to your email and ship the correct item right away.' },
        { speaker: 'student', text: 'That is perfect, thank you. When should I expect the replacement to arrive?', hint: 'Ask about timeline' },
      ],
    },
    'directions': {
      id: 'asking-directions',
      title: '🗺️ Asking for Directions',
      description: 'Practice navigating and understanding directions',
      difficulty: 'beginner',
      lines: [
        { speaker: 'tutor', text: 'Excuse me! You look a bit lost. Can I help you find something?' },
        { speaker: 'student', text: 'Yes, please! I am looking for the nearest train station. Do you know where it is?', hint: 'Ask for help finding a place' },
        { speaker: 'tutor', text: 'Sure! Walk straight down this road for about two blocks. Then turn left at the traffic light.' },
        { speaker: 'student', text: 'Okay, straight for two blocks then turn left. Is it far from there?', hint: 'Confirm directions' },
        { speaker: 'tutor', text: 'Not at all! After you turn left, you will see it on your right. It takes about five minutes.' },
        { speaker: 'student', text: 'Great, thank you! By the way, is there a pharmacy nearby? I need to buy some medicine.', hint: 'Ask about another location' },
        { speaker: 'tutor', text: 'Yes, there is one right next to the train station. You can not miss it — it has a big green sign.' },
        { speaker: 'student', text: 'That is very convenient! Thank you so much for all your help.', hint: 'Express gratitude' },
      ],
    },
  };

  /** Topic keyword → script key mapping for accurate selection */
  private readonly topicKeyMap: Record<string, string> = {
    'coffee': 'coffee', 'café': 'coffee', 'cafe': 'coffee', 'ordering coffee': 'coffee',
    'interview': 'interview', 'job': 'interview', 'job interview': 'interview',
    'airport': 'airport', 'travel': 'airport', 'flight': 'airport', 'airport travel': 'airport',
    'restaurant': 'restaurant', 'food': 'restaurant', 'dining': 'restaurant', 'restaurant dining': 'restaurant', 'dinner': 'restaurant',
    'shopping': 'shopping', 'clothes': 'shopping', 'store': 'shopping', 'shopping for clothes': 'shopping',
    'doctor': 'doctor', 'health': 'doctor', 'hospital': 'doctor', 'doctor appointment': 'doctor', 'medical': 'doctor',
    'hotel': 'hotel', 'booking': 'hotel', 'check-in': 'hotel', 'booking a hotel': 'hotel',
    'phone': 'phone', 'call': 'phone', 'telephone': 'phone', 'phone call': 'phone',
    'directions': 'directions', 'navigate': 'directions', 'lost': 'directions', 'asking for directions': 'directions',
  };

  private getFallbackScript(topic?: string): Script {
    if (topic) {
      const lower = topic.toLowerCase().trim();

      // 1. Exact match in topic key map
      if (this.topicKeyMap[lower]) {
        return this.scriptBank[this.topicKeyMap[lower]];
      }

      // 2. Partial keyword match
      for (const [keyword, scriptKey] of Object.entries(this.topicKeyMap)) {
        if (lower.includes(keyword) || keyword.includes(lower)) {
          return this.scriptBank[scriptKey];
        }
      }

      // 3. Search script titles/descriptions
      for (const script of Object.values(this.scriptBank)) {
        if (
          script.title.toLowerCase().includes(lower) ||
          script.description.toLowerCase().includes(lower) ||
          lower.includes(script.id)
        ) {
          return script;
        }
      }
    }

    // Random from all scripts (never defaults to a specific one)
    const keys = Object.keys(this.scriptBank);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return this.scriptBank[randomKey];
  }

  getQuickScriptTopics(): { label: string; topic: string; icon: string }[] {
    return [
      { label: 'Coffee Shop', topic: 'coffee', icon: '☕' },
      { label: 'Job Interview', topic: 'interview', icon: '💼' },
      { label: 'Airport', topic: 'airport', icon: '✈️' },
      { label: 'Restaurant', topic: 'restaurant', icon: '🍽️' },
      { label: 'Shopping', topic: 'shopping', icon: '🛍️' },
      { label: 'Doctor Visit', topic: 'doctor', icon: '🏥' },
      { label: 'Hotel Check-In', topic: 'hotel', icon: '🏨' },
      { label: 'Phone Call', topic: 'phone', icon: '📞' },
      { label: 'Directions', topic: 'directions', icon: '🗺️' },
    ];
  }

  /* ═══════════════════════════════════════════
     SCROLL MANAGEMENT
     ═══════════════════════════════════════════ */

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (_) {}
  }

  /* ═══════════════════════════════════════════
     CLEANUP
     ═══════════════════════════════════════════ */

  ngOnDestroy(): void {
    this.recognition?.stop();
    this.synthesis?.cancel();
    this.lottieAnim?.destroy();

    // Stop any playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Save conversation summary when leaving
    const msgs = this.messages();
    if (msgs.length > 2) {
      const lastTopics = msgs
        .filter((m) => m.role === 'user')
        .slice(-3)
        .map((m) => m.content.substring(0, 60))
        .join('; ');
      this.aiService.saveConversationSummary(lastTopics);
    }

    this.persistHistory();
  }
}
