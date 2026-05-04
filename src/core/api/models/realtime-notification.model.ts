/**
 * Shape of the realtime notification REST resource.
 */
export interface RealtimeNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  payloadJson: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

/** POST /api/notifications request body (manual create). */
export interface RealtimeNotificationCreate {
  userId: number;
  type: string;
  title: string;
  message: string;
  payloadJson?: string | null;
}
