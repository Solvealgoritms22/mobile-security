import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import axios from 'axios';

import { useAuth } from '@/context/auth-context';
import { API_URL } from '@/constants/api';

import { useTranslation } from '@/context/translation-context';

export default function VerifyPlateScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [plate, setPlate] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!plate) {
            Alert.alert('Error', t('enterPlateError'));
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/lpr/verify/${plate}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const { found, visit } = response.data;

            if (found) {
                setResult({ found: true, visits: [visit] });
            } else {
                setResult({ found: false });
            }
        } catch (error: any) {
            console.error('Plate verification error:', error);
            Alert.alert('Error', t('verifyPlateFailed'));
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
                    <Text style={styles.title}>{t('verifyPlateTitle')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Form */}
                <BlurView intensity={30} tint="dark" style={styles.searchCard}>
                    <Text style={styles.label}>{t('plateNumberLabel')}</Text>
                    <View style={styles.searchContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="car-sport-outline" size={24} color="#ec4899" />
                            <TextInput
                                style={styles.input}
                                placeholder={t('enterPlatePlaceholder')}
                                placeholderTextColor="#64748b"
                                value={plate}
                                onChangeText={(text) => setPlate(text.toUpperCase())}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                        </View>
                        <Pressable onPress={handleSearch} disabled={loading} style={styles.searchButton}>
                            <LinearGradient
                                colors={['#ec4899', '#db2777', '#be185d']}
                                style={styles.searchButtonGradient}
                            >
                                <Ionicons name="search-outline" size={24} color="#ffffff" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </BlurView>

                {/* Results */}
                {result && (
                    <BlurView intensity={30} tint="dark" style={styles.resultCard}>
                        {result.found ? (
                            <>
                                <View style={[styles.resultBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                    <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                                    <Text style={[styles.resultTitle, { color: '#10b981' }]}>{t('authorized')}</Text>
                                </View>
                                {result.visits.map((visit: any) => (
                                    <View key={visit.id} style={styles.visitInfo}>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="person-outline" size={20} color="#94a3b8" />
                                            <Text style={styles.infoLabel}>{t('visitorLabel')}</Text>
                                            <Text style={styles.infoValue}>{visit.visitorName}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="card-outline" size={20} color="#94a3b8" />
                                            <Text style={styles.infoLabel}>{t('idLabel')}</Text>
                                            <Text style={styles.infoValue}>{visit.visitorIdNumber}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="person-circle-outline" size={20} color="#94a3b8" />
                                            <Text style={styles.infoLabel}>{t('hostLabel')}</Text>
                                            <Text style={styles.infoValue}>{visit.host?.name || t('unknown')}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="time-outline" size={20} color="#94a3b8" />
                                            <Text style={styles.infoLabel}>{t('statusLabel')}</Text>
                                            <Text style={[styles.statusText, { color: visit.status === 'CHECKED_IN' ? '#10b981' : '#f59e0b' }]}>
                                                {visit.status === 'CHECKED_IN' ? t('statusCheckedIn') : visit.status}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        ) : (
                            <View style={[styles.resultBadge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                <Ionicons name="close-circle" size={64} color="#ef4444" />
                                <Text style={[styles.resultTitle, { color: '#ef4444' }]}>{t('notFound')}</Text>
                                <Text style={styles.resultText}>{t('noActiveVisits')}</Text>
                            </View>
                        )}
                    </BlurView>
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
    searchCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    searchButtonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    resultBadge: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
        letterSpacing: 2,
    },
    resultText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
    },
    visitInfo: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#94a3b8',
        width: 60,
    },
    infoValue: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    statusText: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
