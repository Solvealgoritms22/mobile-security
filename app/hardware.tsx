import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useBranding } from '@/hooks/useBranding';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HardwareMonitorScreen() {
    const { token, onDataRefresh } = useAuth();
    const { primary } = useBranding();
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API_URL}/hardware/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch hardware events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const unsubscribe = onDataRefresh(fetchEvents);
        return unsubscribe;
    }, []);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'MOTION_DETECTED': return 'walk';
            case 'DOOR_OPENED': return 'door-open';
            case 'DOOR_CLOSED': return 'business';
            case 'SENSOR_TRIGGERED': return 'contract';
            default: return 'radio-outline';
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
            <Stack.Screen options={{
                title: 'Hardware Monitor',
                headerTransparent: true,
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Real-time Monitor</Text>
                    <Text style={styles.subtitle}>Elite Security Infrastructure</Text>
                </View>

                {events.length === 0 && !loading ? (
                    <BlurView intensity={40} tint="dark" style={styles.emptyCard}>
                        <Ionicons name="videocam-off-outline" size={48} color="#64748b" />
                        <Text style={styles.emptyText}>No events recorded yet</Text>
                    </BlurView>
                ) : (
                    events.map((event, index) => (
                        <BlurView key={event.id || index} intensity={60} tint="dark" style={styles.eventCard}>
                            <View style={[styles.iconContainer, { backgroundColor: primary + '20' }]}>
                                <Ionicons name={getEventIcon(event.type) as any} size={24} color={primary} />
                            </View>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventType}>{event.type.replace('_', ' ')}</Text>
                                <Text style={styles.eventDevice}>{event.device?.name || 'Unknown Device'}</Text>
                                <Text style={styles.eventTime}>
                                    {new Date(event.createdAt).toLocaleTimeString()}
                                </Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.statusText}>LIVE</Text>
                            </View>
                        </BlurView>
                    ))
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingTop: 120 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 16, color: '#94a3b8' },
    eventCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    eventInfo: { flex: 1 },
    eventType: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    eventDevice: { fontSize: 14, color: '#94a3b8' },
    eventTime: { fontSize: 12, color: '#64748b', marginTop: 4 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
        marginRight: 6
    },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#ef4444' },
    emptyCard: {
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    emptyText: { color: '#64748b', marginTop: 12, fontSize: 16 }
});
