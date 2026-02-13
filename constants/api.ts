import { Platform } from 'react-native';

// API URL configuration based on platform
// - Web: uses localhost
// - Android Emulator: uses 10.0.2.2 (special Android emulator IP to access host machine)
// - iOS Simulator: uses localhost
// - Production: should be replaced with actual API URL via environment variable
export const API_URL = Platform.select({
    web: 'https://backend-cosevi.vercel.app/api',
    android: 'https://backend-cosevi.vercel.app/api',
    ios: 'https://backend-cosevi.vercel.app/api',
    default: 'https://backend-cosevi.vercel.app/api',
});

export const PUSHER_KEY = '8910086b955700fc2641';
export const PUSHER_CLUSTER = 'us2';
