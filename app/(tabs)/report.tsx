import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';

import { useTranslation } from '@/context/translation-context';

export default function ReportIncidentScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const incidentTypes = [
        { id: 'unauthorized', label: t('unauthorizedEntry'), icon: 'ban-outline', color: '#ef4444' },
        { id: 'suspicious', label: t('suspiciousActivity'), icon: 'eye-outline', color: '#f59e0b' },
        { id: 'emergency', label: t('emergency'), icon: 'warning-outline', color: '#dc2626' },
        { id: 'other', label: t('incidentTypeOther'), icon: 'ellipsis-horizontal-circle-outline', color: '#64748b' },
    ];

    const handleSubmit = async () => {
        if (!incidentType || !description) {
            Alert.alert('Error', t('selectTypeDescriptionError'));
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/reports`, {
                type: incidentType,
                description
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Alert.alert(
                t('reportSubmitted'),
                t('reportLogged'),
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Failed to submit report:', error);
            Alert.alert('Error', t('submitReportFailed'));
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
                    <Text style={styles.title}>{t('reportIncident')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Incident Type Selection */}
                <Text style={styles.sectionTitle}>{t('sectionIncidentType')}</Text>
                <View style={styles.typesGrid}>
                    {incidentTypes.map((type) => (
                        <Pressable
                            key={type.id}
                            onPress={() => setIncidentType(type.id)}
                        >
                            <BlurView
                                intensity={incidentType === type.id ? 40 : 30}
                                tint="dark"
                                style={[
                                    styles.typeCard,
                                    incidentType === type.id && styles.typeCardActive,
                                ]}
                            >
                                {incidentType === type.id && (
                                    <LinearGradient
                                        colors={[`${type.color}30`, `${type.color}10`]}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <View style={[styles.typeIcon, { backgroundColor: `${type.color}30` }]}>
                                    <Ionicons name={type.icon as any} size={28} color={type.color} />
                                </View>
                                <Text style={styles.typeLabel}>{type.label}</Text>
                                {incidentType === type.id && (
                                    <View style={styles.checkmark}>
                                        <Ionicons name="checkmark-circle" size={20} color={type.color} />
                                    </View>
                                )}
                            </BlurView>
                        </Pressable>
                    ))}
                </View>

                {/* Description */}
                <Text style={styles.sectionTitle}>{t('sectionDescription')}</Text>
                <BlurView intensity={30} tint="dark" style={styles.descriptionCard}>
                    <TextInput
                        style={styles.textArea}
                        placeholder={t('describeIncidentPlaceholder')}
                        placeholderTextColor="#64748b"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </BlurView>

                {/* Submit Button */}
                <Pressable onPress={handleSubmit} disabled={loading}>
                    <LinearGradient
                        colors={['#ef4444', '#dc2626', '#b91c1c']}
                        style={styles.submitButton}
                    >
                        <Ionicons name="alert-circle-outline" size={24} color="#ffffff" />
                        <Text style={styles.submitText}>{loading ? t('submitting') : t('submitReport')}</Text>
                    </LinearGradient>
                </Pressable>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    typesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    typeCard: {
        width: 160,
        aspectRatio: 1.4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    typeCardActive: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    typeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    descriptionCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        marginBottom: 24,
    },
    textArea: {
        color: '#ffffff',
        fontSize: 16,
        minHeight: 150,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        borderRadius: 20,
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
