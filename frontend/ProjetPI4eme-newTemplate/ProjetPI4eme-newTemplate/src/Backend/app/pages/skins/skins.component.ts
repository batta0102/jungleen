import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkinsService, Skin } from './skins.service';
import { AvatarsService } from '../avatars/avatars.service';

@Component({
  selector: 'app-skins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skins.component.html',
  styleUrls: ['./skins.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkinsComponent implements OnInit {
  readonly skins = signal<Skin[]>([]);
  readonly avatars = signal<any[]>([]);
  readonly newSkin = signal<Skin>({ category: 'hoodie', name: '', imageUrl: '', unlockLevel: 0, avatar: null });
  readonly editSkin = signal<Skin | null>(null);
  readonly showPopup = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly editPreviewUrl = signal<string | null>(null);

  selectedFile: File | null = null;
  editSelectedFile: File | null = null;

  constructor(private svc: SkinsService, private avatarSvc: AvatarsService) {}

  ngOnInit(): void {
    this.load();
    this.avatarSvc.getAll().subscribe({
      next: (a) => this.avatars.set(a || []),
      error: (err) => console.error('Failed to load avatars:', err)
    });
  }

  load(): void {
    this.svc.getAll().subscribe({
      next: (list) => this.skins.set(list || []),
      error: (err) => console.error('Failed to load skins:', err)
    });
  }

  openPopup(): void {
    this.showPopup.set(true);
    this.selectedFile = null;
    this.previewUrl.set(null);
  }

  closePopup(): void {
    this.showPopup.set(false);
    this.selectedFile = null;
    this.previewUrl.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.previewUrl.set(url);
        this.newSkin.update(s => ({ ...s, imageUrl: url }));
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editSelectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.editPreviewUrl.set(url);
        this.editSkin.update(s => s ? { ...s, imageUrl: url } : s);
      };
      reader.readAsDataURL(this.editSelectedFile);
    }
  }

  updateNewSkin(field: keyof Skin, value: any): void {
    this.newSkin.update(s => ({ ...s, [field]: value }));
  }

  updateEditSkin(field: keyof Skin, value: any): void {
    this.editSkin.update(s => s ? { ...s, [field]: value } : s);
  }

  create(): void {
    const skin = this.newSkin();
    if (!skin.name || !skin.category || !this.selectedFile) return;
    this.svc.create(skin, this.selectedFile).subscribe({
      next: () => {
        this.newSkin.set({ category: 'hoodie', name: '', imageUrl: '', unlockLevel: 0, avatar: null });
        this.selectedFile = null;
        this.load();
        this.closePopup();
      },
      error: (err) => console.error('Failed to create skin:', err)
    });
  }

  startEdit(s: Skin): void {
    this.editSkin.set({ ...s });
    this.editSelectedFile = null;
    this.editPreviewUrl.set(null);
  }

  update(): void {
    const skin = this.editSkin();
    if (!skin || !skin.id) return;
    this.svc.update(skin.id, skin, this.editSelectedFile).subscribe({
      next: () => {
        this.editSkin.set(null);
        this.editSelectedFile = null;
        this.load();
      },
      error: (err) => console.error('Failed to update skin:', err)
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this skin?')) return;
    this.svc.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => console.error('Failed to delete skin:', err)
    });
  }
}
