import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarsService, Avatar } from './avatars.service';

@Component({
  selector: 'app-avatars',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avatars.component.html',
  styleUrls: ['./avatars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarsComponent implements OnInit {
  readonly avatars = signal<Avatar[]>([]);
  readonly newAvatar = signal<Avatar>({ type: '', imageUrl: '' });
  readonly editAvatar = signal<Avatar | null>(null);
  readonly showPopup = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly editPreviewUrl = signal<string | null>(null);

  selectedFile: File | null = null;
  editSelectedFile: File | null = null;

  constructor(private svc: AvatarsService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.getAll().subscribe({
      next: (list) => this.avatars.set(list || []),
      error: (err) => console.error('Failed to load avatars:', err)
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
        this.newAvatar.update(a => ({ ...a, imageUrl: url }));
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
        this.editAvatar.update(a => a ? { ...a, imageUrl: url } : a);
      };
      reader.readAsDataURL(this.editSelectedFile);
    }
  }

  updateNewAvatar(field: keyof Avatar, value: any): void {
    this.newAvatar.update(a => ({ ...a, [field]: value }));
  }

  updateEditAvatar(field: keyof Avatar, value: any): void {
    this.editAvatar.update(a => a ? { ...a, [field]: value } : a);
  }

  create(): void {
    const avatar = this.newAvatar();
    if (!avatar.type || !this.selectedFile) return;
    this.svc.create(avatar, this.selectedFile).subscribe({
      next: () => {
        this.newAvatar.set({ type: '', imageUrl: '' });
        this.selectedFile = null;
        this.load();
        this.closePopup();
      },
      error: (err) => console.error('Failed to create avatar:', err)
    });
  }

  startEdit(a: Avatar): void {
    this.editAvatar.set({ ...a });
    this.editSelectedFile = null;
    this.editPreviewUrl.set(null);
  }

  update(): void {
    const avatar = this.editAvatar();
    if (!avatar || !avatar.id) return;
    this.svc.update(avatar.id, avatar, this.editSelectedFile).subscribe({
      next: () => {
        this.editAvatar.set(null);
        this.editSelectedFile = null;
        this.load();
      },
      error: (err) => console.error('Failed to update avatar:', err)
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this avatar?')) return;
    this.svc.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => console.error('Failed to delete avatar:', err)
    });
  }
}
