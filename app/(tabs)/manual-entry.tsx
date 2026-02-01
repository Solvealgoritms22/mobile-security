import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';

export default function ManualEntryScreen() {
    const { token, refreshData } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [visitorName, setVisitorName] = useState('');
    const [visitorId, setVisitorId] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [companions, setCompanions] = useState('0');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [residents, setResidents] = useState<any[]>([]);
    const [loadingResidents, setLoadingResidents] = useState(false);
    const [showResidentModal, setShowResidentModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState<any>(null);
    const [spaces, setSpaces] = useState<any[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => {
        fetchResidents();
    }, []);

    const fetchResidents = async () => {
        try {
            setLoadingResidents(true);
            const response = await axios.get(`${API_URL}/users/residents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResidents(response.data);
        } catch (error) {
            console.error('Error fetching residents:', error);
            showToast(t('loadResidentsFailed'), 'error');
        } finally {
            setLoadingResidents(false);
        }
    };

    const fetchSpaces = async (residentId: string) => {
        try {
            const response = await axios.get(`${API_URL}/spaces?residentId=${residentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Show only available spaces or the ones that are not occupied
            setSpaces(response.data.filter((s: any) => s.status === 'AVAILABLE'));
        } catch (error) {
            console.error('Error fetching spaces:', error);
        }
    };

    const handleSelectResident = (resident: any) => {
        setSelectedResident(resident);
        setSearchQuery('');
        setShowResidentModal(false);
        setSelectedSpaceId(null);
        fetchSpaces(resident.id);
    };

    const pickImage = async () => {
        if (!Platform.OS.match(/web/)) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('cameraAccessRequired'), t('cameraPermissionText'));
                return;
            }
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage('data:image/jpeg;base64,' + result.assets[0].base64);
        }
    };

    const handleSubmit = async () => {
        if (!visitorName || !visitorId) {
            showToast(t('visitorNameIdRequired'), 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/visits/manual-checkin`, {
                visitorName,
                visitorIdNumber: visitorId,
                licensePlate: licensePlate || undefined,
                vehiclePlate: licensePlate || undefined,
                companionCount: parseInt(companions) || 0,
                companions: parseInt(companions) || 0,
                spaceId: selectedSpaceId || undefined,
                images: image ? JSON.stringify([image]) : JSON.stringify([]),
                hostId: selectedResident?.id,
                residentId: selectedResident?.id,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const isVip = response.data.isVip === true;
            let successMsg = t('checkInToastSuccess');
            if (isVip) {
                successMsg += '\n\n⭐ VIP - NO REVISAR VEHÍCULO';
            }

            Alert.alert(
                t('accessGranted'),
                successMsg,
                [{
                    text: 'OK', onPress: () => {
                        refreshData();
                        router.back();
                    }
                }]
            );
        } catch (error: any) {
            showToast(error.response?.data?.message || t('checkInFailed'), 'error');
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
                    <Text style={styles.title}>{t('manualEntryTitle')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Form */}
                <BlurView intensity={30} tint="dark" style={styles.formCard}>

                    {/* Resident Selection */}
                    <Text style={[styles.label, { marginTop: 0 }]}>{t('visitDestination')}</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowResidentModal(true)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Ionicons name="home-outline" size={20} color="#94a3b8" />
                            <Text style={[styles.dropdownText, selectedResident && { color: '#ffffff' }]}>
                                {selectedResident ? `${selectedResident.name} - Apt ${selectedResident.residentProfile?.unitNumber || 'N/A'}` : t('selectResident')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                    </TouchableOpacity>

                    <Text style={styles.label}>{t('visitorNameLabel')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('enterFullName')}
                            placeholderTextColor="#64748b"
                            value={visitorName}
                            onChangeText={setVisitorName}
                        />
                    </View>

                    <Text style={styles.label}>{t('visitorIdLabel')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="card-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('enterIdNumber')}
                            placeholderTextColor="#64748b"
                            value={visitorId}
                            onChangeText={setVisitorId}
                        />
                    </View>

                    <Text style={styles.label}>{t('licensePlateOptional')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="car-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('enterPlateNumber')}
                            placeholderTextColor="#64748b"
                            value={licensePlate}
                            onChangeText={(text) => setLicensePlate(text.toUpperCase())}
                            autoCapitalize="characters"
                        />
                    </View>

                    <Text style={styles.label}>{t('companionsOptional')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="people-outline" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.input}
                            placeholder={t('numberOfGuests')}
                            placeholderTextColor="#64748b"
                            value={companions}
                            onChangeText={setCompanions}
                            keyboardType="numeric"
                        />
                    </View>

                    <Text style={styles.label}>{t('documentPhoto')}</Text>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera" size={32} color="#3b82f6" />
                                <Text style={styles.imagePlaceholderText}>{t('takePhoto')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {image && (
                        <Pressable onPress={() => setImage(null)} style={styles.removeImage}>
                            <Text style={styles.removeImageText}>{t('removePhoto')}</Text>
                        </Pressable>
                    )}

                    {selectedResident && (
                        <>
                            <Text style={styles.label}>{t('parkingAllocation')}</Text>
                            {spaces.length === 0 ? (
                                <Text style={styles.noSpacesText}>{t('noSpacesAvailable')}</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.spaceSelector}>
                                    <TouchableOpacity
                                        style={[styles.spaceOption, !selectedSpaceId && styles.spaceOptionActive]}
                                        onPress={() => setSelectedSpaceId(null)}
                                    >
                                        <BlurView intensity={!selectedSpaceId ? 50 : 20} tint="dark" style={styles.spaceBlur}>
                                            <Text style={[styles.spaceText, !selectedSpaceId && styles.spaceTextActive]}>{t('none')}</Text>
                                        </BlurView>
                                    </TouchableOpacity>
                                    {spaces.map((space) => (
                                        <TouchableOpacity
                                            key={space.id}
                                            style={[styles.spaceOption, selectedSpaceId === space.id && styles.spaceOptionActive]}
                                            onPress={() => setSelectedSpaceId(space.id)}
                                        >
                                            <BlurView intensity={selectedSpaceId === space.id ? 50 : 20} tint="dark" style={styles.spaceBlur}>
                                                <Text style={[styles.spaceText, selectedSpaceId === space.id && styles.spaceTextActive]}>{space.name}</Text>
                                            </BlurView>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </>
                    )}
                </BlurView>

                {/* Submit Button */}
                <Button
                    title={t('checkInVisitor')}
                    onPress={handleSubmit}
                    loading={loading}
                    variant="primary"
                    icon="checkmark-circle-outline"
                    style={{ marginTop: 8, marginBottom: 40 }}
                />
            </ScrollView>

            <Modal
                visible={showResidentModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowResidentModal(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={40} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('selectResident')}</Text>
                            <TouchableOpacity onPress={() => setShowResidentModal(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('searchResidentPlaceholder')}
                                placeholderTextColor="#64748b"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                        </View>

                        {loadingResidents ? (
                            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={residents.filter(r =>
                                    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (r.residentProfile?.unitNumber && r.residentProfile.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                                )}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.residentItem}
                                        onPress={() => handleSelectResident(item)}
                                    >
                                        <View style={styles.residentAvatar}>
                                            <Text style={styles.residentInitials}>{item.name.substring(0, 2).toUpperCase()}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.residentName}>{item.name}</Text>
                                            <Text style={styles.residentUnit}>Unit: {item.residentProfile?.unitNumber || 'N/A'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>{t('noResidentsFound').replace('{query}', searchQuery)}</Text>
                                }
                            />
                        )}
                    </BlurView>
                </View>
            </Modal>
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
        paddingBottom: 100,
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
    formCard: {
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
        marginBottom: 8,
        marginTop: 16,
    },
    inputContainer: {
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
        fontSize: 16,
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
    imagePicker: {
        height: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    imagePlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholderText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    removeImage: {
        alignItems: 'center',
        marginTop: 8,
    },
    removeImageText: {
        color: '#ef4444',
        fontSize: 14,
    },
    // Parking Spaces
    spaceSelector: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
    },
    spaceOption: {
        width: 100,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 10,
    },
    spaceBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spaceOptionActive: {
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    spaceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    spaceTextActive: {
        color: '#ffffff',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dropdownText: {
        fontSize: 16,
        color: '#64748b',
    },
    noSpacesText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 8,
    },
    // Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    residentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginBottom: 12,
        gap: 16,
    },
    residentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    residentInitials: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    residentName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    residentUnit: {
        color: '#94a3b8',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
});
