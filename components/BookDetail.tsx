import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { FinnaBookDetail } from '../types/finna';
import { getBookImageUrl } from '../services/finnaApi';
import { Ionicons } from '@expo/vector-icons';

interface BookDetailProps {
  book: FinnaBookDetail;
}

export default function BookDetail({ book }: BookDetailProps) {
  // Ensure we have at least a title
  if (!book || !book.title) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>No book data available</Text>
        </View>
      </View>
    );
  }

  const imageUrl = getBookImageUrl(book);
  const authors = book.authors || (book.author ? [book.author] : []);
  const publishers = book.publishers || (book.publisher ? [book.publisher] : []);
  const description = book.descriptions?.[0] || book.description || '';
  
  // Handle formats - ensure they are strings
  const formats = (book.formats || book.format || []).map((f: any) => {
    if (typeof f === 'string') return f;
    if (f.translated) return f.translated;
    if (f.value) return f.value;
    return String(f);
  });
  const formatLabel = formats.length > 0 ? formats[0] : 'Book';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{book.title || 'Untitled'}</Text>
      </View>

      {/* Book Type */}
      {formats.length > 0 && (
        <View style={styles.bookTypeContainer}>
          <Text style={styles.bookType}>{formatLabel}</Text>
        </View>
      )}

      {/* Authors/Contributors */}
      {authors.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Authors</Text>
          <Text style={styles.authorsText}>{authors.join('; ')}</Text>
        </View>
      ) : book.author ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Author</Text>
          <Text style={styles.authorsText}>{book.author}</Text>
        </View>
      ) : null}

      {/* Publisher and Year */}
      {(publishers.length > 0 || book.publisher || book.year) && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Publisher</Text>
          <Text style={styles.publisherText}>
            {publishers.length > 0 
              ? publishers.join(', ') 
              : book.publisher || ''}
            {(publishers.length > 0 || book.publisher) && book.year ? ' ' : ''}
            {book.year || ''}
          </Text>
        </View>
      )}

      {/* Description */}
      {description && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}

      {/* Fallback: Show at least ID if nothing else */}
      {!authors.length && !book.author && !publishers.length && !book.publisher && !book.year && !description && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Book ID</Text>
          <Text style={styles.detailValue}>{book.id}</Text>
        </View>
      )}

      {/* Availability Section - Prominent */}
      {book.availability && (
        <View style={styles.availabilitySection}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilitySectionTitle}>Availability</Text>
            <Text style={styles.availabilityCount}>
              Available: {book.availability.available} / {book.availability.total}
            </Text>
          </View>
          
          {book.availability.locations && book.availability.locations.length > 0 && (
            <View style={styles.locationsContainer}>
              {book.availability.locations.map((location, index) => (
                <View key={index} style={styles.locationCard}>
                  <View style={styles.locationHeader}>
                    <Ionicons
                      name={location.available > 0 ? 'checkmark-circle' : 'close-circle'}
                      size={24}
                      color={location.available > 0 ? Colors.success : Colors.error}
                    />
                    <Text style={styles.locationName}>{location.location}</Text>
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationStatus}>
                      {location.available > 0
                        ? `${location.available} available`
                        : location.dueDate
                        ? `Next due date: ${location.dueDate}`
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
      )}

      {/* Content/Chapters */}
      {book.tableOfContents && book.tableOfContents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content/Chapters</Text>
          {book.tableOfContents.map((content, index) => (
            <Text key={index} style={styles.contentText}>{content}</Text>
          ))}
        </View>
      )}

      {/* Table of Contents */}
      {book.tableOfContents && book.tableOfContents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Table of Contents</Text>
          {book.tableOfContents.map((content, index) => (
            <Text key={index} style={styles.contentText}>{content}</Text>
          ))}
        </View>
      )}

      {/* Subjects */}
      {book.subjects && book.subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.tagsContainer}>
            {book.subjects.map((subject, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{subject}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Additional Details */}
      {((book.isbn && book.isbn.length > 0) || (book.series && book.series.length > 0)) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {book.isbn && book.isbn.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ISBN:</Text>
              <Text style={styles.detailValue}>{book.isbn.join(', ')}</Text>
            </View>
          )}
          {book.series && book.series.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Series:</Text>
              <Text style={styles.detailValue}>{book.series.join(', ')}</Text>
            </View>
          )}
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 32,
  },
  bookTypeContainer: {
    marginBottom: 16,
  },
  bookType: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorsText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  publisherText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
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
  availabilitySection: {
    marginBottom: 24,
    marginTop: 8,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilitySectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  availabilityCount: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  locationsContainer: {
    gap: 12,
  },
  locationCard: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  locationDetails: {
    marginLeft: 32,
  },
  locationStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  callNumber: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 14,
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    padding: 20,
  },
});

