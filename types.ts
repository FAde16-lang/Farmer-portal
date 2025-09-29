export enum UserRole {
  FARMER = 'Farmer',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string;
  memberSince: string;
  country: string;
}

export enum BatchStatus {
  PENDING = 'Pending Lab Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected by Lab',
  RECALLED = 'Recalled by Regulator',
}

export interface LabResult {
  fileName: string;
  uploadedAt: string;
  result: 'Pass' | 'Fail';
}

export interface Batch {
  id: string;
  blockchainId: string;
  farmerId: string;
  plantName: string;
  confidence: number;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  ivrData?: {
    farmerName: string;
    plantType: string;
    quantity: string;
  };
  status: BatchStatus;
  labResult?: LabResult;
  earnings: number;
  qualityScore: number;
  imageUrl: string;
}