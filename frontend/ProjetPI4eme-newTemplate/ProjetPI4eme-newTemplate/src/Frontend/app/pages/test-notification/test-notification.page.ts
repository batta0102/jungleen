import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionNotificationService } from '../../services/session-notification.service';

@Component({
  selector: 'app-test-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Test du Système de Notification</h2>
      
      <div class="test-section">
        <h3>État du service</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Service actif:</span>
            <span class="status-value">OUI</span>
          </div>
          <div class="status-item">
            <span class="status-label">Utilisateur ID:</span>
            <span class="status-value">{{ userId }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Sessions proches:</span>
            <span class="status-value">{{ sessionsCount }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Popups actives:</span>
            <span class="status-value">{{ popupsCount }}</span>
          </div>
        </div>
      </div>
      
      <div class="test-section">
        <h3>Actions manuelles</h3>
        <div class="action-grid">
          <button class="test-btn" (click)="testPopup()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 17H2a3 3 0 003-3V9a7 7 0 0114 0v5a3 3 0 003 3zm-8.27 4a2 2 0 01-3.46 0"></path>
            </svg>
            Tester la popup
          </button>
          <button class="test-btn" (click)="checkApi()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Vérifier l'API
          </button>
          <button class="test-btn" (click)="clearAll()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
            Tout nettoyer
          </button>
        </div>
      </div>
      
      <div class="test-section">
        <h3>Instructions</h3>
        <div class="instructions">
          <p>1. Le système vérifie automatiquement les sessions toutes les 30 secondes</p>
          <p>2. Si l'API retourne une erreur, une session de test est créée automatiquement</p>
          <p>3. La popup devrait apparaître en haut à droite de l'écran</p>
          <p>4. Vous pouvez tester manuellement avec le bouton "Tester la popup"</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
    }
    
    .test-section h3 {
      margin: 0 0 15px 0;
      color: #374151;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    
    .status-label {
      font-weight: 600;
      color: #6b7280;
    }
    
    .status-value {
      color: #111827;
      font-weight: 500;
    }
    
    .action-grid {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .test-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .test-btn:hover {
      background: #2563eb;
    }
    
    .instructions {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    
    .instructions p {
      margin: 8px 0;
      color: #4b5563;
    }
  `]
})
export class TestNotificationPage {
  private sessionNotificationService = inject(SessionNotificationService);
  
  userId = 1; // Valeur par défaut
  sessionsCount = 0;
  popupsCount = 0;
  
  constructor() {
    // Écouter les changements
    this.sessionNotificationService.sessionsProches.subscribe(sessions => {
      this.sessionsCount = sessions.length;
    });
    
    this.sessionNotificationService.popups.subscribe(popups => {
      this.popupsCount = popups.filter(p => p.visible).length;
    });
  }
  
  testPopup(): void {
    console.log('Test manuel de la popup');
    
    // Créer une session de test
    const sessionTest = {
      sessionId: 123,
      sujet: 'Session Test Manuel',
      date: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
      heure: new Date(Date.now() + 2 * 60 * 1000).toTimeString().split(' ')[0],
      duree: 60,
      lieu: 'Test Location',
      notes: 'Session de test manuelle'
    };
    
    // Déclencher manuellement
    this.sessionNotificationService.processerSessions([sessionTest]);
  }
  
  checkApi(): void {
    console.log('Vérification manuelle de l\'API');
    // Forcer une vérification immédiate
    this.sessionNotificationService.checkSessionsProches().subscribe();
  }
  
  clearAll(): void {
    console.log('Nettoyage de toutes les popups');
    this.sessionNotificationService.fermerToutesLesPopups();
  }
}
