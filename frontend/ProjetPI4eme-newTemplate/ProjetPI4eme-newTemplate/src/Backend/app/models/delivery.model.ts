/**
 * Delivery Model
 * Represents a delivery/shipment in the system
 */
export interface Delivery {
  idDelivery?: number;
  orderId: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  status: DeliveryStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Delivery Status Enum
 */
export type DeliveryStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | 'CANCELLED';

/**
 * Delivery Status Display Names
 */
export const DeliveryStatusLabels: Record<DeliveryStatus, string> = {
  'PENDING': 'Pending',
  'PROCESSING': 'Processing',
  'SHIPPED': 'Shipped',
  'IN_TRANSIT': 'In Transit',
  'OUT_FOR_DELIVERY': 'Out for Delivery',
  'DELIVERED': 'Delivered',
  'FAILED': 'Failed',
  'RETURNED': 'Returned',
  'CANCELLED': 'Cancelled'
};

/**
 * Create Delivery Request DTO
 */
export interface CreateDeliveryRequest {
  orderId: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  carrier?: string;
  notes?: string;
}

/**
 * Update Delivery Request DTO
 */
export interface UpdateDeliveryRequest {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  status?: DeliveryStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
}

/**
 * Delivery Statistics
 */
export interface DeliveryStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  failed: number;
}
