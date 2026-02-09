import { useAuth } from '../context/auth-context';

export function useBranding() {
    const { user } = useAuth();

    // Default branding values
    const DEFAULT_PRIMARY = '#4f46e5';
    const DEFAULT_SECONDARY = '#1e293b';

    const primary = user?.branding?.primaryColor || DEFAULT_PRIMARY;
    const secondary = user?.branding?.secondaryColor || DEFAULT_SECONDARY;
    const logo = user?.branding?.logo || null;
    const plan = user?.plan || 'starter';
    const isElite = plan === 'elite';

    return {
        primary,
        secondary,
        logo,
        plan,
        isElite,
    };
}
