import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="pagination" aria-label="Pagination" *ngIf="totalPages() > 1">
      <button 
        class="page-btn" 
        type="button" 
        (click)="onPrevious()" 
        [disabled]="currentPage() <= 1" 
        aria-label="Previous page">
        ‹
      </button>
      
      <ng-container *ngFor="let p of visiblePages()">
        <span *ngIf="p === '...'" class="page-ellipsis">...</span>
        <button 
          *ngIf="p !== '...'"
          class="page-btn" 
          type="button" 
          [class.active]="p === currentPage()"
          [attr.aria-current]="p === currentPage() ? 'page' : null" 
          (click)="onPageClick(+p)">
          {{ p }}
        </button>
      </ng-container>
      
      <button 
        class="page-btn" 
        type="button" 
        (click)="onNext()" 
        [disabled]="currentPage() >= totalPages()" 
        aria-label="Next page">
        ›
      </button>
      
      <span class="page-info">
        Page {{ currentPage() }} of {{ totalPages() }} ({{ totalItems() }} items)
      </span>
    </nav>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 1rem 0;
    }
    
    .page-btn {
      min-width: 2.25rem;
      height: 2.25rem;
      padding: 0 0.75rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .page-btn:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-btn.active {
      background: #1e3a5f;
      color: white;
      border-color: #1e3a5f;
    }
    
    .page-ellipsis {
      padding: 0 0.5rem;
      color: #64748b;
    }
    
    .page-info {
      margin-left: 1rem;
      font-size: 0.875rem;
      color: #64748b;
    }
  `]
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalItems = input.required<number>();
  
  pageChange = output<number>();
  
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];
    
    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(total)) pages.push(total);
    }
    
    return pages;
  });
  
  onPageClick(page: number): void {
    if (page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
  
  onPrevious(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }
  
  onNext(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
