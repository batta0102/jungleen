import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceService } from '../../services/resource.service';
import { ResourceResponse } from '../../models/resource.model';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceListComponent implements OnInit {
  private resourceService = inject(ResourceService);

  resources = signal<ResourceResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.loading.set(true);
    this.error.set(null);

    this.resourceService.getAll().subscribe({
      next: (data) => {
        console.log('%c=== BACKEND RESPONSE DEBUG ===', 'color: blue; font-weight: bold;');
        console.log('Total resources:', data.length);
        console.log('Raw data:', JSON.stringify(data, null, 2));
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('%c=== FIRST RESOURCE ANALYSIS ===', 'color: green; font-weight: bold;');
          const first = data[0];
          console.log('First resource:', first);
          console.table(first);
          
          const keys = Object.keys(first);
          console.log(`All field names: ${keys.join(', ')}`);
          
          console.log('%c=== FIELD VALUES ===', 'color: orange; font-weight: bold;');
          keys.forEach(key => {
            const value = (first as any)[key];
            console.log(`${key}: "${value}" (type: ${typeof value})`);
          });
          
          // Look for any field that might be an ID
          const possibleIdFields = keys.filter(k => 
            k.toLowerCase().includes('id') || 
            k.toLowerCase().includes('pk') || 
            k === 'id' ||
            k === 'ID' ||
            k === 'Id'
          );
          console.log('%c=== POSSIBLE ID FIELDS ===', 'color: red; font-weight: bold;');
          console.log('Fields containing "id" or "pk":', possibleIdFields);
          console.log('Please use one of these field names!');
        }
        
        this.resources.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading resources:', err);
        this.error.set(err.message || 'Failed to load resources');
        this.loading.set(false);
      }
    });
  }

  deleteResource(id: number | string | undefined): void {
    console.log('Delete called with ID:', id, 'Type:', typeof id);
    
    if (!id) {
      this.error.set('Cannot delete: Resource ID is missing or invalid');
      return;
    }
    
    if (confirm('Are you sure you want to delete this resource?')) {
      this.resourceService.delete(id as number).subscribe({
        next: () => {
          this.resources.update(resources =>
            resources.filter(r => r.resourceId !== id)
          );
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete resource');
        }
      });
    }
  }

  getTypeIcon(type: string): string {
    const typeMap: Record<string, string> = {
      'PDF': '📄',
      'Video': '🎥',
      'Audio': '🎧',
      'Document': '📋'
    };
    return typeMap[type] || '📎';
  }

  // Helper to get resource ID
  getResourceId(resource: any): number | string | undefined {
    const idValue = resource?.resourceId;
    console.log(`✓ Found ressource ID: ${idValue}`);
    return idValue;
  }

  // Debug method - call this in browser console to inspect structure
  inspectFirstResource(): void {
    if (this.resources().length > 0) {
      const first = this.resources()[0];
      console.log('%c=== RESOURCE STRUCTURE ===', 'color: purple; font-size: 14px; font-weight: bold;');
      console.log('JSON:', JSON.stringify(first, null, 2));
      console.log('Keys:', Object.keys(first).join(', '));
      return first as any;
    }
  }}