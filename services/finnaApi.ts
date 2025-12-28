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
  
  // Handle formats - can be array of strings or objects with {value, translated}
  let formats: string[] = [];
  if (record.formats) {
    const formatArray = Array.isArray(record.formats) ? record.formats : [record.formats];
    formats = formatArray.map((f: any) => {
      if (typeof f === 'string') return f;
      if (f.translated) return f.translated;
      if (f.value) return f.value;
      return String(f);
    });
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

    const responseData = await response.json();
    
    // Log for debugging (can be removed in production)
    if (__DEV__) {
      console.log('Finna API record response:', JSON.stringify(responseData, null, 2));
    }
    
    // Handle different response structures
    // Some APIs return the record directly, others wrap it in a records array
    let data: any;
    if (responseData.records && Array.isArray(responseData.records) && responseData.records.length > 0) {
      // Response has records array - take the first record
      data = responseData.records[0];
      console.log('Using record from records array');
    } else if (responseData.id || responseData.recordId || responseData['@id']) {
      // Response is the record itself
      data = responseData;
      console.log('Using record directly');
    } else {
      console.warn('Invalid API response structure:', responseData);
      throw new Error('Invalid book data received from API');
    }
    
    // Check if we have valid data
    if (!data || (!data.id && !data.recordId && !data['@id'])) {
      console.warn('Invalid record data:', data);
      throw new Error('Invalid book data received from API');
    }
    
    // Transform the record
    const transformedRecord = transformRecord(data);
    
    // Ensure we have at least a title
    if (!transformedRecord.title) {
      console.warn('Transformed record missing title:', transformedRecord);
      // Try to get title from raw data
      transformedRecord.title = data.title || data.titleFull || data.titleMain || 'Untitled';
    }
    
    // Extract additional fields for book detail
    const subjects = data.subjects 
      ? (Array.isArray(data.subjects) ? data.subjects : [data.subjects])
      : data.subject 
      ? (Array.isArray(data.subject) ? data.subject : [data.subject])
      : [];
    
    const tableOfContents = data.tableOfContents 
      ? (Array.isArray(data.tableOfContents) ? data.tableOfContents : [data.tableOfContents])
      : data.contents
      ? (Array.isArray(data.contents) ? data.contents : [data.contents])
      : [];
    
    const isbn = data.isbn 
      ? (Array.isArray(data.isbn) ? data.isbn : [data.isbn])
      : data.isbns
      ? (Array.isArray(data.isbns) ? data.isbns : [data.isbns])
      : [];
    
    const issn = data.issn 
      ? (Array.isArray(data.issn) ? data.issn : [data.issn])
      : data.issns
      ? (Array.isArray(data.issns) ? data.issns : [data.issns])
      : [];
    
    const physicalDescriptions = data.physicalDescriptions 
      ? (Array.isArray(data.physicalDescriptions) ? data.physicalDescriptions : [data.physicalDescriptions])
      : data.physicalDescription
      ? (Array.isArray(data.physicalDescription) ? data.physicalDescription : [data.physicalDescription])
      : [];
    
    // Handle series - can be array of strings or objects with {name}
    let series: string[] = [];
    if (data.series) {
      const seriesArray = Array.isArray(data.series) ? data.series : [data.series];
      series = seriesArray.map((s: any) => {
        if (typeof s === 'string') return s;
        if (s.name) return s.name;
        return String(s);
      });
    } else if (data.seriesNames) {
      const seriesArray = Array.isArray(data.seriesNames) ? data.seriesNames : [data.seriesNames];
      series = seriesArray.map((s: any) => {
        if (typeof s === 'string') return s;
        if (s.name) return s.name;
        return String(s);
      });
    }
    
    const genres = data.genres 
      ? (Array.isArray(data.genres) ? data.genres : [data.genres])
      : data.genre
      ? (Array.isArray(data.genre) ? data.genre : [data.genre])
      : [];
    
    // Add availability information if available
    const bookDetail: FinnaBookDetail = {
      ...transformedRecord,
      availability: extractAvailability(data),
      holdings: extractHoldings(data),
      summary: data.summaries || (data.summary ? [data.summary] : []),
      subjects,
      tableOfContents,
      isbn,
      issn,
      physicalDescriptions,
      series,
      genres,
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
  // Try different possible structures from Finna API
  let holdings: any[] = [];
  
  if (data.holdings) {
    holdings = Array.isArray(data.holdings) ? data.holdings : [data.holdings];
  } else if (data.availability) {
    // Some APIs return availability directly
    if (Array.isArray(data.availability)) {
      holdings = data.availability;
    } else {
      holdings = [data.availability];
    }
  } else if (data.buildings) {
    // Some APIs structure it as buildings
    holdings = Array.isArray(data.buildings) ? data.buildings : [data.buildings];
  }
  
  if (holdings.length > 0) {
    let available = 0;
    let total = 0;
    const locations: any[] = [];
    
    holdings.forEach((h: any) => {
      const locationName = h.location || h.branch || h.building || h.name || 'Unknown';
      const availableCount = h.available || (h.availability === 'available' || h.status === 'available' ? 1 : 0);
      const totalCount = h.total || h.count || 1;
      
      available += availableCount;
      total += totalCount;
      
      locations.push({
        location: locationName,
        available: availableCount,
        callNumber: h.callNumber || h.callnumber || h.shelfMark || '',
        dueDate: h.dueDate || h.duedate || h.nextAvailableDate || '',
        status: h.status || h.availability || (availableCount > 0 ? 'available' : 'unavailable'),
      });
    });
    
    return {
      available,
      total,
      locations,
    };
  }
  
  // Fallback: try to extract from other fields
  if (data.availableCount !== undefined || data.totalCount !== undefined) {
    return {
      available: data.availableCount || 0,
      total: data.totalCount || 0,
      locations: [],
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

