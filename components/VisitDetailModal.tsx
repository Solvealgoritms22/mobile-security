import { API_URL } from '@/constants/api';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

interface VisitDetailModalProps {
    visible: boolean;
    onClose: () => void;
    visit: any;
}

export const VisitDetailModal = ({ visible, onClose, visit }: VisitDetailModalProps) => {
    const { t } = useTranslation();
    if (!visit) return null;

    const getImageUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        // Normalize path: replace backslashes (Windows) with forward slashes
        let normalizedPath = path.replace(/\\/g, '/');

        // Remove leading slash if baseline has trailing or vice-versa
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        if (!normalizedPath.startsWith('/')) {
            normalizedPath = '/' + normalizedPath;
        }

        return `${baseUrl}${normalizedPath}`;
    };

    const getImages = () => {
        if (!visit.images) return [];
        let imageArray = [];
        if (typeof visit.images === 'string') {
            try {
                imageArray = JSON.parse(visit.images);
            } catch (e) {
                imageArray = [visit.images];
            }
        } else {
            imageArray = Array.isArray(visit.images) ? visit.images : [visit.images];
        }

        // Filter out empty strings and nulls
        return imageArray.filter((img: any) => typeof img === 'string' && img.length > 0);
    };

    const images = getImages();

    const getStatusConfig = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'CHECKED_IN' || s === 'APPROVED' || s === 'EXITOSO') return { label: t('success'), color: '#10b981' };
        if (s === 'PENDING') return { label: t('pending'), color: '#f59e0b' };
        return { label: s || t('unknownStatus'), color: '#ef4444' };
    };

    const config = getStatusConfig(visit.status);

    // Get the entry code from various possible fields
    const entryCode = visit.accessCode || visit.visitCode || visit.code || visit.manualCode;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={80} tint="dark" style={styles.modalContent}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('visitDetails')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Status Ribbon */}
                        <View style={[styles.statusRibbon, { backgroundColor: `${config.color}20` }]}>
                            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                        </View>

                        {/* QR Code Section (if available) */}
                        {((visit.qrCode || entryCode) && visit.status !== 'CHECKED_OUT') && (
                            <View style={styles.qrSection}>
                                <View style={styles.qrContainer}>
                                    <QRCode
                                        value={visit.qrCode || entryCode || 'INVALID'}
                                        size={180}
                                        color="#000000"
                                        backgroundColor="#ffffff"
                                        quietZone={10}
                                    />
                                </View>
                                <View style={styles.accessCodeContainer}>
                                    <Text style={styles.accessCodeLabel}>{t('manualEntryCode')}</Text>
                                    <Text style={styles.accessCodeValue}>{entryCode || '----'}</Text>
                                </View>
                            </View>
                        )}

                        {/* Images Section */}
                        {images.length > 0 ? (
                            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                                {images.map((img: string, index: number) => (
                                    <Image
                                        key={index}
                                        source={{ uri: getImageUrl(img) || undefined }}
                                        style={styles.visitorImage}
                                        contentFit="cover"
                                        transition={500}
                                    />
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.noImageContainer}>
                                <Ionicons name="person-outline" size={48} color="#475569" />
                                <Text style={styles.noImageText}>{t('noImageAvailable')}</Text>
                            </View>
                        )}

                        {/* Info Sections */}
                        <View style={styles.infoSection}>
                            <Text style={styles.visitorName}>{visit.visitorName || visit.name || t('guest')}</Text>
                            <Text style={styles.idNumber}>{visit.visitorIdNumber || visit.idNumber || 'N/A'}</Text>
                        </View>

                        <View style={styles.grid}>
                            <View style={styles.gridItem}>
                                <Ionicons name="car-outline" size={20} color="#3b82f6" />
                                <View>
                                    <Text style={styles.gridLabel}>{t('vehiclePlate')}</Text>
                                    <Text style={styles.gridValue}>{visit.vehiclePlate || visit.licensePlate || t('none')}</Text>
                                </View>
                            </View>
                            <View style={styles.gridItem}>
                                <Ionicons name="people-outline" size={20} color="#3b82f6" />
                                <View>
                                    <Text style={styles.gridLabel}>{t('companions')}</Text>
                                    <Text style={styles.gridValue}>{visit.companions || visit.companionCount || 0}</Text>
                                </View>
                            </View>
                        </View>

                        {visit.space && (
                            <BlurView intensity={20} tint="dark" style={[styles.hostCard, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                                <Text style={[styles.hostHeader, { color: '#10b981' }]}>{t('assignedParkingSpace')}</Text>
                                <View style={styles.hostRow}>
                                    <View style={[styles.hostAvatar, { backgroundColor: '#10b981' }]}>
                                        <Ionicons name="car" size={20} color="#ffffff" />
                                    </View>
                                    <View>
                                        <Text style={styles.hostName}>{visit.space.name}</Text>
                                        <Text style={styles.hostEmail}>{t('parkingGuide')}</Text>
                                    </View>
                                </View>
                            </BlurView>
                        )}

                        <BlurView intensity={20} tint="dark" style={styles.hostCard}>
                            <Text style={styles.hostHeader}>{t('authorizedByHost')}</Text>
                            <View style={styles.hostRow}>
                                <View style={styles.hostAvatar}>
                                    <Ionicons name="person" size={20} color="#ffffff" />
                                </View>
                                <View>
                                    <Text style={styles.hostName}>{visit.resident?.name || visit.host?.name || t('authorized')}</Text>
                                    <Text style={styles.hostEmail}>{visit.resident?.email || visit.host?.email || t('resident')}</Text>
                                </View>
                            </View>
                        </BlurView>

                        <View style={styles.metaInfo}>
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                <Text style={styles.metaText}>{t('created')}: {new Date(visit.createdAt).toLocaleString()}</Text>
                            </View>
                            {visit.entryTime && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="log-in-outline" size={16} color="#10b981" />
                                    <Text style={styles.metaText}>{t('entry')}: {new Date(visit.entryTime).toLocaleString()}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '85%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        padding: 24,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    statusRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        alignSelf: 'flex-start',
        marginBottom: 20,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    imageGallery: {
        width: '100%',
        height: 250,
        borderRadius: 24,
        marginBottom: 24,
    },
    visitorImage: {
        width: width - 48,
        height: 250,
        borderRadius: 24,
        resizeMode: 'cover',
    },
    noImageContainer: {
        width: '100%',
        height: 150,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    noImageText: {
        color: '#64748b',
        marginTop: 8,
        fontSize: 14,
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    accessCodeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    accessCodeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 2,
        marginBottom: 4,
    },
    accessCodeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 6,
    },
    infoSection: {
        marginBottom: 24,
    },
    visitorName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    idNumber: {
        fontSize: 16,
        color: '#94a3b8',
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    gridItem: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gridLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    gridValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    hostCard: {
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        marginBottom: 24,
    },
    hostHeader: {
        fontSize: 11,
        color: '#3b82f6',
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1,
    },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hostAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hostName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    hostEmail: {
        fontSize: 13,
        color: '#94a3b8',
    },
    metaInfo: {
        gap: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 13,
        color: '#64748b',
    }
});
