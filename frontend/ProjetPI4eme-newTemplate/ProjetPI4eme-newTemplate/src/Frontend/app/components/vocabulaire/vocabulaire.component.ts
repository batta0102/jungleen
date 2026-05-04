import { Component, OnInit, OnDestroy } from '@angular/core';
import { OcrService } from '../../services/ocr.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface VocabulaireItem {
  id: number;
  mot: string;
  traduction: string;
  foisVu: number;
  dateDernierScan: string;
}

@Component({
  selector: 'app-vocabulaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vocabulaire.component.html',
  styleUrls: ['./vocabulaire.component.css']
})
export class VocabulaireComponent implements OnInit, OnDestroy {
  // Données
  vocabulaire: VocabulaireItem[] = [];
  filteredVocabulaire: VocabulaireItem[] = [];
  
  // États
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  
  // Filtres
  searchTerm = '';
  sortBy = 'foisVu'; // 'foisVu' | 'alphabetical' | 'date'
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  
  private destroy$ = new Subject<void>();

  constructor(private ocrService: OcrService) {}

  ngOnInit(): void {
    this.loadVocabulaire();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger le vocabulaire depuis l'API
   */
  loadVocabulaire(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    const userId = this.ocrService.getCurrentUserId();
    const clubId = 4; // Club ID par défaut
    
    this.ocrService.getVocabulaire(userId, clubId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vocabulaire) => {
          this.vocabulaire = vocabulaire;
          this.applyFiltersAndSort();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement vocabulaire:', error);
          this.errorMessage = 'Impossible de charger le vocabulaire';
          this.isLoading = false;
        }
      });
  }

  /**
   * Supprimer un mot du vocabulaire
   */
  supprimerMot(motId: number, mot: string): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le mot "${mot}" ?`)) {
      return;
    }
    
    this.ocrService.supprimerDuVocabulaire(motId).subscribe({
      next: () => {
        this.vocabulaire = this.vocabulaire.filter(item => item.id !== motId);
        this.applyFiltersAndSort();
        this.showSuccess('Mot supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur suppression mot:', error);
        this.errorMessage = 'Erreur lors de la suppression du mot';
      }
    });
  }

  /**
   * Appliquer les filtres et le tri
   */
  applyFiltersAndSort(): void {
    // Filtrer par terme de recherche
    let filtered = this.vocabulaire;
    
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.mot.toLowerCase().includes(searchLower) ||
        item.traduction.toLowerCase().includes(searchLower)
      );
    }
    
    // Trier
    switch (this.sortBy) {
      case 'foisVu':
        filtered.sort((a, b) => b.foisVu - a.foisVu);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.mot.localeCompare(b.mot));
        break;
      case 'date':
        filtered.sort((a, b) => new Date(b.dateDernierScan).getTime() - new Date(a.dateDernierScan).getTime());
        break;
    }
    
    this.filteredVocabulaire = filtered;
    this.updatePagination();
  }

  /**
   * Mettre à jour la pagination
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVocabulaire.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  /**
   * Obtenir les éléments de la page actuelle
   */
  getPaginatedItems(): VocabulaireItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredVocabulaire.slice(startIndex, endIndex);
  }

  /**
   * Changer de page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir le niveau de maîtrise
   */
  getMasteryLevel(foisVu: number): { level: string; color: string; icon: string } {
    if (foisVu >= 10) {
      return { level: 'Expert', color: 'text-green-600', icon: '🏆' };
    } else if (foisVu >= 5) {
      return { level: 'Intermédiaire', color: 'text-blue-600', icon: '📈' };
    } else {
      return { level: 'Débutant', color: 'text-orange-600', icon: '🌱' };
    }
  }

  /**
   * Afficher un message de succès
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  /**
   * Effacer les messages
   */
  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Obtenir le nombre de mots maîtrisés
   */
  getMotsMaitrises(): number {
    return this.vocabulaire.filter(m => m.foisVu >= 5).length;
  }

  /**
   * Obtenir les pages à afficher
   */
  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, this.currentPage + half);
    
    if (end - start < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
