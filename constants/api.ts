import { Platform } from 'react-native';

// API URL configuration based on platform
// - Web: uses localhost
// - Android Emulator: uses 10.0.2.2 (special Android emulator IP to access host machine)
// - iOS Simulator: uses localhost
// - Production: should be replaced with actual API URL via environment variable
export const API_URL = Platform.select({
    web: 'https://backend-cosevi.onrender.com',
    android: 'https://backend-cosevi.onrender.com',
    ios: 'https://backend-cosevi.onrender.com',
    default: 'https://backend-cosevi.onrender.com',
});
