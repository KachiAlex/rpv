import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator, ProgressBar, Button, Chip } from 'react-native-paper';
import translationService, { Translation, TranslationDownloadProgress } from '../services/translationService';

export default function TranslationScreen(): React.ReactElement {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<Map<string, TranslationDownloadProgress>>(
    new Map()
  );
  const [totalCacheSize, setTotalCacheSize] = useState<number>(0);

  useEffect(() => {
    loadTranslations();
    loadSelectedTranslation();
    loadCacheSize();

    // Set up polling for download progress
    const interval = setInterval(() => {
      const progress = translationService.getAllDownloadProgress();
      const progressMap = new Map(progress.map((p) => [p.translationId, p]));
      setDownloadProgress(progressMap);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const loadTranslations = async (): Promise<void> => {
    try {
      setLoading(true);
      const available = await translationService.fetchAvailableTranslations();
      setTranslations(available);
    } catch (error) {
      console.error('Error loading translations:', error);
      Alert.alert('Error', 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedTranslation = async (): Promise<void> => {
    try {
      const selected = await translationService.getSelectedTranslation();
      setSelectedTranslation(selected);
    } catch (error) {
      console.error('Error loading selected translation:', error);
    }
  };

  const loadCacheSize = async (): Promise<void> => {
    try {
      const size = await translationService.getTotalCacheSize();
      setTotalCacheSize(size);
    } catch (error) {
      console.error('Error loading cache size:', error);
    }
  };

  const handleDownload = async (translation: Translation): Promise<void> => {
    try {
      const success = await translationService.downloadTranslation(translation.id);
      if (success) {
        Alert.alert('Success', `${translation.name} downloaded successfully`);
        loadTranslations();
        loadCacheSize();
      } else {
        Alert.alert('Error', `Failed to download ${translation.name}`);
      }
    } catch (error) {
      console.error('Error downloading translation:', error);
      Alert.alert('Error', 'Failed to download translation');
    }
  };

  const handleRemove = async (translation: Translation): Promise<void> => {
    Alert.alert(
      'Remove Translation',
      `Are you sure you want to remove ${translation.name}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const success = await translationService.removeTranslation(translation.id);
              if (success) {
                Alert.alert('Success', `${translation.name} removed`);
                loadTranslations();
                loadCacheSize();
              }
            } catch (error) {
              console.error('Error removing translation:', error);
              Alert.alert('Error', 'Failed to remove translation');
            }
          },
        },
      ]
    );
  };

  const handleSelectTranslation = async (translation: Translation): Promise<void> => {
    try {
      await translationService.setSelectedTranslation(translation.abbreviation);
      setSelectedTranslation(translation.abbreviation);
      Alert.alert('Success', `${translation.name} selected`);
    } catch (error) {
      console.error('Error selecting translation:', error);
      Alert.alert('Error', 'Failed to select translation');
    }
  };

  const renderTranslationItem = ({ item }: { item: Translation }): React.ReactElement => {
    const progress = downloadProgress.get(item.id);
    const isDownloading = progress?.status === 'downloading';
    const isSelected = selectedTranslation === item.abbreviation;

    return (
      <View style={styles.translationItem}>
        <View style={styles.translationHeader}>
          <View style={styles.translationInfo}>
            <Text variant="titleSmall" style={styles.translationName}>
              {item.name}
            </Text>
            <Text variant="labelSmall" style={styles.translationMeta}>
              {item.abbreviation} • {item.language} • {(item.size / 1024 / 1024).toFixed(1)}MB
            </Text>
          </View>
          {isSelected && (
            <Chip
              style={styles.selectedChip}
              textStyle={styles.selectedChipText}
            >
              Selected
            </Chip>
          )}
        </View>

        {isDownloading && progress && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress.progress / 100} style={styles.progressBar} />
            <Text variant="labelSmall" style={styles.progressText}>
              {progress.progress}%
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.isDownloaded ? (
            <>
              <Button
                mode={isSelected ? 'contained' : 'outlined'}
                onPress={() => handleSelectTranslation(item)}
                style={styles.button}
                disabled={isDownloading}
              >
                {isSelected ? 'Selected' : 'Select'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleRemove(item)}
                style={styles.button}
                disabled={isDownloading}
              >
                Remove
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              onPress={() => handleDownload(item)}
              style={styles.button}
              loading={isDownloading}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Translations
        </Text>
        <View style={styles.cacheInfo}>
          <Text variant="labelSmall" style={styles.cacheText}>
            Cache: {totalCacheSize.toFixed(1)}MB / 100MB
          </Text>
          <ProgressBar
            progress={Math.min(totalCacheSize / 100, 1)}
            style={styles.cacheBar}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={translations}
          keyExtractor={(item) => item.id}
          renderItem={renderTranslationItem}
          scrollEnabled
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    marginBottom: 12,
    fontWeight: '600',
  },
  cacheInfo: {
    gap: 8,
  },
  cacheText: {
    color: '#666',
  },
  cacheBar: {
    height: 6,
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  translationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#a9291c',
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  translationInfo: {
    flex: 1,
  },
  translationName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  translationMeta: {
    color: '#999',
  },
  selectedChip: {
    backgroundColor: '#a9291c',
  },
  selectedChipText: {
    color: '#fff',
  },
  progressContainer: {
    marginBottom: 12,
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    color: '#666',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
});
