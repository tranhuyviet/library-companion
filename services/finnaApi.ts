/**
 * Finna API service
 * Documentation: https://api.finna.fi/swagger-ui/
 */

import { FinnaSearchResponse, FinnaBookDetail, FinnaRecord } from '../types/finna';

const FINNA_API_BASE = 'https://api.finna.fi/v1';

export interface SearchOptions {
  limit?: number;
  page?: number;
  lng?: string;
  sort?: string;
}

/**
 * Search for books using Finna API
 */
export async function searchBooks(
  query: string,
  options: SearchOptions = {}
): Promise<FinnaSearchResponse> {
  const { limit = 20, page = 1, lng = 'en', sort = 'relevance' } = options;

  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const params = new URLSearchParams({
    lookfor: query.trim(),
    type: 'AllFields',
    limit: limit.toString(),
    page: page.toString(),
    lng,
    sort,
  });

  try {
    const response = await fetch(`${FINNA_API_BASE}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform API response to match our types
    if (data.records && Array.isArray(data.records)) {
      data.records = data.records.map((record: any) => transformRecord(record));
    } else if (data.resultCount === 0) {
      // Ensure records array exists even if empty
      data.records = [];
    }
    
    // Ensure resultCount is set
    if (data.resultCount === undefined && data.records) {
      data.resultCount = data.records.length;
    }
    
    return data;
  } catch (error) {
    console.error('Finna API search error:', error);
    throw error;
  }
}

/**
 * Transform API record to match our FinnaRecord type
 */
function transformRecord(record: any): FinnaRecord {
  // Handle authors - can be array, string, or object
  let authors: string[] = [];
  if (record.primaryAuthors && Array.isArray(record.primaryAuthors)) {
    authors = record.primaryAuthors;
  } else if (record.authors) {
    if (Array.isArray(record.authors)) {
      authors = record.authors.map((a: any) => typeof a === 'string' ? a : a.name || a.fullname || String(a));
    } else if (typeof record.authors === 'string') {
      authors = [record.authors];
    }
  }
  
  // Handle images - can be array of strings or array of objects
  let images: string[] = [];
  if (record.images) {
    if (Array.isArray(record.images)) {
      images = record.images.map((img: any) => {
        if (typeof img === 'string') return img;
        return img.url || img.medium || img.small || String(img);
      });
    } else if (typeof record.images === 'string') {
      images = [record.images];
    }
  }
  
  // Handle formats
  let formats: string[] = [];
  if (record.formats) {
    formats = Array.isArray(record.formats) ? record.formats : [record.formats];
  }
  
  // Handle publishers
  let publishers: string[] = [];
  if (record.publishers) {
    publishers = Array.isArray(record.publishers) ? record.publishers : [record.publishers];
  }
  
  // Handle descriptions/summaries
  let descriptions: string[] = [];
  if (record.summaries) {
    descriptions = Array.isArray(record.summaries) ? record.summaries : [record.summaries];
  } else if (record.description) {
    descriptions = Array.isArray(record.description) ? record.description : [record.description];
  }
  
  // Handle languages
  let languages: string[] = [];
  if (record.languages) {
    languages = Array.isArray(record.languages) ? record.languages : [record.languages];
  }
  
  return {
    id: record.id || record.recordId || record['@id'] || '',
    title: record.title || record.titleFull || record.titleMain || '',
    authors,
    author: authors[0] || record.authors || '',
    year: record.year || record.publicationYear || record.publicationDates?.[0] || '',
    images,
    image: images[0] || record.image || '',
    formats,
    format: formats,
    publishers,
    publisher: publishers[0] || record.publisher || '',
    descriptions,
    description: descriptions[0] || record.description || '',
    languages,
    language: languages,
    url: record.url || record.recordPage || record.links?.recordPage || '',
  };
}

/**
 * Get detailed book information by record ID
 */
export async function getBookDetails(
  recordId: string,
  lng: string = 'en'
): Promise<FinnaBookDetail> {
  if (!recordId) {
    throw new Error('Record ID is required');
  }

  const params = new URLSearchParams({
    id: recordId,
    lng,
  });

  try {
    const response = await fetch(`${FINNA_API_BASE}/record?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the record
    const transformedRecord = transformRecord(data);
    
    // Add availability information if available
    const bookDetail: FinnaBookDetail = {
      ...transformedRecord,
      availability: extractAvailability(data),
      holdings: extractHoldings(data),
      summary: data.summaries || (data.summary ? [data.summary] : []),
      subjects: data.subjects || (data.subject ? [data.subject] : []),
    };
    
    return bookDetail;
  } catch (error) {
    console.error('Finna API record error:', error);
    throw error;
  }
}

/**
 * Extract availability information from API response
 */
function extractAvailability(data: any): any {
  if (data.holdings) {
    const holdings = Array.isArray(data.holdings) ? data.holdings : [data.holdings];
    const available = holdings.filter((h: any) => h.availability === 'available' || h.status === 'available').length;
    const total = holdings.length;
    
    return {
      available,
      total,
      locations: holdings.map((h: any) => ({
        location: h.location || h.branch || '',
        available: h.availability === 'available' || h.status === 'available' ? 1 : 0,
        callNumber: h.callNumber || h.callnumber || '',
        dueDate: h.dueDate || h.duedate || '',
        status: h.status || h.availability || '',
      })),
    };
  }
  
  return null;
}

/**
 * Extract holdings information from API response
 */
function extractHoldings(data: any): any[] {
  if (!data.holdings) return [];
  
  const holdings = Array.isArray(data.holdings) ? data.holdings : [data.holdings];
  return holdings.map((h: any) => ({
    location: h.location || h.branch || '',
    callNumber: h.callNumber || h.callnumber || '',
    status: h.status || h.availability || 'unknown',
    dueDate: h.dueDate || h.duedate || '',
  }));
}

/**
 * Get image URL for a book record
 */
export function getBookImageUrl(record: { images?: string[]; image?: string }): string | null {
  if (record.images && record.images.length > 0) {
    const imageUrl = record.images[0];
    // Ensure full URL
    if (imageUrl && !imageUrl.startsWith('http')) {
      return `https://api.finna.fi${imageUrl}`;
    }
    return imageUrl;
  }
  if (record.image) {
    const imageUrl = record.image;
    if (!imageUrl.startsWith('http')) {
      return `https://api.finna.fi${imageUrl}`;
    }
    return imageUrl;
  }
  return null;
}

