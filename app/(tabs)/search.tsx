import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchBooks } from '../../services/finnaApi';
import { FinnaRecord } from '../../types/finna';
import BookCard from '../../components/BookCard';
import SearchBar from '../../components/SearchBar';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [results, setResults] = useState<FinnaRecord[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const performSearch = useCallback(async (query: string, page: number = 1, append: boolean = false) => {
    if (query.length < 2) {
      setResults([]);
      setTotalResults(0);
      setError(null);
      setCurrentPage(1);
      setHasMore(false);
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
      setError(null);
    }

    try {
      const response = await searchBooks(query, { limit: 20, page, lng: 'en' });
      const newRecords = response.records || [];
      const totalCount = response.resultCount || 0;
      
      if (append) {
        setResults(prev => {
          // Filter out duplicates by ID
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNewRecords = newRecords.filter(r => r.id && !existingIds.has(r.id));
          const updated = [...prev, ...uniqueNewRecords];
          // Check if there are more results to load
          setHasMore(updated.length < totalCount);
          return updated;
        });
      } else {
        // Filter duplicates in initial results too
        const uniqueRecords = newRecords.filter((record, index, self) => 
          record.id && index === self.findIndex(r => r.id === record.id)
        );
        setResults(uniqueRecords);
        // Check if there are more results to load
        setHasMore(uniqueRecords.length < totalCount);
      }
      
      setTotalResults(totalCount);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Search error:', err);
      const errorMessage = err?.message || 'Failed to search. Please try again.';
      setError(errorMessage);
      if (!append) {
        setResults([]);
        setTotalResults(0);
      }
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, 1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && searchQuery.length >= 2) {
      performSearch(searchQuery, currentPage + 1, true);
    }
  }, [isLoadingMore, hasMore, searchQuery, currentPage, performSearch]);

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setHasMore(false);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Books</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for books..."
          onClear={handleClear}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isSearching && results.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isSearching && !error && searchQuery.length >= 2 && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      )}

      {!isSearching && !error && searchQuery.length < 2 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Start searching</Text>
          <Text style={styles.emptySubtext}>Enter at least 2 characters to search</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            Showing {results.length} of {totalResults} {totalResults === 1 ? 'result' : 'results'}
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id || `book-${index}`}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : hasMore ? (
            <View style={styles.loadMoreContainer}>
              <Text style={styles.loadMoreText}>Scroll for more results</Text>
            </View>
          ) : results.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <Text style={styles.loadMoreText}>No more results</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.error,
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

