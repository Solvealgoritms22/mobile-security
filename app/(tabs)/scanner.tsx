import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Dimensions, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_URL } from '../../constants/api';
import { useTranslation } from '../../context/translation-context';

export default function ScannerScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { t } = useTranslation();

    // Default to front camera on Web (usually laptop), back on Mobile
    const [facing, setFacing] = useState<CameraType>(Platform.OS === 'web' ? 'front' : 'back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showManualModal, setShowManualModal] = useState(false);
    const [appState, setAppState] = useState(AppState.currentState);

    const [flash, setFlash] = useState(false);

    // Animation refs
    const successAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const lastScanRef = useRef<{ data: string, time: number } | null>(null);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [loading]);

    const showSuccessFeedback = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.sequence([
            Animated.timing(successAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.delay(800),
            Animated.timing(successAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={[styles.container, { backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
                <Ionicons name="camera-outline" size={64} color="#3b82f6" style={{ marginBottom: 20 }} />
                <Text style={[styles.title, { marginBottom: 12, textAlign: 'center' }]}>{t('cameraAccessRequired')}</Text>
                <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                    {t('cameraPermissionText')}
                </Text>
                <Pressable
                    onPress={requestPermission}
                    style={{
                        backgroundColor: '#3b82f6',
                        paddingHorizontal: 32,
                        paddingVertical: 16,
                        borderRadius: 16
                    }}
                >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>{t('grantPermission')}</Text>
                </Pressable>
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const handleManualCodeSubmit = async () => {
        if (manualCode.length !== 4) {
            Alert.alert(t('invalidCode'), t('enter4DigitCode'));
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/visits/check-in-code`, { accessCode: manualCode });

            setShowManualModal(false);
            setManualCode('');
            showSuccessFeedback();

            const isCheckOut = response.data.status === 'CHECKED_OUT';
            Alert.alert(
                isCheckOut ? t('exitRegistered') : t('accessGranted'),
                isCheckOut
                    ? t('checkOutSuccess').replace('{name}', response.data.visitorName || response.data.visitor?.name)
                    : t('checkInSuccess').replace('{name}', response.data.visitorName || response.data.visitor?.name),
                [{ text: "OK" }]
            );
        } catch (error: any) {
            const message = error.response?.data?.message || t('invalidExpiredCode');
            Alert.alert(t('accessDenied'), message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;

        // Anti-throttle check: ignore same code scanned within 5 seconds
        const nowMs = Date.now();
        if (lastScanRef.current && lastScanRef.current.data === data && (nowMs - lastScanRef.current.time < 5000)) {
            return;
        }
        lastScanRef.current = { data, time: nowMs };

        setScanned(true);
        setLoading(true);
        showSuccessFeedback();

        try {
            let qrCode = data;

            // Try to parse if it's JSON (like the Resident Identity Pass)
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'RESIDENT_ID') {
                    showSuccessFeedback();
                    Alert.alert(
                        t('residentApproved'),
                        `Name: ${parsed.name}\nUnit: ${parsed.unit || t('assignedResident')}\n\n${t('residentAccessVerified')}`,
                        [{ text: t('scanNext'), onPress: () => setScanned(false) }]
                    );
                    setLoading(false);
                    return;
                }
            } catch (e) {
                qrCode = data.split('/').pop() || data;
            }

            const response = await axios.post(`${API_URL}/visits/check-in`, { qrCode });

            const isCheckOut = response.data.status === 'CHECKED_OUT';
            const isVip = response.data.isVip === true;

            let alertMessage = isCheckOut
                ? t('checkOutSuccess').replace('{name}', response.data.visitorName)
                : t('checkInSuccess').replace('{name}', response.data.visitorName);

            if (isVip && !isCheckOut) {
                alertMessage += `\n\n⭐ VIP - NO REVISAR VEHÍCULO`;
            }

            Alert.alert(
                isCheckOut ? t('exitRegistered') : t('accessGranted'),
                alertMessage,
                [{ text: t('scanNext'), onPress: () => setScanned(false) }]
            );
        } catch (error: any) {
            console.error('Scan Error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = error.response?.data?.message || t('invalidExpiredCode');
            Alert.alert(
                t('accessDenied'),
                message,
                [{ text: t('retry'), onPress: () => setScanned(false) }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Relax active check for Web to ensure it renders if the browser thinks it's active
    const isCameraActive = isFocused && (Platform.OS === 'web' || appState === 'active');

    return (
        <View style={styles.container}>
            {isCameraActive && (
                <CameraView
                    style={[styles.camera, Platform.OS === 'web' && { height: '100%', width: '100%' }]}
                    facing={facing}
                    enableTorch={flash}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    onMountError={(error) => {
                        console.error('Camera mount error:', error);
                        Alert.alert(t('cameraError'), t('cameraMountError'));
                    }}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                >
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.iconButton}>
                            <Ionicons name="close" size={28} color="#ffffff" />
                        </Pressable>
                        <Text style={styles.title}>{t('tabScanner')}</Text>
                        <View style={styles.headerRight}>
                            <Pressable
                                style={[styles.iconButton, { marginRight: 12 }]}
                                onPress={() => setFlash(!flash)}
                            >
                                <Ionicons name={(flash ? "flash" : "flash-off") as any} size={24} color={flash ? "#fbbf24" : "#ffffff"} />
                            </Pressable>
                            <Pressable onPress={toggleCameraFacing} style={styles.iconButton}>
                                <Ionicons name="camera-reverse-outline" size={28} color="#ffffff" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Scanner Main Content */}
                    <View style={styles.scannerContainer}>
                        <View style={styles.scanArea}>
                            <Animated.View style={[
                                styles.scannerFrame,
                                { transform: [{ scale: pulseAnim }] },
                                scanned && { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                            ]} />

                            {/* Success Icon Overlay */}
                            <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
                                <View style={styles.successIconBg}>
                                    <Ionicons name="checkmark" size={60} color="#ffffff" />
                                </View>
                            </Animated.View>
                        </View>

                        <Text style={styles.instruction}>
                            {loading ? t('validating') : t('pointCamera')}
                        </Text>

                        <Pressable
                            style={styles.manualButton}
                            onPress={() => setShowManualModal(true)}
                        >
                            <Ionicons name="keypad-outline" size={24} color="#ffffff" />
                            <Text style={styles.manualButtonText}>{t('manualCodeEntry')}</Text>
                        </Pressable>
                    </View>
                </CameraView>
            )}

            {!isCameraActive && (
                <View style={[styles.camera, { backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="camera-outline" size={48} color="#334155" />
                </View>
            )}

            {/* Manual Entry Modal */}
            <Modal
                visible={showManualModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowManualModal(false)}
            >
                <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('manualEntryTitle')}</Text>
                            <Pressable onPress={() => setShowManualModal(false)}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </Pressable>
                        </View>

                        <Text style={styles.modalSubtitle}>{t('manualEntrySubtitle')}</Text>

                        <View style={styles.codeInputContainer}>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="0000"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                keyboardType="number-pad"
                                maxLength={4}
                                value={manualCode}
                                onChangeText={setManualCode}
                                autoFocus={true}
                            />
                        </View>

                        <Pressable
                            style={[styles.submitButton, loading && { opacity: 0.5 }]}
                            onPress={handleManualCodeSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? t('validating') : t('verifyCode')}
                            </Text>
                        </Pressable>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        left: 0,
        top: 68,
        zIndex: -1,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        paddingBottom: 40,
    },
    scanArea: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerFrame: {
        width: 280,
        height: 280,
        borderWidth: 2,
        borderColor: '#10b981',
        borderRadius: 32,
        backgroundColor: 'transparent',
    },
    successOverlay: {
        position: 'absolute',
        width: 280,
        height: 280,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    successIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    instruction: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.9,
    },
    manualButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 20,
        gap: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    manualButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        width: Dimensions.get('window').width - 48,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#94a3b8',
        lineHeight: 22,
        marginBottom: 24,
    },
    codeInputContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    codeInput: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 20,
        width: '100%',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
