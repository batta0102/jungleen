import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisponibiliteService } from '../../services/disponibilite.service';
import { Disponibilite } from '../../models/calendar.models';

@Component({
  selector: 'app-disponibilite-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disponibilite-test.component.html',
  styleUrls: ['./disponibilite-test.component.scss']
})
export class DisponibiliteTestComponent implements OnInit {
  
  // États de chargement
  loading = false;
  error: string | null = null;
  
  // Données
  upcomingSlots: Disponibilite[] = [];
  filteredSlots: Disponibilite[] = [];
  userSlots: Disponibilite[] = [];
  buddyPairSlots: Disponibilite[] = [];
  
  // IDs de test (à adapter selon vos données)
  testUserId = 1; // À modifier selon votre utilisateur
  testBuddyPairId = 10; // À modifier selon votre buddy pair
  
  constructor(private disponibiliteService: DisponibiliteService) {
    console.log('🧪 Composant de test initialisé');
  }

  ngOnInit(): void {
    console.log('🧪 Début des tests de disponibilités');
    this.testAllEndpoints();
  }

  /**
   * Teste tous les endpoints
   */
  testAllEndpoints(): void {
    console.log('🧪 === DÉBUT DES TESTS API ===');
    
    // 1. Test de connexion
    this.testConnection();
    
    // 2. Test des créneaux à venir
    this.loadUpcomingSlots();
    
    // 3. Test avec filtre
    this.loadFilteredSlots();
    
    // 4. Test par utilisateur
    this.loadUserSlots();
    
    // 5. Test par buddy pair
    this.loadBuddyPairSlots();
  }

  /**
   * Test de connexion à l'API
   */
  testConnection(): void {
    console.log('🔧 Test 1: Connexion API');
    this.disponibiliteService.testConnection().subscribe(
      (isConnected) => {
        console.log('🔧 Résultat connexion:', isConnected);
        if (!isConnected) {
          this.error = '❌ Impossible de se connecter à l\'API';
        }
      }
    );
  }

  /**
   * Charge les créneaux à venir
   */
  loadUpcomingSlots(): void {
    console.log('📅 Test 2: Créneaux à venir');
    this.loading = true;
    
    this.disponibiliteService.getUpcomingSlots().subscribe({
      next: (slots) => {
        console.log('📅 Créneaux à venir reçus:', slots);
        this.upcomingSlots = slots;
        this.loading = false;
        
        if (slots.length === 0) {
          console.warn('⚠️ Aucun créneau à venir trouvé');
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement créneaux à venir:', err);
        this.error = `Erreur: ${err.message}`;
        this.loading = false;
      }
    });
  }

  /**
   * Charge les créneaux avec filtre
   */
  loadFilteredSlots(): void {
    console.log('📅 Test 3: Créneaux avec filtre');
    
    this.disponibiliteService.getDisponibilitesWithFilter('upcoming').subscribe({
      next: (slots) => {
        console.log('📅 Créneaux filtrés reçus:', slots);
        this.filteredSlots = slots;
      },
      error: (err) => {
        console.error('❌ Erreur chargement créneaux filtrés:', err);
      }
    });
  }

  /**
   * Charge les créneaux d'un utilisateur
   */
  loadUserSlots(): void {
    console.log(`📅 Test 4: Créneaux utilisateur ${this.testUserId}`);
    
    this.disponibiliteService.getDisponibilitesByUser(this.testUserId).subscribe({
      next: (slots) => {
        console.log(`📅 Créneaux utilisateur ${this.testUserId}:`, slots);
        this.userSlots = slots;
      },
      error: (err) => {
        console.error(`❌ Erreur chargement créneaux utilisateur ${this.testUserId}:`, err);
      }
    });
  }

  /**
   * Charge les créneaux d'un buddy pair
   */
  loadBuddyPairSlots(): void {
    console.log(`📅 Test 5: Créneaux buddy pair ${this.testBuddyPairId}`);
    
    this.disponibiliteService.getDisponibilitesByBuddyPair(this.testBuddyPairId).subscribe({
      next: (slots) => {
        console.log(`📅 Créneaux buddy pair ${this.testBuddyPairId}:`, slots);
        this.buddyPairSlots = slots;
      },
      error: (err) => {
        console.error(`❌ Erreur chargement créneaux buddy pair ${this.testBuddyPairId}:`, err);
      }
    });
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcule la durée en minutes
   */
  calculateDuration(debut: Date, fin: Date): number {
    const start = new Date(debut).getTime();
    const end = new Date(fin).getTime();
    return Math.round((end - start) / (1000 * 60));
  }

  /**
   * Rafraîchit toutes les données
   */
  refresh(): void {
    console.log('🔄 Rafraîchissement des données');
    this.error = null;
    this.upcomingSlots = [];
    this.filteredSlots = [];
    this.userSlots = [];
    this.buddyPairSlots = [];
    this.testAllEndpoints();
  }

  /**
   * Change l'ID de test pour l'utilisateur
   */
  changeUserId(userId: number): void {
    console.log(`🔄 Changement userId: ${this.testUserId} → ${userId}`);
    this.testUserId = userId;
    this.userSlots = [];
    this.loadUserSlots();
  }

  /**
   * Change l'ID de test pour le buddy pair
   */
  changeBuddyPairId(buddyPairId: number): void {
    console.log(`🔄 Changement buddyPairId: ${this.testBuddyPairId} → ${buddyPairId}`);
    this.testBuddyPairId = buddyPairId;
    this.buddyPairSlots = [];
    this.loadBuddyPairSlots();
  }
}
