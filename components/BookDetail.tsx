import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { FinnaBookDetail } from '../types/finna';
import { getBookImageUrl } from '../services/finnaApi';
import { Ionicons } from '@expo/vector-icons';

interface BookDetailProps {
  book: FinnaBookDetail;
}

export default function BookDetail({ book }: BookDetailProps) {
  const imageUrl = getBookImageUrl(book);
  const authors = book.authors || (book.author ? [book.author] : []);
  const publishers = book.publishers || (book.publisher ? [book.publisher] : []);
  const description = book.descriptions?.[0] || book.description || '';
  const formats = book.formats || book.format || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="contain" />
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{book.title}</Text>
        {authors.length > 0 && (
          <Text style={styles.author}>{authors.join(', ')}</Text>
        )}
      </View>

      {description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        {book.year && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Year:</Text>
            <Text style={styles.detailValue}>{book.year}</Text>
          </View>
        )}
        {publishers.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Publisher:</Text>
            <Text style={styles.detailValue}>{publishers.join(', ')}</Text>
          </View>
        )}
        {formats.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Format:</Text>
            <Text style={styles.detailValue}>{formats.join(', ')}</Text>
          </View>
        )}
      </View>

      {book.availability && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityText}>
              {book.availability.available} of {book.availability.total} available
            </Text>
            {book.availability.locations && book.availability.locations.length > 0 && (
              <View style={styles.locationsList}>
                {book.availability.locations.map((location, index) => (
                  <View key={index} style={styles.locationItem}>
                    <Ionicons
                      name={location.available > 0 ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={location.available > 0 ? Colors.success : Colors.error}
                    />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.location}</Text>
                      <Text style={styles.locationStatus}>
                        {location.available > 0
                          ? `${location.available} available`
                          : location.dueDate
                          ? `Due: ${location.dueDate}`
                          : location.status || 'Unavailable'}
                      </Text>
                      {location.callNumber && (
                        <Text style={styles.callNumber}>{location.callNumber}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  author: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
  availabilityCard: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  availabilityText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  locationsList: {
    marginTop: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  locationStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  callNumber: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
});

