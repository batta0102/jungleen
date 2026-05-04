import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ClubMessageService } from '../../../../../Frontend/app/services/club-message.service';
import { EpingleService } from '../../../../../Frontend/app/services/epingle.service';
import { AuthService } from '../../../../../Frontend/app/services/auth.service';

@Component({
  selector: 'app-forum-messages',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-amber-50/60">
      <!-- Header -->
      <div class="border-b border-white/80 bg-white/90 backdrop-blur-sm shadow-sm">
        <div class="container mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Forum du Club #{{ clubId }}</h1>
            <p class="mt-2 text-gray-600">Messages du club</p>
          </div>
          <button (click)="goBack()"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
            <span>←</span>
            Retour aux clubs
          </button>
        </div>
      </div>

      <div class="container mx-auto px-6 pt-6 text-center">
        <div class="inline-flex flex-wrap items-center justify-center gap-2" *ngIf="!loading">
          <div class="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            📌 {{ pinnedMessagesCount }} message(s) épinglé(s)
          </div>
          <div class="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            📍 {{ remainingPins }} épinglé(s) disponible(s)
          </div>
        </div>
        <h2 class="mt-3 text-4xl font-extrabold text-slate-900">Forum du Club #{{ clubId }}</h2>
        <p class="mt-1 text-lg text-slate-600">{{ messages.length }} message(s) {{ currentDate | date:'dd MMMM yyyy' }}</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p class="mt-2 text-gray-600">Chargement des messages...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Messages -->
      <div *ngIf="!loading && !error" class="container mx-auto px-6 py-8">
        <div class="mb-4">
          <p class="text-sm text-gray-600">{{ messages.length }} message(s)</p>
        </div>
        
        <div *ngIf="messages.length === 0" class="text-center py-8 text-gray-500">
          <p>Aucun message trouvé pour ce club.</p>
        </div>
        
        <div *ngIf="messages.length > 0" class="space-y-4">
          <div *ngFor="let message of messages" 
               class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-semibold text-gray-900">{{ message.user?.nom || 'Utilisateur inconnu' }}</h3>
                <p class="text-sm text-gray-500">{{ message.user?.email || 'email@inconnu.com' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">{{ message.dateEnvoi | date:'dd/MM/yyyy HH:mm' }}</p>
                <p class="text-sm text-gray-500">ID: #{{ message.id }}</p>
              </div>
            </div>

            <div *ngIf="message.isPinned" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div class="flex items-center gap-2 font-medium">
                <span>📌</span>
                <span>Message épinglé</span>
              </div>
              <p class="mt-1 text-amber-700">{{ message.raisonEpingle || 'Message important' }}</p>
            </div>
            
            <div class="mb-4">
              <p class="text-gray-800 leading-relaxed">{{ message.contenu }}</p>
            </div>
            
            <div class="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <span>❤️</span>
                  {{ message.likes || 0 }} like(s)
                </span>
                <span class="flex items-center gap-1">
                  <span>💬</span>
                  {{ message.commentCount || 0 }} commentaire(s)
                </span>
              </div>

              <div *ngIf="canManagePins" class="flex items-center gap-2">
                <button *ngIf="!message.isPinned" type="button" (click)="pinMessage(message)"
                        class="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600">
                  <span>📌</span>
                  <span>Épingler</span>
                </button>

                <button *ngIf="message.isPinned" type="button" (click)="unpinMessage(message)"
                        class="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600">
                  <span>📌</span>
                  <span>Désépingler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class ForumMessages implements OnInit {
  clubId: number = 0;
  messages: any[] = [];
  loading = true;
  error: string | null = null;
  readonly maxPins = 3;
  readonly currentDate = new Date();
  private requestInFlight = false;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  canManagePins = false;

  get pinnedMessagesCount(): number {
    return this.messages.filter((message) => message?.isPinned).length;
  }

  get remainingPins(): number {
    return Math.max(0, this.maxPins - this.pinnedMessagesCount);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: ClubMessageService,
    private epingleService: EpingleService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canManagePins = this.hasPinRole() || this.isForumManagementRoute();
    console.log('Pin permissions resolved:', {
      canManagePins: this.canManagePins,
      url: this.router.url
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clubId = parseInt(id, 10);
      if (!Number.isFinite(this.clubId) || this.clubId <= 0) {
        this.error = 'ID du club invalide';
        this.loading = false;
        return;
      }
      this.loadMessages();
    } else {
      this.error = 'ID du club invalide';
      this.loading = false;
    }
  }

  private hasPinRole(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const role = (currentUser?.role || '').toString().toLowerCase();
    const roles = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r: any) => String(r).toLowerCase())
      : [];

    const roleFromStorage = (() => {
      try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return '';
        const parsed = JSON.parse(raw);
        return String(parsed?.role || '').toLowerCase();
      } catch {
        return '';
      }
    })();

    return (
      role === 'admin' ||
      role === 'teacher' ||
      role === 'tutor' ||
      roles.includes('admin') ||
      roles.includes('teacher') ||
      roles.includes('tutor') ||
      roleFromStorage === 'admin' ||
      roleFromStorage === 'teacher' ||
      roleFromStorage === 'tutor' ||
      currentUser?.isAdmin === true
    );
  }

  private isForumManagementRoute(): boolean {
    const url = this.router.url || '';
    return /\/(admin|back)\/clubs\/\d+\/forum/.test(url);
  }

  loadMessages(): void {
    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    this.loading = true;
    this.error = null;

    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    this.watchdogTimer = setTimeout(() => {
      this.loading = false;
      this.requestInFlight = false;
      this.error = 'Le chargement des messages a expiré. Veuillez réessayer.';
      this.cdr.detectChanges();
    }, 15000);
    
    this.messageService.getMessagesByClub(this.clubId).pipe(
      timeout(12000),
      catchError((error: any) => {
        console.error('Erreur lors du chargement des messages:', error);
        this.error = 'Impossible de charger les messages du forum';
        return of([]);
      }),
      finalize(() => {
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        this.loading = false;
        this.requestInFlight = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (messages: any[]) => {
        this.messages = messages;
        console.log(`Messages du club ${this.clubId}:`, messages);
      },
      error: () => {}
    });
  }

  goBack(): void {
    this.router.navigate(['/back/clubs']);
  }

  pinMessage(message: any): void {
    const reason = window.prompt('Raison de l\'épinglage');
    if (!reason || !reason.trim()) {
      return;
    }

    const messageId = message.id || message.idMessage || message.id_message;
    if (!messageId) {
      return;
    }

    this.epingleService.pinMessage(messageId, reason.trim()).subscribe({
      next: () => {
        message.isPinned = true;
        message.raisonEpingle = reason.trim();
        this.messages = [...this.messages];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'épinglage:', error);
        alert(error?.message || 'Impossible d\'épingler ce message');
      }
    });
  }

  unpinMessage(message: any): void {
    const messageId = message.id || message.idMessage || message.id_message;
    if (!messageId) {
      return;
    }

    this.epingleService.unpinMessage(messageId).subscribe({
      next: () => {
        message.isPinned = false;
        message.raisonEpingle = null;
        this.messages = [...this.messages];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors du désépinglage:', error);
        alert(error?.message || 'Impossible de désépingler ce message');
      }
    });
  }
}
