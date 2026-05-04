import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-epingle-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isVisible">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            <span class="flex items-center gap-2">
              <span>📌</span>
              Épingler ce message
            </span>
          </h3>
          <p class="text-sm text-gray-600">
            Veuillez indiquer la raison de l'épinglage de ce message.
          </p>
        </div>
        
        <div class="mb-6">
          <label for="raison" class="block text-sm font-medium text-gray-700 mb-2">
            Raison de l'épinglage <span class="text-red-500">*</span>
          </label>
          <textarea 
            id="raison"
            [(ngModel)]="raison"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            placeholder="Ex: Information importante, Annonce, Rappel..."
            required>
          </textarea>
        </div>
        
        <div class="flex justify-end gap-3">
          <button 
            (click)="cancel()"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button 
            (click)="confirm()"
            [disabled]="!raison.trim()"
            class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Épingler
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    textarea {
      min-height: 80px;
    }
  `]
})
export class EpingleModalComponent {
  @Input() isVisible: boolean = false;
  @Output() confirmPin = new EventEmitter<{messageId: number, raison: string}>();
  @Output() cancelPin = new EventEmitter<void>();
  
  raison: string = '';

  // Ajouter un setter pour logger les changements de messageId
  private _messageId: number = 0;
  
  @Input() 
  set messageId(value: number) {
    console.log('? EpingleModal messageId setter appelé avec:', value);
    this._messageId = value;
  }
  
  get messageId(): number {
    return this._messageId;
  }

  confirm(): void {
    console.log('? EpingleModal.confirm appelé');
    console.log('? messageId:', this._messageId);
    console.log('? raison:', this.raison);
    
    if (this.raison.trim()) {
      const data = {
        messageId: this._messageId,
        raison: this.raison.trim()
      };
      console.log('? Données envoyées:', data);
      this.confirmPin.emit(data);
      this.raison = '';
    }
  }

  cancel(): void {
    this.cancelPin.emit();
    this.raison = '';
  }
}
