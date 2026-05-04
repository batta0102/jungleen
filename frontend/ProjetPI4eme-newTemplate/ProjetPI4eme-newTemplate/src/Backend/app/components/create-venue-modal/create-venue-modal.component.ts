import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../ui/modal.component';
import { VenueMapPickerComponent } from '../venue-map-picker/venue-map-picker.component';

export interface VenueFormData {
	name: string;
	address: string;
	city?: string;
	country?: string;
	postalCode?: string;
	capacity?: number | null;
	imageUrl?: string;
	equipmentCsv?: string;
	venueType?: string;
	maxParticipants?: number | null;
	latitude?: number | null;
	longitude?: number | null;
}

@Component({
	selector: 'app-create-venue-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, AppModalComponent, VenueMapPickerComponent],
	template: `
		<app-modal [isOpen]="isOpen" [title]="title" (close)="close()" [maxWidth]="'700px'">
			<form (ngSubmit)="handleSubmit()" class="space-y-5">
				<div class="grid grid-cols-2 gap-6">
					<!-- Left Column -->
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-text mb-1.5">Venue Name *</label>
							<input
								type="text"
								[(ngModel)]="form.name"
								name="name"
								class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
								placeholder="Enter name here"
							/>
							<p *ngIf="touched && !form.name" class="mt-1 text-xs text-red-600">Name is required.</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-text mb-1.5">Address *</label>
							<input
								type="text"
								[(ngModel)]="form.address"
								name="address"
								class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
								placeholder="5222 Wilma Ave"
							/>
							<p *ngIf="touched && !form.address" class="mt-1 text-xs text-red-600">Address is required.</p>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-sm font-medium text-text mb-1.5">City</label>
								<select
									[(ngModel)]="form.city"
									name="city"
									class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
								>
									<option value="">Select city</option>
									<option value="March 5">March 5</option>
									<option value="Tunis">Tunis</option>
									<option value="Sousse">Sousse</option>
									<option value="Sfax">Sfax</option>
									<option value="Paris">Paris</option>
									<option value="London">London</option>
									<option value="New York">New York</option>
								</select>
							</div>
							<div>
								<label class="block text-sm font-medium text-text mb-1.5">Country</label>
								<select
									[(ngModel)]="form.country"
									name="country"
									class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
								>
									<option value="">Select country</option>
									<option value="Tunisia">Tunisia</option>
									<option value="France">France</option>
									<option value="UK">UK</option>
									<option value="USA">USA</option>
									<option value="Germany">Germany</option>
								</select>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-sm font-medium text-text mb-1.5">Postal Code</label>
								<input
									type="text"
									[(ngModel)]="form.postalCode"
									name="postalCode"
									class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
									placeholder="e.g. 1000"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-text mb-1.5">Capacity</label>
								<input
									type="number"
									[(ngModel)]="form.capacity"
									name="capacity"
									class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
									placeholder="10:00"
									min="0"
								/>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-text mb-1.5">Max Participants</label>
							<input
								type="number"
								[(ngModel)]="form.maxParticipants"
								name="maxParticipants"
								class="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
								placeholder="Enter numbers"
								min="0"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-text mb-2">Equipment</label>
							<div class="grid grid-cols-2 gap-2">
								<label *ngFor="let eq of equipmentOptions" class="flex items-center gap-2 cursor-pointer">
									<input 
										type="checkbox" 
										[checked]="isEquipmentSelected(eq)"
										(change)="toggleEquipment(eq)"
										class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
									/>
									<span class="text-sm text-text">{{ eq }}</span>
								</label>
							</div>
						</div>
					</div>

					<!-- Right Column -->
					<div class="space-y-4">
						<!-- Interactive Map -->
						<div>
							<label class="block text-sm font-medium text-text mb-2">Location Map</label>
							<app-venue-map-picker 
								[initialLocation]="form"
								(locationSelected)="onLocationSelected($event)"
							></app-venue-map-picker>
						</div>

						<!-- Venue Type -->
						<div>
							<label class="block text-sm font-medium text-text mb-2">Venue Type</label>
							<div class="space-y-2">
								<label *ngFor="let type of venueTypes" class="flex items-center gap-2 cursor-pointer">
									<input 
										type="radio" 
										name="venueType"
										[value]="type"
										[(ngModel)]="form.venueType"
										class="w-4 h-4 text-primary border-border focus:ring-primary"
									/>
									<span class="text-sm text-text">{{ type }}</span>
								</label>
							</div>
						</div>

						<!-- Calendar -->
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-text">{{ currentMonth }}</span>
								<div class="flex gap-1">
									<button type="button" (click)="prevMonth()" class="p-1 hover:bg-light rounded">
										<span class="text-xs">‹</span>
									</button>
									<span class="text-xs text-secondary px-2 py-1">{{ currentTime }}</span>
									<button type="button" (click)="nextMonth()" class="p-1 hover:bg-light rounded">
										<span class="text-xs">›</span>
									</button>
								</div>
							</div>
							<div class="grid grid-cols-7 gap-1 text-center text-xs">
								<span *ngFor="let day of calendarDays" class="text-secondary py-1">{{ day }}</span>
								<span *ngFor="let date of calendarDates" 
									[class]="'py-1.5 rounded cursor-pointer ' + 
										(date === selectedCalendarDate ? 'bg-primary text-white' : 
										(date ? 'hover:bg-light text-text' : ''))"
									(click)="date && selectCalendarDate(date)"
								>
									{{ date || '' }}
								</span>
							</div>
							<p *ngIf="selectedCalendarDate" class="mt-2 text-xs text-primary">English Workshop</p>
						</div>
					</div>
				</div>

				<!-- Venue Image -->
				<div class="pt-4 border-t border-border">
					<label class="block text-sm font-medium text-text mb-2">Venue Image</label>
					<div 
						class="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
						(click)="venueImageFileInput.click()"
					>
						<input 
							type="file" 
							#venueImageFileInput 
							(change)="onVenueImageSelected($event)" 
							accept="image/*" 
							class="hidden" 
							name="venueImageFile" 
						/>
						<div *ngIf="!form.imageUrl" class="space-y-2">
							<div class="w-10 h-10 mx-auto bg-light rounded-lg flex items-center justify-center">
								<span class="text-xl text-secondary">🖼️</span>
							</div>
							<p class="text-sm text-secondary">Drag & drop or</p>
							<button type="button" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
								Upload Image
							</button>
						</div>
						<div *ngIf="form.imageUrl" class="relative">
							<img [src]="form.imageUrl" alt="Venue preview" class="w-full h-40 object-cover rounded-lg" />
							<button 
								type="button" 
								(click)="form.imageUrl = ''; $event.stopPropagation()"
								class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-secondary hover:text-red-500"
							>
								×
							</button>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="mt-6 pt-4 border-t border-border flex justify-end gap-3">
					<button
						type="button"
						(click)="close()"
						class="px-5 py-2.5 border border-border rounded-lg text-text text-sm font-medium hover:bg-light transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
					>
						{{ submitLabel }}
					</button>
				</div>
			</form>
		</app-modal>
	`,
	styles: []
})
export class CreateVenueModalComponent {
	@Input() isOpen = false;
	@Input() title = 'Create Venue';
	@Input() submitLabel = 'Save Venue';
	@Input() initialData: Partial<VenueFormData> | null = null;

