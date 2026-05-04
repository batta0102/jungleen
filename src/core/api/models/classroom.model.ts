export interface Classroom {
  id: string | number;
  name: string;
  capacity?: number;
  location?: string;
  type?: 'STANDARD' | 'PREMIUM' | 'MEETING' | string;
  featuresDescription?: string;
  /** Legacy direct GLB/USDZ URL (optional). */
  model3dUrl?: string;
  /** Sketchfab model id (32 characters) or full sketchfab.com model URL — preferred for the showroom viewer. */
  sketchfabModelUid?: string;
  [key: string]: unknown;
}
