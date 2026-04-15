export interface Resource {
  resourceId?: number;
  title: string;
  type: string;
  description: string;
  fileUrl?: string;
  uploadDate?: string;
}

export interface ResourceResponse {
  resourceId: number;
  title: string;
  type: string;
  description: string;
  fileUrl: string | null;
  uploadDate: string;
}