	@Output() onClose = new EventEmitter<void>();
	@Output() onSubmit = new EventEmitter<VenueFormData>();

	touched = false;

	equipmentOptions = ['Projector', 'WiFi', 'Speakers', 'Air conditioning', 'Whiteboard', 'Chairs'];
	venueTypes = ['Classroom', 'Conference Room', 'Auditorium', 'Outdoor Space'];
	
	calendarDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	calendarDates: (number | null)[] = [];
	selectedCalendarDate: number | null = null;
	currentMonthDate = new Date();

	form: VenueFormData = {
		name: '',
		address: '',
		city: '',
		country: '',
		postalCode: '',
		capacity: null,
		imageUrl: '',
		equipmentCsv: '',
		venueType: 'Classroom',
		maxParticipants: null,
		latitude: null,
		longitude: null
	};

	get currentMonth(): string {
		return this.currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	get currentTime(): string {
		return '2:05 5:10 PM';
	}

	constructor() {
		this.generateCalendar();
	}

	ngOnChanges(): void {
		if (!this.isOpen) return;
		if (!this.initialData) {
			this.reset();
			return;
		}
		this.form = {
			name: this.initialData.name ?? '',
			address: this.initialData.address ?? '',
			city: this.initialData.city ?? '',
			country: this.initialData.country ?? '',
			postalCode: this.initialData.postalCode ?? '',
			capacity: this.initialData.capacity ?? null,
			imageUrl: this.initialData.imageUrl ?? '',
			equipmentCsv: this.initialData.equipmentCsv ?? '',
			venueType: this.initialData.venueType ?? 'Classroom',
			maxParticipants: this.initialData.maxParticipants ?? null,
			latitude: this.initialData.latitude ?? null,
			longitude: this.initialData.longitude ?? null
		};
		this.touched = false;
	}

	generateCalendar(): void {
		const year = this.currentMonthDate.getFullYear();
		const month = this.currentMonthDate.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		
		this.calendarDates = [];
		for (let i = 0; i < firstDay; i++) {
			this.calendarDates.push(null);
		}
		for (let i = 1; i <= daysInMonth; i++) {
			this.calendarDates.push(i);
		}
	}

	prevMonth(): void {
		this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() - 1);
		this.currentMonthDate = new Date(this.currentMonthDate);
		this.generateCalendar();
	}

