import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { Delivery, DeliveryStatus, DeliveryStatusLabels, UpdateDeliveryRequest, DeliveryStats } from '../../models/delivery.model';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

/**
 * Delivery Management Component
 * Admin interface for managing deliveries/shipments
 */
@Component({
  selector: 'app-delivery-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './delivery-management.component.html',
  styleUrls: ['./delivery-management.component.scss']
})
export class DeliveryManagementComponent implements OnInit {
  private deliveryService = inject(DeliveryService);

  // State
  deliveries = signal<Delivery[]>([]);
  filteredDeliveries = signal<Delivery[]>([]);
  stats = signal<DeliveryStats | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Pagination
  page = signal(1);
  pageSize = 10;

  pageCount = computed(() => Math.max(1, Math.ceil(this.filteredDeliveries().length / this.pageSize)));
  pagedDeliveries = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredDeliveries().slice(start, start + this.pageSize);
  });

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  // Filters
  searchTerm = signal('');
  statusFilter = signal<string>('ALL');
  
  // Edit modal
  isEditModalOpen = signal(false);
  editingDelivery = signal<Delivery | null>(null);
  editForm: UpdateDeliveryRequest = {};

  // Status options
  statuses: DeliveryStatus[] = [
    'PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 
    'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'
  ];
  statusLabels = DeliveryStatusLabels;

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadStats();
  }

  /**
   * Load all deliveries
   */
  loadDeliveries(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.deliveryService.getAllDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries.set(deliveries);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[DeliveryManagement] Error loading deliveries:', err);
        this.error.set('Failed to load deliveries. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load delivery statistics
   */
  loadStats(): void {
    this.deliveryService.getDeliveryStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('[DeliveryManagement] Error loading stats:', err);
        // Calculate stats locally from deliveries
        this.calculateLocalStats();
      }
    });
  }

  /**
   * Calculate statistics locally from loaded deliveries
   */
  private calculateLocalStats(): void {
    const deliveries = this.deliveries();
    const stats: DeliveryStats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING').length,
      inTransit: deliveries.filter(d => d.status === 'SHIPPED' || d.status === 'IN_TRANSIT' || d.status === 'OUT_FOR_DELIVERY').length,
      delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
      failed: deliveries.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED' || d.status === 'RETURNED').length
    };
    this.stats.set(stats);
  }

  /**
   * Apply search and status filters
   */
  applyFilters(): void {
    let filtered = [...this.deliveries()];

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(d => 
        d.customerName?.toLowerCase().includes(search) ||
        d.trackingNumber?.toLowerCase().includes(search) ||
        d.address?.toLowerCase().includes(search) ||
        d.city?.toLowerCase().includes(search) ||
        String(d.orderId).includes(search)
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status !== 'ALL') {
      filtered = filtered.filter(d => d.status === status);
    }

    this.filteredDeliveries.set(filtered);
  }

  /**
   * Handle search input
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applyFilters();
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.applyFilters();
  }

  /**
   * Open edit modal
   */
  openEditModal(delivery: Delivery): void {
    this.editingDelivery.set(delivery);
    this.editForm = {
      address: delivery.address,
      city: delivery.city,
      postalCode: delivery.postalCode,
      country: delivery.country,
      phoneNumber: delivery.phoneNumber,
      status: delivery.status,
      trackingNumber: delivery.trackingNumber,
      carrier: delivery.carrier,
      notes: delivery.notes
    };
    this.isEditModalOpen.set(true);
  }

  /**
   * Close edit modal
   */
  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingDelivery.set(null);
    this.editForm = {};
  }

  /**
   * Save delivery changes
   */
  saveDelivery(): void {
    const delivery = this.editingDelivery();
    if (!delivery?.idDelivery) return;

    this.deliveryService.updateDelivery(delivery.idDelivery, this.editForm).subscribe({
      next: (updated) => {
        console.log('[DeliveryManagement] Delivery updated:', updated);
        this.loadDeliveries();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('[DeliveryManagement] Error updating delivery:', err);
        alert('Failed to update delivery. Please try again.');
      }
    });
  }

  /**
   * Quick status update
   */
  updateStatus(delivery: Delivery, newStatus: DeliveryStatus): void {
    if (!delivery.idDelivery) return;

    this.deliveryService.updateDeliveryStatus(delivery.idDelivery, newStatus).subscribe({
      next: (updated) => {
        console.log('[DeliveryManagement] Status updated:', updated);
        this.loadDeliveries();
        this.calculateLocalStats();
      },
      error: (err) => {
        console.error('[DeliveryManagement] Error updating status:', err);
        alert('Failed to update status. Please try again.');
      }
    });
  }

  /**
   * Delete delivery
   */
  deleteDelivery(delivery: Delivery): void {
    if (!delivery.idDelivery) return;
    
    if (confirm(`Are you sure you want to delete delivery for order #${delivery.orderId}?`)) {
      this.deliveryService.deleteDelivery(delivery.idDelivery).subscribe({
        next: () => {
          console.log('[DeliveryManagement] Delivery deleted');
          this.loadDeliveries();
          this.calculateLocalStats();
        },
        error: (err) => {
          console.error('[DeliveryManagement] Error deleting delivery:', err);
          alert('Failed to delete delivery. Please try again.');
        }
      });
    }
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: DeliveryStatus): string {
    switch (status) {
      case 'DELIVERED': return 'status-delivered';
      case 'SHIPPED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY': return 'status-transit';
      case 'PENDING':
      case 'PROCESSING': return 'status-pending';
      case 'FAILED':
      case 'CANCELLED':
      case 'RETURNED': return 'status-failed';
      default: return '';
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadDeliveries();
    this.loadStats();
  }
}
