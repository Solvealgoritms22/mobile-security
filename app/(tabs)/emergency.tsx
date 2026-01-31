import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/Toast';

import { useTranslation } from '@/context/translation-context';

export default function EmergencyAlertScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleQuickAlert = (type: string, localizedType?: string) => {
        const displayType = localizedType || type;
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(t('emergencyConfirmMessage').replace('{type}', displayType));
            if (confirmed) processAlert(type, displayType);
            return;
        }

        Alert.alert(
            t('emergencyConfirmTitle'),
            t('emergencyConfirmMessage').replace('{type}', displayType),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('triggerAlert'),
                    onPress: () => processAlert(type, displayType),
                    style: 'destructive'
                }
            ]
        );
    };

    const processAlert = async (type: string, displayType: string) => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/emergencies`, {
                type,
                location: 'Main Gate' // Default for now
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            showToast(t('alertActive').replace('{type}', displayType), 'success');
            router.back();
        } catch (error: any) {
            console.error('Failed to trigger emergency alert:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            showToast(t('alertFailed').replace('{msg}', msg), 'error');
        } finally {
            setLoading(false);
        }
    };

    const emergencyActions = [
        { id: 'police', label: t('emergencyPolice'), typeValue: 'Security/Police', icon: 'shield-outline', color: '#1e40af' },
        { id: 'medical', label: t('emergencyMedical'), typeValue: 'Medical Emergency', icon: 'medical-outline', color: '#ef4444' },
        { id: 'fire', label: t('emergencyFire'), typeValue: 'Fire/Hazard', icon: 'flame-outline', color: '#f97316' },
        { id: 'backup', label: t('emergencyBackup'), typeValue: 'Request Backup', icon: 'people-outline', color: '#7c3aed' },
    ];

    return (
        <LinearGradient colors={['#450a0a', '#1e293b', '#0f172a']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('emergencyCenter')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Panic Button */}
                <View style={styles.panicContainer}>
                    <TouchableOpacity
                        onPress={() => handleQuickAlert('General Panic', t('generalPanic'))}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ef4444', '#991b1b']}
                            style={styles.panicButton}
                        >
                            <View style={styles.panicInner}>
                                <Ionicons name="warning" size={48} color="#ffffff" />
                                <Text style={styles.panicText}>{t('panic')}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.panicSubtext}>{t('holdSilentAlert')}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    {emergencyActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            onPress={() => handleQuickAlert(action.typeValue, action.label)}
                            style={styles.actionItem}
                        >
                            <BlurView intensity={30} tint="dark" style={styles.actionCard}>
                                <View style={[styles.actionIcon, { backgroundColor: `${action.color}30` }]}>
                                    <Ionicons name={action.icon as any} size={32} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </BlurView>
                        </TouchableOpacity>
                    ))}
                </View>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
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
    panicContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    panicButton: {
        width: 180,
        height: 180,
        borderRadius: 90,
        padding: 4,
        elevation: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    panicInner: {
        flex: 1,
        borderRadius: 86,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    panicText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 2,
    },
    panicSubtext: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 14,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionItem: {
        width: '47%',
    },
    actionCard: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        height: 140,
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
});
