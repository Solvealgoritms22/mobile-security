import { Skeleton } from '@/components/ui/Skeleton';
import { VisitDetailModal } from '@/components/VisitDetailModal';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SecurityDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, token, logout, onDataRefresh } = useAuth();
  const [stats, setStats] = useState({ today: 0, pending: 0, flagged: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Normalize path: replace backslashes (Windows) with forward slashes
    let normalizedPath = path.replace(/\\/g, '/');

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    return `${baseUrl}${normalizedPath}`;
  };

  const getInitials = (name: string) => {
    return name?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'S';
  };

  // Reset image error when profile image changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  useEffect(() => {
    fetchDashboardData();

    // Re-fetch data on real-time updates
    const unsubscribe = onDataRefresh(() => {
      fetchDashboardData();
    });

    return unsubscribe;
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch visitor statistics from /visits endpoint
      const response = await axios.get(`${API_URL}/visits`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const visits = response.data;

      // Calculate stats
      const today = new Date().toDateString();
      const todayVisits = Array.isArray(visits) ? visits.filter((v: any) =>
        v.createdAt && new Date(v.createdAt).toDateString() === today
      ) : [];

      setStats({
        today: todayVisits.length,
        pending: Array.isArray(visits) ? visits.filter((v: any) => v.status === 'PENDING').length : 0,
        flagged: Array.isArray(visits) ? visits.filter((v: any) => v.status === 'FLAGGED').length : 0,
      });

      // Set recent activity (last 4 visits)
      if (Array.isArray(visits)) {
        setRecentActivity(visits.slice(0, 4));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Keep loading true to show skeletons on error
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), onPress: logout, style: 'destructive' }
      ]
    );
  };

  const actions = [
    { id: 'manual', icon: 'person-add', label: t('manualEntry'), color: '#3b82f6', screen: '/(tabs)/manual-entry' },
    { id: 'emergency', icon: 'warning', label: t('emergencyAlert'), color: '#ef4444', screen: '/(tabs)/emergency' },
    { id: 'log', icon: 'list', label: t('visitorLog'), color: '#8b5cf6', screen: '/(tabs)/explore' },
    { id: 'reports', icon: 'stats-chart', label: t('tabReports'), color: '#10b981', screen: '/(tabs)/report' },
    { id: 'parking', icon: 'car', label: t('parkingStatus'), color: '#f59e0b', screen: '/(tabs)/parking' },
    { id: 'lpr', icon: 'scan-circle', label: t('lprCheck'), color: '#06b6d4', screen: '/(tabs)/verify-plate' },
  ];

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with User Info */}
        <BlurView intensity={80} tint="dark" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.role}>{t('securityOfficer')}</Text>
              <Text style={styles.userName}>{user?.name || t('officer')}</Text>
              <Text style={styles.badge}>{user?.email}</Text>
            </View>
            {(user?.profileImage && !imageError) ? (
              <View style={styles.headerAvatarContainer}>
                <Image
                  source={{ uri: getImageUrl(user.profileImage) || undefined }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                  transition={500}
                  onError={() => setImageError(true)}
                />
              </View>
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
              </View>
            )}
          </View>
        </BlurView>

        {/* Main Scanner Button */}
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() => router.push('/(tabs)/scanner')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#1d4ed8']}
            style={styles.scannerGradient}
          >
            <View style={styles.scannerIcon}>
              <Ionicons name="scan" size={48} color="#ffffff" />
            </View>
            <Text style={styles.scannerText}>{t('scanQR')}</Text>
            <Text style={styles.scannerSubtext}>{t('validateVisitorEntry')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {loading ? (
            <>
              <Skeleton height={80} style={styles.statCardSkeleton} />
              <Skeleton height={80} style={styles.statCardSkeleton} />
              <Skeleton height={80} style={styles.statCardSkeleton} />
            </>
          ) : (
            <>
              <BlurView intensity={60} tint="dark" style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.today}</Text>
                <Text style={styles.statLabel}>{t('today')}</Text>
              </BlurView>
              <BlurView intensity={60} tint="dark" style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statLabel}>{t('pendingInvites')}</Text>
              </BlurView>
              <BlurView intensity={60} tint="dark" style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.flagged}</Text>
                <Text style={styles.statLabel}>{t('flagged')}</Text>
              </BlurView>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              onPress={() => {
                router.push(action.screen as any);
              }}
              activeOpacity={0.7}
            >
              <BlurView intensity={70} tint="dark" style={styles.actionBlur}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
          <Link href="/(tabs)/explore" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <BlurView intensity={60} tint="dark" style={styles.activityCard}>
          {loading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
              <Skeleton height={60} borderRadius={12} />
            </View>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((visitor: any, index) => {
              const getStatusConfig = (status: string) => {
                const s = status?.toUpperCase();
                if (s === 'CHECKED_IN' || s === 'APPROVED') return { icon: 'checkmark', color: '#10b981' };
                if (s === 'CHECKED_OUT') return { icon: 'log-out', color: '#3b82f6' };
                if (s === 'PENDING') return { icon: 'time-outline', color: '#f59e0b' };
                return { icon: 'close', color: '#ef4444' };
              };
              const config = getStatusConfig(visitor.status);

              return (
                <TouchableOpacity
                  key={visitor.id || index}
                  onPress={() => {
                    setSelectedVisit(visitor);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                  style={[styles.activityItem, index !== 0 && styles.activityBorder]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon as any} size={16} color="#ffffff" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{visitor.visitorName || visitor.name || t('visitor')}</Text>
                    <Text style={styles.activitySubtitle}>{visitor.visitorIdNumber || visitor.idNumber || 'N/A'}</Text>
                  </View>
                  <Text style={styles.activityTime}>
                    {new Date(visitor.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t('noRecentActivity')}</Text>
          )}
        </BlurView>
      </ScrollView>

      <VisitDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        visit={selectedVisit}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  role: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  badge: {
    fontSize: 14,
    color: '#64748b',
  },
  headerAvatarContainer: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#3b82f6',
    overflow: 'hidden',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  headerAvatarPlaceholder: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  logoutIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  logoutBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  scannerButton: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  scannerGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  scannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  scannerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
  },
  statCardSkeleton: {
    flex: 1,
    borderRadius: 16,
  },
});
