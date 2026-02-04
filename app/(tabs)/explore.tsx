import { Skeleton } from '@/components/ui/Skeleton';
import { VisitDetailModal } from '@/components/VisitDetailModal';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { visitService } from '@/services/visitService';
import { getImageUrl, getInitials } from '@/utils/image';
import { getStatusConfig } from '@/utils/status';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActivityLog() {
  const { t } = useTranslation();
  const { onDataRefresh } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchVisits = useCallback(async (pageNum = 1, shouldRefresh = false) => {
    if (pageNum > 1 && !hasMore && !shouldRefresh) return;

    if (pageNum === 1 && !shouldRefresh) setLoading(true);
    else if (!shouldRefresh) setLoadingMore(true);

    try {
      const response = await visitService.getAllVisits(pageNum, 15, undefined, undefined, searchQuery);

      if (shouldRefresh || pageNum === 1) {
        setVisits(response.data);
      } else {
        setVisits(prev => [...prev, ...response.data]);
      }

      setHasMore(pageNum < response.meta.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching mobile security visits (explore):', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [hasMore, searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVisits(1, true);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = onDataRefresh(() => fetchVisits(1, true));
    return unsubscribe;
  }, [onDataRefresh, fetchVisits]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisits(1, true);
    setRefreshing(false);
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('activityLog')}</Text>
        <Text style={styles.subtitle}>{t('totalEntries').replace('{count}', visits.length.toString())}</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>{t('search')}</Text>
          <TextInput
            style={styles.dateInput}
            placeholder={t('searchVisitors')}
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => fetchVisits(1, true)}>
          <Ionicons name="search" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading && visits.length === 0 ? (
        <View style={styles.loadingContainer}>
          {[...Array(5)].map((_, i) => (
            <BlurView key={i} intensity={30} tint="dark" style={styles.activityCard}>
              <Skeleton height={20} width="60%" />
              <View style={{ marginTop: 8 }}>
                <Skeleton height={14} width="40%" />
              </View>
            </BlurView>
          ))}
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) fetchVisits(page + 1);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color="#3b82f6" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <BlurView intensity={40} tint="dark" style={styles.emptyBlur}>
                  <Ionicons name="people-outline" size={64} color="#64748b" />
                  <Text style={styles.emptyTitle}>{t('noVisitorsFound')}</Text>
                  <Text style={styles.emptyText}>{t('adjustFilterHint')}</Text>
                </BlurView>
              </View>
            ) : null
          }
          renderItem={({ item: visit }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedVisit(visit);
                setModalVisible(true);
              }}
            >
              <BlurView intensity={40} tint="dark" style={styles.visitorCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    {visit.visitor?.avatar ? (
                      <Image
                        source={{ uri: getImageUrl(visit.visitor.avatar) || '' }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.initialsAvatar}>
                        <Text style={styles.initialsText}>{getInitials(visit.visitorName)}</Text>
                      </View>
                    )}
                    <View style={[styles.statusDot, { backgroundColor: getStatusConfig(visit.status).color }]} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.visitorName}>{visit.visitorName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusConfig(visit.status).color}20`, borderColor: `${getStatusConfig(visit.status).color}40` }]}>
                        <Text style={[styles.statusText, { color: getStatusConfig(visit.status).color }]}>{t(visit.status?.toLowerCase())}</Text>
                      </View>
                    </View>
                    <Text style={styles.hostInfo}>{t('host')}: {visit.host?.name}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="car" size={14} color="#64748b" />
                        <Text style={styles.metaText}>{visit.licensePlate || 'N/A'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={14} color="#64748b" />
                        <Text style={styles.metaText}>
                          {new Date(visit.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.2)" />
                </View>
              </BlurView>
            </TouchableOpacity>
          )}
        />
      )}

      <VisitDetailModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedVisit(null);
        }}
        visit={selectedVisit}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    gap: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 24,
    gap: 16,
  },
  activityCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  visitorCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  initialsText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  hostInfo: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-end',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyBlur: {
    padding: 40,
    borderRadius: 32,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  cardFooter: {
    marginTop: 8
  }
});
