import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';

import { useAuth } from '@/context/auth-context';

import { useTranslation } from '@/context/translation-context';

export default function ParkingStatusScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [spaces, setSpaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSpaces = async () => {
        try {
            const response = await axios.get(`${API_URL}/spaces`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSpaces(response.data);
        } catch (error) {
            console.error('Failed to fetch spaces:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSpaces();
    }, []);

    const availableCount = spaces.filter(s => s.status === 'AVAILABLE').length;
    const occupiedCount = spaces.filter(s => s.status === 'OCCUPIED').length;

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </Pressable>
                    <Text style={styles.title}>{t('parkingStatusTitle')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <BlurView intensity={30} tint="dark" style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{loading ? '...' : availableCount}</Text>
                        <Text style={styles.summaryLabel}>{t('parkingAvailable')}</Text>
                    </BlurView>
                    <BlurView intensity={30} tint="dark" style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{loading ? '...' : occupiedCount}</Text>
                        <Text style={styles.summaryLabel}>{t('parkingOccupied')}</Text>
                    </BlurView>
                </View>

                {/* Grid */}
                <Text style={styles.sectionTitle}>{t('spacesDirectory')}</Text>
                <View style={styles.grid}>
                    {spaces.map((space) => (
                        <BlurView key={space.id} intensity={30} tint="dark" style={styles.spaceCard}>
                            <View style={[
                                styles.statusIndicator,
                                { backgroundColor: space.status === 'AVAILABLE' ? '#10b981' : '#ef4444' }
                            ]} />
                            <Ionicons
                                name="car-sport"
                                size={32}
                                color={space.status === 'AVAILABLE' ? 'rgba(255,255,255,0.2)' : '#ffffff'}
                            />
                            <Text style={styles.spaceName}>{space.name}</Text>
                            <Text style={[
                                styles.statusText,
                                { color: space.status === 'AVAILABLE' ? '#10b981' : '#ef4444' }
                            ]}>
                                {space.status === 'AVAILABLE' ? t('statusAvailable') : t('statusOccupied')}
                            </Text>
                        </BlurView>
                    ))}
                </View>

                {spaces.length === 0 && !loading && (
                    <Text style={styles.emptyText}>{t('noParkingSpaces')}</Text>
                )}
            </ScrollView>
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
        paddingBottom: 150,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
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
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    spaceCard: {
        width: '47%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        gap: 8,
    },
    statusIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    spaceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 40,
    },
});
