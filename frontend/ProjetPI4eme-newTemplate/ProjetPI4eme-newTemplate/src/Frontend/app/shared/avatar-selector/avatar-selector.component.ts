import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarsService, AvatarDto, SkinDto } from '../../core/avatars/avatars.service';

/**
 * Avatar selector component with tabs for avatars and skin categories
 */
@Component({
  selector: 'app-avatar-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-selector.component.html',
  styleUrls: ['./avatar-selector.component.scss']
})
export class AvatarSelectorComponent implements OnInit {
  readonly avatars = signal<AvatarDto[]>([]);
  readonly skins = signal<SkinDto[]>([]);
  readonly selectedAvatarId = signal<number | null>(null);
  readonly equipped = signal<Record<string, number | null>>(this.loadEquipped());
  
  // Active tab: 'avatars' | 'hoodies' | 'hats' | 'glasses'
  readonly activeTab = signal<string>('avatars');

  constructor(private svc: AvatarsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Loads avatars and skins from the service
   */
  private loadData(): void {
    this.svc.getAvatars().subscribe({ 
      next: (a) => this.avatars.set(a || []),
      error: (err) => console.error('Failed to load avatars:', err)
    });
    
    this.svc.getSkins().subscribe({ 
      next: (s) => this.skins.set(s || []),
      error: (err) => console.error('Failed to load skins:', err)
    });

    // Load persisted avatar if any
    const sel = this.loadSelectedAvatar();
    if (sel) this.selectedAvatarId.set(sel);
  }

  /**
   * Sets the active tab
   * @param tab - Tab to activate
   */
  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  /**
   * Selects an avatar
   * @param id - Avatar ID to select
   */
  selectAvatar(id: number): void {
    this.selectedAvatarId.set(id);
    try { 
      localStorage.setItem('selectedAvatarId', String(id)); 
    } catch (error) {
      console.error('Failed to save selected avatar:', error);
    }
  }

  /**
   * Equips a skin
   * @param category - Skin category
   * @param skinId - Skin ID to equip
   */
  equip(category: string, skinId: number): void {
    this.equipped.update((e) => ({ ...e, [category]: skinId }));
    this.saveEquipped(this.equipped());
  }

  /**
   * Unequips a skin from a category
   * @param category - Skin category
   */
  unequip(category: string): void {
    this.equipped.update((e) => ({ ...e, [category]: null }));
    this.saveEquipped(this.equipped());
  }

  /**
   * Gets skins for a specific category, optionally filtered by selected avatar
   * @param category - Skin category to filter
   * @returns Filtered array of skins
   */
  skinsForCategory(category: string): SkinDto[] {
    const id = this.selectedAvatarId();
    const all = this.skins();
    
    return all.filter(s => 
      s.category === category && 
      (!s.avatar || (s.avatar as any).id === id || (s as any).avatarId === id)
    );
  }

  /**
   * Checks if a skin is currently equipped
   * @param category - Skin category
   * @param skinId - Skin ID
   * @returns True if equipped
   */
  isEquipped(category: string, skinId: number): boolean {
    return this.equipped()[category] === skinId;
  }

  private saveEquipped(obj: Record<string, number | null>) {
    try { localStorage.setItem('equippedSkins', JSON.stringify(obj)); } catch {}
  }

  private loadEquipped(): Record<string, number | null> {
    try { const raw = localStorage.getItem('equippedSkins'); if (raw) return JSON.parse(raw); } catch {}
    return { hoodie: null, hat: null, glasses: null };
  }

  private loadSelectedAvatar(): number | null {
    try { const v = localStorage.getItem('selectedAvatarId'); if (v) return Number(v); } catch {}
    return null;
  }
}
