import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_URL } from '@/constants/api';
import { useTranslation } from '@/context/translation-context';
import { VisitDetailModal } from '@/components/VisitDetailModal';

export default function ActivityLog() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchActivities = async () => {
    try {
      let url = `${API_URL}/visits`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await axios.get(url);
      setActivities(response.data);
    } catch (err) {
      console.error('Error fetching activity log:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return '#10b981';
      case 'CHECKED_OUT': return '#94a3b8';
      case 'PENDING': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'checkmark-circle';
      case 'CHECKED_OUT': return 'exit-outline';
      case 'PENDING': return 'time-outline';
      default: return 'alert-circle-outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return t('statusCheckedIn');
      case 'CHECKED_OUT': return t('statusCheckedOut');
      case 'PENDING': return t('statusPending');
      default: return status;
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('activityLog')}</Text>
        <Text style={styles.subtitle}>{t('totalEntries').replace('{count}', activities.length.toString())}</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>{t('startDate')}</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>{t('endDate')}</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={fetchActivities}>
          <Ionicons name="filter" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {activities.length > 0 ? (
          activities.map((activity: any) => (
            <TouchableOpacity
              key={activity.id}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedVisit(activity);
                setModalVisible(true);
              }}
            >
              <BlurView intensity={30} tint="dark" style={styles.activityCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(activity.status)}20` }]}>
                    <Ionicons
                      name={getStatusIcon(activity.status)}
                      size={24}
                      color={getStatusColor(activity.status)}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.visitorName}>{activity.visitorName || t('guest')}</Text>
                    <Text style={styles.visitorMeta}>
                      {activity.licensePlate || t('noVehicle')} • Host: {activity.host?.name || t('na')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(activity.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}>
                      {getStatusText(activity.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text style={styles.timeText}>
                      {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <BlurView intensity={40} tint="dark" style={styles.emptyBlur}>
              <Ionicons name="document-text-outline" size={64} color="#64748b" />
              <Text style={styles.emptyTitle}>{t('noActivityFound')}</Text>
              <Text style={styles.emptyText}>{t('adjustFilters')}</Text>
            </BlurView>
          </View>
        )}
      </ScrollView>

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
  activityCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  visitorMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statCardSkeleton: {
    flex: 1,
    borderRadius: 16,
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
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  qrIndicator: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
});
