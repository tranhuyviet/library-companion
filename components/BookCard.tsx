import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { FinnaRecord } from '../types/finna';
import { getBookImageUrl } from '../services/finnaApi';
import { Ionicons } from '@expo/vector-icons';

interface BookCardProps {
  book: FinnaRecord;
  onPress: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  const imageUrl = getBookImageUrl(book);
  const author = book.authors?.[0] || book.author || 'Unknown Author';
  const year = book.year || 'Unknown Year';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Ionicons name="book-outline" size={32} color={Colors.textLight} />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {author}
        </Text>
        <Text style={styles.year}>{year}</Text>
      </View>

      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: Colors.textLight,
  },
  arrow: {
    marginLeft: 8,
  },
});

