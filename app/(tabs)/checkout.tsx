import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { API_URL } from '@/constants/api';

import { useAuth } from '@/context/auth-context';

import { useTranslation } from '@/context/translation-context';

export default function CheckoutScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveVisitors();
    }, []);

    const fetchActiveVisitors = async () => {
        try {
            const response = await axios.get(`${API_URL}/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const active = response.data.filter((v: any) => v.status === 'CHECKED_IN');
            setVisitors(active);
        } catch (err) {
            console.error('Error fetching active visitors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (visitId: string, visitorName: string) => {
        Alert.alert(
            t('confirmCheckout'),
            t('confirmCheckoutMessage').replace('{name}', visitorName),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('checkout'),
                    onPress: async () => {
                        try {
                            await axios.post(`${API_URL}/visits/${visitId}/checkout`, {}, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            const isVip = visitors.find(v => v.id === visitId)?.isVip;
                            let successTitle = t('visitorCheckedOut');
                            if (isVip) {
                                successTitle += '\n\n⭐ VIP - NO REVISAR VEHÍCULO';
                            }
                            Alert.alert('Success', successTitle);
                            fetchActiveVisitors();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || t('checkoutFailed'));
                        }
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <FlatList
                contentContainerStyle={styles.content}
                data={visitors}
                keyExtractor={(item: any) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#ffffff" />
                            </Pressable>
                            <Text style={styles.title}>{t('checkout')}</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <Text style={styles.subtitle}>{t('activeVisitorsCount').replace('{count}', visitors.length.toString())}</Text>
                    </>
                }
                ListEmptyComponent={
                    loading ? (
                        <Text style={styles.emptyText}>{t('loading')}</Text>
                    ) : (
                        <BlurView intensity={40} tint="dark" style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#64748b" />
                            <Text style={styles.emptyTitle}>{t('noActiveVisitors')}</Text>
                            <Text style={styles.emptyText}>{t('allCheckedOut')}</Text>
                        </BlurView>
                    )
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item: visitor }) => (
                    <BlurView intensity={30} tint="dark" style={styles.visitorCard}>
                        <View style={styles.visitorInfo}>
                            <View style={styles.statusIcon}>
                                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.visitorName}>{visitor.visitorName}</Text>
                                <Text style={styles.visitorMeta}>
                                    {visitor.licensePlate || t('noVehicle')} • {t('enteredAt').replace('{time}', new Date(visitor.checkedInAt || visitor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={() => handleCheckout(visitor.id, visitor.visitorName)}
                            style={styles.checkoutButton}
                        >
                            <Ionicons name="exit-outline" size={20} color="#f59e0b" />
                            <Text style={styles.checkoutText}>{t('checkout')}</Text>
                        </Pressable>
                    </BlurView>
                )}
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
    visitorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    visitorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    visitorMeta: {
        fontSize: 13,
        color: '#94a3b8',
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    checkoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f59e0b',
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