	nextMonth(): void {
		this.currentMonthDate.setMonth(this.currentMonthDate.getMonth() + 1);
		this.currentMonthDate = new Date(this.currentMonthDate);
		this.generateCalendar();
	}

	selectCalendarDate(date: number): void {
		this.selectedCalendarDate = this.selectedCalendarDate === date ? null : date;
	}

	isEquipmentSelected(eq: string): boolean {
		const items = (this.form.equipmentCsv || '').split(',').map(s => s.trim().toLowerCase());
		return items.includes(eq.toLowerCase());
	}

	toggleEquipment(eq: string): void {
		const items = (this.form.equipmentCsv || '').split(',').map(s => s.trim()).filter(s => s);
		const idx = items.findIndex(s => s.toLowerCase() === eq.toLowerCase());
		if (idx === -1) {
			items.push(eq);
		} else {
			items.splice(idx, 1);
		}
		this.form.equipmentCsv = items.join(', ');
	}

	onLocationSelected(location: any): void {
		this.form.address = location.address;
		this.form.city = location.city;
		this.form.country = location.country;
		this.form.postalCode = location.postalCode;
		this.form.latitude = location.latitude;
		this.form.longitude = location.longitude;
	}

	close(): void {
		this.onClose.emit();
		this.reset();
	}

	handleSubmit(): void {
		this.touched = true;
		if (!this.isValid()) return;
		this.onSubmit.emit({ ...this.form, capacity: this.form.capacity ?? null });
		this.reset();
		this.onClose.emit();
	}

	onVenueImageSelected(event: any): void {
		const file = event?.target?.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) return;

		// Compress image before storing
		this.compressImage(file, 800, 0.7).then((compressedBase64) => {
			this.form.imageUrl = compressedBase64;
		}).catch(() => {
			alert('Failed to process image');
		});
	}

	private compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement('canvas');
					let width = img.width;
					let height = img.height;

					// Scale down if wider than maxWidth
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}

					canvas.width = width;
					canvas.height = height;

					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Failed to get canvas context'));
						return;
					}

					ctx.drawImage(img, 0, 0, width, height);
					
					// Convert to JPEG with compression
					const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
					resolve(compressedBase64);
				};
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = e.target?.result as string;
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	private isValid(): boolean {
		if (!this.form.name?.trim()) return false;
		if (!this.form.address?.trim()) return false;
		if (this.form.postalCode && !this.isPostalCodeValid(this.form.postalCode)) return false;
		return true;
	}

	isPostalCodeValid(value: string): boolean {
		const v = value.trim();
		if (!v) return true;
		return /^(?=.{4,10}$).+$/.test(v);
	}

	private reset(): void {
		this.form = {
			name: '',
			address: '',
			city: '',
			country: '',
			postalCode: '',
			capacity: null,
			imageUrl: '',
			equipmentCsv: '',
			venueType: 'Classroom',
			maxParticipants: null,
			latitude: null,
			longitude: null
		};
		this.touched = false;
		this.selectedCalendarDate = null;
	}
}
