import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

import { useTranslation } from '@/context/translation-context';

export default function LoginScreen() {
    const { login } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
    const [brandingName, setBrandingName] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const tenantId = await AsyncStorage.getItem('tenantId');
                if (tenantId) {
                    const res = await fetch(`${API_URL}/tenants/${tenantId}/branding`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.logoUrl) {
                            setBrandingLogo(`${API_URL}${data.logoUrl}`);
                        }
                        if (data.name) {
                            setBrandingName(data.name);
                        }
                    }
                }
            } catch { }
        })();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            showToast(t('enterCredentials'), 'error');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            showToast(t('welcomeBack'), 'success');
        } catch (err: any) {
            const msg = err.response?.data?.message || t('loginError');
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <BlurView intensity={40} tint="dark" style={styles.logoContainer}>
                        {brandingLogo ? (
                            <Image source={{ uri: brandingLogo }} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="contain" />
                        ) : (
                            <Ionicons name="shield-checkmark" size={64} color="#3b82f6" />
                        )}
                    </BlurView>
                    <Text style={styles.title}>{brandingName || t('securityAccess')}</Text>
                    <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>
                </View>

                {/* Form */}
                <BlurView intensity={30} tint="dark" style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('email')}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder={t('enterEmail')}
                                placeholderTextColor="#64748b"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('password')}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder={t('enterPassword')}
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <Pressable
                        onPress={handleLogin}
                        disabled={loading}
                        style={styles.loginButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                            style={styles.loginButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="log-in-outline" size={24} color="#ffffff" />
                                    <Text style={styles.loginButtonText}>{t('signIn')}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </BlurView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        overflow: 'hidden',
    },
    errorText: {
        flex: 1,
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButtonWrapper: {
        marginTop: 8,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 18,
        borderRadius: 16,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
