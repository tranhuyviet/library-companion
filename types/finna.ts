/**
 * TypeScript types for Finna API responses
 */

export interface FinnaSearchResponse {
  resultCount: number;
  records: FinnaRecord[];
  facets?: any[];
}

export interface FinnaRecord {
  id: string;
  title: string;
  authors?: string[];
  author?: string;
  year?: string;
  images?: string[];
  image?: string;
  formats?: string[];
  format?: string[];
  publishers?: string[];
  publisher?: string;
  descriptions?: string[];
  description?: string;
  languages?: string[];
  language?: string[];
  url?: string;
}

export interface FinnaBookDetail extends FinnaRecord {
  availability?: AvailabilityInfo;
  holdings?: Holding[];
  summary?: string[];
  subjects?: string[];
}

export interface AvailabilityInfo {
  available: number;
  total: number;
  locations?: LocationAvailability[];
}

export interface LocationAvailability {
  location: string;
  available: number;
  callNumber?: string;
  dueDate?: string;
  status?: string;
}

export interface Holding {
  location: string;
  callNumber?: string;
  status: string;
  dueDate?: string;
}

