import { 
  Component, 
  EventEmitter, 
  Input, 
  OnInit, 
  OnDestroy, 
  Output, 
  ViewChild, 
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import L from 'leaflet';
import 'leaflet-control-geocoder';

// Fix for Leaflet marker icons in Angular
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

@Component({
  selector: 'app-venue-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-3">
      <!-- Search Input -->
      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (keyup.enter)="searchLocation()"
          placeholder="Search location..."
          class="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <button
          type="button"
          (click)="searchLocation()"
          class="absolute right-2 top-2.5 px-3 py-1.5 bg-primary text-white text-sm rounded hover:opacity-90"
        >
          Search
        </button>
      </div>

      <!-- Map Container -->
      <div 
        #mapContainer 
        class="rounded-lg border border-border overflow-hidden shadow-sm"
        style="position: relative; width: 100%; height: 320px; min-height: 320px;"
      ></div>

      <!-- Location Details Display -->
      <div *ngIf="selectedLocation" class="bg-light p-3 rounded-lg border border-border text-sm">
        <div class="space-y-2">
          <div><strong>Address:</strong> {{ selectedLocation.address }}</div>
          <div><strong>City:</strong> {{ selectedLocation.city }}</div>
          <div><strong>Country:</strong> {{ selectedLocation.country }}</div>
          <div *ngIf="selectedLocation.postalCode"><strong>Postal Code:</strong> {{ selectedLocation.postalCode }}</div>
          <div class="text-xs text-secondary">
            Lat: {{ selectedLocation.latitude.toFixed(6) }}, Lon: {{ selectedLocation.longitude.toFixed(6) }}
          </div>
        </div>
      </div>

      <!-- Info Message -->
      <div class="text-xs text-secondary bg-blue-50 p-2 rounded border border-blue-200">
        💡 Click on the map to select a location, or use the search box to find a specific address.
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .leaflet-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    :host ::ng-deep .leaflet-control-geocoder-form input {
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      padding: 6px 8px;
      font-size: 13px;
    }

    :host ::ng-deep .leaflet-popup-content {
      margin: 8px 0;
      font-size: 13px;
    }

    :host ::ng-deep .leaflet-control-geocoder {
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    :host ::ng-deep .leaflet-marker-icon {
      filter: hue-rotate(200deg);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VenueMapPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLElement>;
  
  @Input() initialLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  @Output() locationSelected = new EventEmitter<LocationData>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private geocoder: any = null;

  searchQuery = '';
  selectedLocation: LocationData | null = null;

  ngOnInit(): void {
    if (this.initialLocation) {
      this.selectedLocation = {
        latitude: this.initialLocation.latitude || 35.8,
        longitude: this.initialLocation.longitude || 10.2,
        address: this.initialLocation.address || '',
        city: this.initialLocation.city || '',
        postalCode: this.initialLocation.postalCode || '',
        country: this.initialLocation.country || ''
      };
    }
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private initializeMap(): void {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    const containerEl = this.mapContainer.nativeElement;
    
    // Ensure container has height
    if (containerEl.offsetHeight === 0) {
      containerEl.style.height = '320px';
    }

    if (this.map !== null) {
      return; // Already initialized
    }

    const defaultLat = this.selectedLocation?.latitude || 35.8;
    const defaultLon = this.selectedLocation?.longitude || 10.2;

    try {
      // Create map
      this.map = L.map(containerEl).setView([defaultLat, defaultLon], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
        crossOrigin: 'anonymous'
      }).addTo(this.map);

      // Add marker if location is selected
      if (this.selectedLocation) {
        this.addMarker(this.selectedLocation.latitude, this.selectedLocation.longitude);
      }

      // Add click to select location
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.selectLocationFromCoordinates(e.latlng.lat, e.latlng.lng);
      });

      // Add geocoder control
      this.setupGeocoder();

      // Invalidate size to ensure map renders properly
      this.map.invalidateSize(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  private setupGeocoder(): void {
    if (!this.map) return;

    try {
      this.geocoder = (L.Control as any).geocoder({
        defaultMarkGeocode: false,
        position: 'topleft'
      })
      .on('markgeocode', (result: any) => {
        const { center, name } = result.geocode;
        this.selectLocationFromCoordinates(center.lat, center.lng, name);
      })
      .addTo(this.map);
    } catch (e) {
      console.warn('Geocoder control not available');
    }
  }

  private addMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
    }

    if (!this.map) return;

    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);

    // Update location when marker is dragged
    this.marker.on('dragend', () => {
      const latlng = this.marker!.getLatLng();
      this.selectLocationFromCoordinates(latlng.lat, latlng.lng);
    });

    // Center map on marker
    this.map.setView([lat, lng], 13);
  }

  private selectLocationFromCoordinates(lat: number, lng: number, addressName?: string): void {
    this.addMarker(lat, lng);
    this.reverseGeocode(lat, lng, addressName);
  }

  private reverseGeocode(lat: number, lng: number, addressName?: string): void {
    // Using OpenStreetMap's Nominatim API for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const address = data.address;
        const road = address.road || address.village || address.town || address.city || '';
        const houseNumber = address.house_number || '';
        const fullAddress = houseNumber ? `${houseNumber} ${road}` : road;

        this.selectedLocation = {
          latitude: lat,
          longitude: lng,
          address: addressName || fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: address.city || address.town || address.village || '',
          country: address.country || '',
          postalCode: address.postcode || ''
        };

        this.locationSelected.emit(this.selectedLocation);

        // Add popup to marker
        if (this.marker) {
          this.marker.bindPopup(`
            <div class="text-sm">
              <strong>${this.selectedLocation.address}</strong><br>
              ${this.selectedLocation.city}<br>
              ${this.selectedLocation.country}
            </div>
          `).openPopup();
        }
      })
      .catch((error) => {
        console.warn('Reverse geocoding failed:', error);
        this.selectedLocation = {
          latitude: lat,
          longitude: lng,
          address: addressName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: '',
          country: '',
          postalCode: ''
        };
        this.locationSelected.emit(this.selectedLocation);
      });
  }

  searchLocation(): void {
    if (!this.searchQuery.trim()) return;

    // Using OpenStreetMap's Nominatim API for forward geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}`;

    fetch(url)
      .then((response) => response.json())
      .then((results) => {
        if (results.length === 0) {
          alert('Location not found. Please try a different search.');
          return;
        }

        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        this.selectLocationFromCoordinates(lat, lng, result.display_name);
      })
      .catch((error) => {
        console.error('Search failed:', error);
        alert('Search failed. Please try again.');
      });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
