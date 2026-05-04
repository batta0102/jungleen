import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-card',
  imports: [CommonModule],
  template: `
    <div class="bg-white border-l-4 shadow-md mb-6 p-6 rounded-r-lg relative"
         [class]="message.isPinned ? 'border-amber-500 bg-amber-50' : 'border-blue-500'">
      <!-- Indicateur d'épinglage en haut -->
      <div *ngIf="message.isPinned" class="absolute -top-2 -right-2 z-10">
        <div class="bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-full p-2.5 shadow-lg border-2 border-white">
          <span class="text-lg">📌</span>
        </div>
      </div>
      
      <!-- Barre d'indication d'épinglage -->
      <div *ngIf="message.isPinned" class="h-1 bg-gradient-to-r from-amber-400 to-orange-400 w-full -mt-5 -mb-4"></div>
      
      <!-- En-tête du message -->
      <div class="border-b border-gray-200 pb-3 mb-4">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-semibold text-sm">{{ getUserDisplayName(message).charAt(0) }}</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">{{ getUserDisplayName(message) }}</h3>
              <p class="text-sm text-gray-500">{{ getUserDisplayEmail(message) }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 font-medium">{{ message.dateEnvoi | date:'dd MMMM yyyy' }}</p>
            <p class="text-xs text-gray-400">{{ message.dateEnvoi | date:'HH:mm' }}</p>
            <p class="text-xs text-gray-400 mt-1">Message #{{ message.id || message.idMessage }}</p>
          </div>
        </div>
      </div>
      
      <!-- Indicateur d'épinglage dans le contenu -->
      <div *ngIf="message.isPinned" class="mb-4">
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="bg-amber-100 text-amber-600 p-2 rounded-full">
              <span class="text-lg">?</span>
            </div>
            <div>
              <h4 class="text-amber-800 font-semibold text-sm">Message épinglé</h4>
              <p class="text-amber-600 text-xs">{{ message.raisonEpingle || 'Message important' }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Contenu du message -->
      <div class="mb-4">
        <p class="text-gray-800 leading-relaxed text-base" [class]="message.isPinned ? 'font-medium text-amber-900' : ''">
          {{ message.contenu || 'Contenu non disponible' }}
        </p>
      </div>
      
      <!-- Pied du message -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <div class="flex items-center gap-6 text-sm text-gray-500">
          <button type="button" class="flex items-center gap-2 hover:text-red-600 transition-colors cursor-pointer">
            <span class="text-lg">❤️</span>
            <span>{{ message.likes || 0 }}</span>
          </button>
          <button type="button" class="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer" 
                (click)="toggleComments(message)">
            <span class="text-lg">💬</span>
            <span>{{ message.commentCount || 0 }}</span>
          </button>
        </div>
        
        <!-- Boutons admin -->
        <div *ngIf="isAdmin" class="flex items-center gap-2">
          <!-- Si le message est épinglé, afficher un badge élégant -->
          <div *ngIf="message.isPinned" 
               class="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-sm rounded-lg flex items-center gap-2 cursor-default shadow-sm">
            <span class="text-amber-500">📌</span>
            <span class="font-medium">Épinglé</span>
          </div>
          
          <!-- Bouton pour épingler un message non épinglé -->
          <button *ngIf="!message.isPinned" type="button" (click)="pinMessage(message)" 
                  class="px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm inline-flex items-center gap-2">
            <span>📌</span>
            <span>Épingler</span>
          </button>
          
          <!-- Bouton pour désépingler un message épinglé -->
          <button *ngIf="message.isPinned" type="button" (click)="unpinMessage(message)" 
                  class="px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm inline-flex items-center gap-2">
            <span>📌</span>
            <span>Désépingler</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MessageCardComponent {
  @Input() message: any;
  @Input() isAdmin: boolean = false;
  @Output() commentToggle = new EventEmitter<any>();
  @Output() pinRequest = new EventEmitter<any>();
  @Output() unpinRequest = new EventEmitter<any>();

  getUserDisplayName(message: any): string {
    if (message.user?.nom) {
      return message.user.nom;
    }
    return `User ${message.userId || 'Inconnu'}`;
  }

  getUserDisplayEmail(message: any): string {
    if (message.user?.email) {
      return message.user.email;
    }
    return `user${message.userId || 'inconnu'}@example.com`;
  }

  toggleComments(message: any): void {
    this.commentToggle.emit(message);
  }

  pinMessage(message: any): void {
    this.pinRequest.emit(message);
  }

  unpinMessage(message: any): void {
    this.unpinRequest.emit(message);
  }
}
