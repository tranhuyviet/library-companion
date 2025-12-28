import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useState, useEffect } from 'react';
import { getBookDetails } from '../../services/finnaApi';
import { FinnaBookDetail } from '../../types/finna';
import BookDetail from '../../components/BookDetail';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useState<FinnaBookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) {
        setError('Book ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching book details for ID:', id);
        const data = await getBookDetails(id, 'en');
        console.log('Book details received:', data);
        if (data && data.title) {
          setBookData(data);
        } else {
          console.warn('Book data is missing title:', data);
          setError('Book data is incomplete');
        }
      } catch (err: any) {
        console.error('Error fetching book details:', err);
        setError(err?.message || 'Failed to load book details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading book details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !bookData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Book not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BookDetail book={bookData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
});

