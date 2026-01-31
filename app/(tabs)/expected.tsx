import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_URL } from '@/constants/api';

import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { VisitDetailModal } from '@/components/VisitDetailModal';

export default function ExpectedVisitorsScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [expectedVisitors, setExpectedVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVisit, setSelectedVisit] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchExpectedVisitors();
    }, []);

    const fetchExpectedVisitors = async () => {
        try {
            const response = await axios.get(`${API_URL}/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const today = new Date().toDateString();
            const expected = response.data.filter((v: any) =>
                v.status === 'PENDING' &&
                new Date(v.validFrom).toDateString() === today
            );
            setExpectedVisitors(expected);
        } catch (err) {
            console.error('Error fetching expected visitors:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('expectedToday')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <Text style={styles.subtitle}>{t('expectedVisitorsCount').replace('{count}', expectedVisitors.length.toString())}</Text>

                {/* Visitors List */}
                <View style={styles.list}>
                    {loading ? (
                        <Text style={styles.emptyText}>{t('loading')}</Text>
                    ) : expectedVisitors.length > 0 ? (
                        expectedVisitors.map((visitor: any) => (
                            <Pressable
                                key={visitor.id}
                                onPress={() => {
                                    setSelectedVisit(visitor);
                                    setModalVisible(true);
                                }}
                            >
                                <BlurView intensity={30} tint="dark" style={styles.visitorCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.statusBadge}>
                                            <Ionicons name="time-outline" size={16} color="#f59e0b" />
                                            <Text style={styles.statusText}>{t('statusPending')}</Text>
                                        </View>
                                        <Text style={styles.timeText}>
                                            {new Date(visitor.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                                    <View style={styles.detailsRow}>
                                        <View style={styles.detail}>
                                            <Ionicons name="card-outline" size={16} color="#94a3b8" />
                                            <Text style={styles.detailText}>{visitor.visitorIdNumber}</Text>
                                        </View>
                                        {visitor.licensePlate && (
                                            <View style={styles.detail}>
                                                <Ionicons name="car-outline" size={16} color="#94a3b8" />
                                                <Text style={styles.detailText}>{visitor.licensePlate}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.hostInfo}>
                                        <Ionicons name="person-circle-outline" size={20} color="#64748b" />
                                        <Text style={styles.hostText}>{t('hostLabel')} {visitor.host?.name || t('unknown')}</Text>
                                    </View>
                                </BlurView>
                            </Pressable>
                        ))
                    ) : (
                        <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={64} color="#64748b" />
                            <Text style={styles.emptyTitle}>{t('noVisitorsExpected')}</Text>
                            <Text style={styles.emptyText}>{t('noVisitorsScheduled')}</Text>
                        </BlurView>
                    )}
                </View>
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
        padding: 24,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 24,
    },
    list: {
        gap: 12,
    },
    visitorCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f59e0b',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    visitorName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    hostText: {
        fontSize: 13,
        color: '#64748b',
    },
    emptyState: {
        padding: 40,
        borderRadius: 24,
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
