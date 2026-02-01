import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { io } from 'socket.io-client';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    idNumber?: string;
    phone?: string;
    badgeNumber?: string;
    gate?: string;
    profileImage?: string;
    pushNotificationsEnabled?: boolean;
    pushToken?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (partialUser: Partial<User>) => Promise<void>;
    updatePushToken: (token: string) => Promise<void>;
    onDataRefresh: (callback: () => void) => () => void;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshCallbacks, setRefreshCallbacks] = useState<(() => void)[]>([]);
    const router = useRouter();
    const segments = useSegments();

    // Restore session on app load
    useEffect(() => {
        restoreSession();
    }, []);

    // Handle route protection
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const isAuthorized = user && (user.role === 'SECURITY' || user.role === 'ADMIN');

        if (!user && inAuthGroup) {
            router.replace('/login');
        } else if (user && !isAuthorized) {
            // Log out and redirect if role is invalid for this app
            logout();
        } else if (user && !inAuthGroup && isAuthorized) {
            router.replace('/(tabs)');
        }

        if (user && !isLoading && Platform.OS !== 'web') {
            registerForPushNotificationsAsync().then(token => {
                if (token) updatePushToken(token);
            });
        }
    }, [user, segments, isLoading]);

    // Global Emergency Listener
    useEffect(() => {
        if (!user) return;

        const socket = io(API_URL.replace('/api', ''));

        socket.on('connect', () => {
            console.log('Security App connected to socket');
        });

        socket.on('emergencyAlert', (alert: any) => {
            console.log('Emergency Alert Received:', alert);

            // Trigger high-impact haptics
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }

            Alert.alert(
                '🚨 EMERGENCY ALERT 🚨',
                `${alert.type?.toUpperCase()?.replace('_', ' ')}\nLocation: ${alert.location || 'Unknown'}\nReported by: ${alert.sender?.name || 'Unknown'}`,
                [{ text: 'ACKNOWLEDGE', style: 'destructive' }],
                { cancelable: false }
            );
        });

        socket.on('visitUpdate', (update: any) => {
            console.log('Real-time visit update received:', update);
            refreshCallbacks.forEach(cb => cb());
        });

        // Push Notification Listeners (Native Only)
        let notificationListener: any;
        let responseListener: any;

        if (Platform.OS !== 'web') {
            notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification Received:', notification);
            });

            responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification Response:', response);
            });
        }

        return () => {
            socket.disconnect();
            if (notificationListener) notificationListener.remove();
            if (responseListener) responseListener.remove();
        };
    }, [user]);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push Token:', token);
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
    }

    const restoreSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Set default Authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (error) {
            console.error('Failed to restore session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });

            const { access_token, user: userData } = response.data;

            // Role-based validation for Security App
            if (userData.role !== 'SECURITY' && userData.role !== 'ADMIN') {
                throw { response: { data: { message: 'Access Denied: Security account required for this app.' } } };
            }

            // Store token and user data
            await AsyncStorage.setItem('authToken', access_token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setToken(access_token);
            setUser(userData);

            // Set default Authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            router.replace('/(tabs)');
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');

            setToken(null);
            setUser(null);

            // Remove Authorization header
            delete axios.defaults.headers.common['Authorization'];

            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const updateUser = async (partialUser: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...partialUser };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const updatePushToken = async (pushToken: string) => {
        if (!user || user.pushToken === pushToken) return;
        try {
            await axios.patch(`${API_URL}/users/${user.id}/push-settings`, { pushToken });
            await updateUser({ pushToken });
        } catch (error) {
            console.error('Failed to update push token on backend:', error);
        }
    };

    const onDataRefresh = (callback: () => void) => {
        setRefreshCallbacks(prev => [...prev, callback]);
        return () => {
            setRefreshCallbacks(prev => prev.filter(cb => cb !== callback));
        };
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, updatePushToken, onDataRefresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
