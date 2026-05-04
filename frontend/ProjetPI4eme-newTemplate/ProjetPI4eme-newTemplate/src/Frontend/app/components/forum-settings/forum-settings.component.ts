import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ForumAdvancedService, ForumSettings } from '../../services/forum-advanced.service';

@Component({
  selector: 'app-forum-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum-settings.component.html',
  styleUrls: ['./forum-settings.component.scss']
})
export class ForumSettingsComponent implements OnInit {
  settings: ForumSettings = {
    infiniteScroll: true,
    notifications: true,
    editing: true,
    reporting: true,
    badges: true,
    search: true,
    pinning: true,
    itemsPerPage: 10
  };
  
  loading = false;
  saved = false;
  
  private subscriptions = new Subscription();

  constructor(
    private forumAdvancedService: ForumAdvancedService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  /**
   * Charge les paramètres du forum
   */
  private loadSettings(): void {
    this.loading = true;
    
    const settingsSub = this.forumAdvancedService.getSettings().subscribe({
      next: (settings: ForumSettings) => {
        this.settings = { ...settings };
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des paramètres:', error);
        this.loading = false;
      }
    });

    this.subscriptions.add(settingsSub);
  }

  /**
   * Met à jour un paramètre
   */
  updateSetting(key: keyof ForumSettings, value: boolean | number): void {
    (this.settings as any)[key] = value;
    this.forumAdvancedService.updateSetting(key, value);
    this.showSavedFeedback();
  }

  /**
   * Sauvegarde tous les paramètres
   */
  saveSettings(): void {
    this.forumAdvancedService.updateSetting('infiniteScroll', this.settings.infiniteScroll);
    this.forumAdvancedService.updateSetting('notifications', this.settings.notifications);
    this.forumAdvancedService.updateSetting('editing', this.settings.editing);
    this.forumAdvancedService.updateSetting('reporting', this.settings.reporting);
    this.forumAdvancedService.updateSetting('badges', this.settings.badges);
    this.forumAdvancedService.updateSetting('search', this.settings.search);
    this.forumAdvancedService.updateSetting('pinning', this.settings.pinning);
    this.forumAdvancedService.updateSetting('itemsPerPage', this.settings.itemsPerPage);
    
    this.showSavedFeedback();
  }

  /**
   * Affiche un feedback de sauvegarde
   */
  private showSavedFeedback(): void {
    this.saved = true;
    setTimeout(() => {
      this.saved = false;
    }, 2000);
  }

  /**
   * Réinitialise les paramètres par défaut
   */
  resetToDefaults(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      this.settings = {
        infiniteScroll: true,
        notifications: true,
        editing: true,
        reporting: true,
        badges: true,
        search: true,
        pinning: true,
        itemsPerPage: 10
      };
      this.saveSettings();
    }
  }

  /**
   * Retourne les options pour le nombre d'éléments par page
   */
  getItemsPerPageOptions(): number[] {
    return [5, 10, 15, 20, 25, 50];
  }
}
