import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ForumAdvancedService, SearchResult } from '../../services/forum-advanced.service';

@Component({
  selector: 'app-forum-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-search.component.html',
  styleUrls: ['./forum-search.component.scss']
})
export class ForumSearchComponent implements OnInit {
  searchQuery = '';
  searchResults: SearchResult[] = [];
  isSearching = false;
  hasSearched = false;
  
  @Output() searchResultSelected = new EventEmitter<SearchResult>();
  
  private searchSubject = new Subject<string>();

  constructor(
    private forumAdvancedService: ForumAdvancedService
  ) {}

  ngOnInit(): void {
    // Configuration du debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  /**
   * Déclenche la recherche quand l'utilisateur tape
   */
  onSearchInput(): void {
    if (this.searchQuery.trim()) {
      this.searchSubject.next(this.searchQuery.trim());
    } else {
      this.clearSearch();
    }
  }

  /**
   * Effectue la recherche
   */
  private performSearch(query: string): void {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    // Simulation - à remplacer avec le vrai clubId
    const clubId = 1;
    
    this.forumAdvancedService.searchMessages(clubId, query).subscribe({
      next: (results: SearchResult[]) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors de la recherche:', error);
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  /**
   * Sélectionne un résultat de recherche
   */
  selectResult(result: SearchResult): void {
    this.searchResultSelected.emit(result);
    this.clearSearch();
  }

  /**
   * Vide la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
    this.isSearching = false;
  }

  /**
   * Met en évidence le terme de recherche
   */
  highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Formate la date du résultat
   */
  formatDate(date: Date): string {
    const now = new Date();
    const resultDate = new Date(date);
    const diffMs = now.getTime() - resultDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else if (diffDays < 30) {
      return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    } else {
      return resultDate.toLocaleDateString('fr-FR');
    }
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByResultId(index: number, result: SearchResult): number {
    return result.messageId;
  }
}
