
export enum ProductLine {
  BeautyCream = 'Beauty Cream',
  Soap = 'Soap',
  FairnessCream = 'Fairness Cream',
  WhiteBeautyCream = 'White Beauty Cream',
  FaceWashes = 'Face Washes',
  BodySpray = 'Body Spray',
  SunBlock = 'SunBlock',
  Lotions = 'Lotions',
  BodyLotions = 'Body Lotions'
}

export type UserRole = 'ASM' | 'ZSM';

export interface User {
  name: string;
  role: UserRole;
  phoneNumber: string;
  city: string;
}

export interface VisitData {
  id: string;
  shopName: string;
  shopkeeperName: string;
  shopkeeperPhone: string;
  location: string; // City/Area
  fullAddress: string; // Street, House #, etc.
  timestamp: number;
  imageUrls: string[]; // Changed from imageUrl to imageUrls for multiple photos
  notes: string;
  competitorActivity: string;
  stockLevel: number; // 0-100%
  productsAvailable: ProductLine[];
  aiInsight?: string;
  shelfShare?: number; // Percentage of shelf occupied by GP
  skuCount?: number;   // Number of distinct SKUs found
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DailyReport {
  date: string;
  visits: VisitData[];
  summary: string;
  totalVisits: number;
  averageStock: number;
}
