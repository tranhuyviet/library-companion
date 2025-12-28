/**
 * Finna API service
 * Documentation: https://api.finna.fi/swagger-ui/
 */

import { FinnaSearchResponse, FinnaBookDetail } from '../types/finna';

const FINNA_API_BASE = 'https://api.finna.fi/v1';

export interface SearchOptions {
  limit?: number;
  page?: number;
  lng?: string;
}

/**
 * Search for books using Finna API
 */
export async function searchBooks(
  query: string,
  options: SearchOptions = {}
): Promise<FinnaSearchResponse> {
  const { limit = 20, page = 1, lng = 'en' } = options;

  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const params = new URLSearchParams({
    lookfor: query.trim(),
    type: 'AllFields',
    limit: limit.toString(),
    page: page.toString(),
    lng,
  });

  try {
    const response = await fetch(`${FINNA_API_BASE}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Finna API search error:', error);
    throw error;
  }
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
    return data;
  } catch (error) {
    console.error('Finna API record error:', error);
    throw error;
  }
}

/**
 * Get image URL for a book record
 */
export function getBookImageUrl(record: { images?: string[]; image?: string }): string | null {
  if (record.images && record.images.length > 0) {
    return record.images[0];
  }
  if (record.image) {
    return record.image;
  }
  return null;
}

