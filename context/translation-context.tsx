import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'es';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Tabs
        tabHome: 'Home',
        tabScanner: 'Scanner',
        tabReports: 'Reports',
        tabProfile: 'Profile',

        // Profile
        securityOfficer: 'SECURITY OFFICER',
        onDuty: 'ON DUTY',
        currentAssignment: 'Current Assignment',
        postGate: 'Post / Gate',
        officerDetails: 'Officer Details',
        email: 'Email',
        identification: 'Identification',
        phone: 'Phone',
        badgeNumber: 'Badge #',
        systemSettings: 'System Settings',
        notifications: 'Notifications',
        language: 'Language',
        appLanguage: 'Change app language',
        endShiftLogout: 'End Shift & Logout',
        signOutConfirm: 'Are you sure you want to end your shift and sign out?',
        cancel: 'Cancel',
        version: 'Version',
        soon: 'SOON',

        // Home
        securityDashboard: 'Security Dashboard',
        activeVisitors: 'Active Visitors',
        pendingInvites: 'Pending Invites',
        emergencyAlerts: 'Emergency Alerts',
        quickActions: 'Quick Actions',
        scanQR: 'Scan QR Code',
        manualEntry: 'Manual Entry',
        viewReports: 'View Reports',
        contacts: 'Contacts',
        today: 'Today',
        flagged: 'Flagged',
        recentActivity: 'Recent Activity',
        seeAll: 'See All',
        visitorLog: 'Visitor Log',
        emergencyAlert: 'Emergency Alert',
        parkingStatus: 'Parking Status',
        lprCheck: 'LPR Check',
        validateVisitorEntry: 'Validate visitor entry',
        officer: 'Officer',
        guest: 'Guest',
        visitor: 'Visitor',
        noRecentActivity: 'No recent activity',
        logout: 'Logout',
        signOut: 'Sign Out',

        // Scanner
        cameraScanner: 'Camera Scanner',
        pointCamera: 'Point the camera at the visitor\'s QR code',
        manualCodeEntry: 'Manual Code Entry',
        validating: 'Validating...',
        verifyCode: 'Verify Access Code',
        manualEntryTitle: 'Manual Entry',
        manualEntrySubtitle: 'Enter the 4-digit code shown on the visitor\'s pass.',
        cameraAccessRequired: 'Camera Access Required',
        cameraPermissionText: 'We need your permission to use the camera to scan visitor QR codes.',
        grantPermission: 'Grant Permission',
        invalidCode: 'Invalid Code',
        enter4DigitCode: 'Please enter a 4-digit code',
        accessGranted: 'Access Granted',
        checkInSuccess: 'Visitor: {name}\nStatus: CHECKED IN',
        accessDenied: 'Access Denied',
        invalidExpiredCode: 'Invalid or expired code',
        residentApproved: 'Resident Approved',
        residentAccessVerified: 'Access verified successfully.',
        assignedResident: 'Assigned Resident',
        scanNext: 'Scan Next',

        // Manual Entry
        visitDestination: 'Visit Destination (Resident) *',
        selectResident: 'Select a Resident',
        visitorNameLabel: 'Visitor Name *',
        enterFullName: 'Enter full name',
        visitorIdLabel: 'ID Number *',
        enterIdNumber: 'Enter ID number',
        licensePlateOptional: 'License Plate (Optional)',
        enterPlateNumber: 'Enter plate number',
        companionsOptional: 'Companions (Optional)',
        numberOfGuests: 'Number of guests',
        documentPhoto: 'Document/Identity Photo',
        takePhoto: 'Take Photo',
        removePhoto: 'Remove Photo',
        parkingAllocation: 'Parking Allocation (Resident\'s Spots)',
        noSpacesAvailable: 'No available spaces for this resident.',
        none: 'None',
        checkInVisitor: 'Check In Visitor',
        visitorNameIdRequired: 'Visitor name and ID are required',
        checkInToastSuccess: 'Visitor checked in successfully',
        checkInFailed: 'Failed to check in visitor',
        loadResidentsFailed: 'Failed to load residents',
        searchResidentPlaceholder: 'Search by name or unit...',
        noResidentsFound: 'No residents found matching "{query}"',

        // Report
        reportIncident: 'Report Incident',
        unauthorizedEntry: 'Unauthorized Entry',
        suspiciousActivity: 'Suspicious Activity',
        emergency: 'Emergency',
        incidentTypeOther: 'Other',
        sectionIncidentType: 'Incident Type',
        sectionDescription: 'Description',
        describeIncidentPlaceholder: 'Describe the incident in detail...',
        submitReport: 'Submit Report',
        submitting: 'Submitting...',
        reportSubmitted: 'Report Submitted',
        reportLogged: 'Incident report has been logged',
        selectTypeDescriptionError: 'Please select incident type and provide description',
        submitReportFailed: 'Failed to submit report. Please try again.',

        // Emergency
        emergencyConfirmTitle: 'Confirm Emergency',
        emergencyConfirmMessage: 'Are you sure you want to trigger a {type} alert? This will notify all nearby units.',
        triggerAlert: 'TRIGGER ALERT',
        alertActive: '{type} alert active',
        alertFailed: 'Failed to send alert: {msg}',
        emergencyPolice: 'Security/Police',
        emergencyMedical: 'Medical Emergency',
        emergencyFire: 'Fire/Hazard',
        emergencyBackup: 'Request Backup',
        emergencyCenter: 'Emergency Center',
        panic: 'PANIC',
        holdSilentAlert: 'Hold for 2 seconds for silent alert',
        generalPanic: 'General Panic',

        // Profile
        mediaPermissionRequired: 'Permission to access media library is required',
        notificationsEnabled: 'Notifications enabled',
        notificationsDisabled: 'Notifications disabled',
        updatePreferencesFailed: 'Failed to update preferences',
        profileImageUpdated: 'Profile image updated',
        updateProfileImageFailed: 'Failed to update profile image',
        endShiftTitle: 'End Shift',

        // Parking
        parkingStatusTitle: 'Parking Status',
        parkingAvailable: 'Available',
        parkingOccupied: 'Occupied',
        spacesDirectory: 'Spaces Directory',
        noParkingSpaces: 'No parking spaces configured',
        statusAvailable: 'AVAILABLE',
        statusOccupied: 'OCCUPIED',

        // Verify Plate
        verifyPlateTitle: 'Verify Plate',
        enterPlateError: 'Please enter a license plate',
        verifyPlateFailed: 'Failed to verify plate',
        plateNumberLabel: 'License Plate Number',
        enterPlatePlaceholder: 'ENTER PLATE',
        authorized: 'AUTHORIZED',
        notFound: 'NOT FOUND',
        visitorLabel: 'Visitor:',
        idLabel: 'ID:',
        hostLabel: 'Host:',
        statusLabel: 'Status:',
        unknown: 'Unknown',
        noActiveVisits: 'No active visits with this plate',
        statusCheckedIn: 'CHECKED IN',

        // Checkout
        checkout: 'Check-out',
        activeVisitorsCount: '{count} active visitors',
        loading: 'Loading...',
        confirmCheckout: 'Confirm Check-out',
        confirmCheckoutMessage: 'Check out {name}?',
        visitorCheckedOut: 'Visitor checked out',
        checkoutFailed: 'Failed to check out',
        noVehicle: 'No vehicle',
        enteredAt: 'Entered {time}',
        noActiveVisitors: 'No Active Visitors',
        allCheckedOut: 'All visitors have checked out',

        // Expected
        expectedToday: 'Expected Today',
        expectedVisitorsCount: '{count} expected visitors',
        statusPending: 'PENDING',
        noVisitorsExpected: 'No Visitors Expected',
        noVisitorsScheduled: 'No visitors scheduled for today',

        // Activity Log
        activityLog: 'Activity Log',
        totalEntries: '{count} total entries',
        startDate: 'Start Date',
        endDate: 'End Date',
        na: 'N/A',
        statusCheckedOut: 'CHECKED OUT',
        noActivityFound: 'No Activity Found',
        adjustFilters: 'Try adjusting your filters',

        // Login
        securityAccess: 'Security Access',
        signInSubtitle: 'Sign in to begin your shift',
        password: 'Password',
        enterEmail: 'Enter your email',
        enterPassword: 'Enter your password',
        signIn: 'Sign In',
        loginError: 'Login failed. Check credentials.',
        welcomeBack: 'Welcome back!',
        enterCredentials: 'Please enter both email and password',

        // Common / Missing
        details: 'Details',
        manualEntryCode: 'MANUAL ENTRY CODE',
        noVisitorsFound: 'No Visitors found',
        vehiclePlate: 'Vehicle Plate',
        companions: 'Companions',
        welcome: 'Welcome',
        resident: 'Resident',
        visitDetails: 'Visit Details',
        success: 'SUCCESS',
        pending: 'PENDING',
        unknownStatus: 'UNKNOWN',
        noImageAvailable: 'No image available',
        assignedParkingSpace: 'ASSIGNED PARKING SPACE',
        parkingGuide: 'Guide the guest to this spot',
        authorizedByHost: 'AUTHORIZED BY (HOST)',
        created: 'Created',
        entry: 'Entry',
    },
    es: {
        // Tabs
        tabHome: 'Inicio',
        tabScanner: 'Escáner',
        tabReports: 'Reportes',
        tabProfile: 'Perfil',

        // Profile
        securityOfficer: 'OFICIAL DE SEGURIDAD',
        onDuty: 'EN SERVICIO',
        currentAssignment: 'Asignación Actual',
        postGate: 'Puesto / Portón',
        officerDetails: 'Detalles del Oficial',
        email: 'Correo',
        identification: 'Identificación',
        phone: 'Teléfono',
        badgeNumber: 'Placa #',
        systemSettings: 'Ajustes del Sistema',
        notifications: 'Notificaciones',
        language: 'Idioma',
        appLanguage: 'Cambiar idioma de la app',
        endShiftLogout: 'Terminar Turno y Salir',
        signOutConfirm: '¿Está seguro de que desea terminar su turno y cerrar sesión?',
        cancel: 'Cancelar',
        version: 'Versión',
        soon: 'PRONTO',

        // Home
        securityDashboard: 'Panel de Seguridad',
        activeVisitors: 'Visitantes Activos',
        pendingInvites: 'Inv. Pendientes',
        emergencyAlerts: 'Alertas de Emergencia',
        quickActions: 'Acciones Rápidas',
        scanQR: 'Escanear QR',
        manualEntry: 'Entrada Manual',
        viewReports: 'Ver Reportes',
        contacts: 'Contactos',
        today: 'Hoy',
        flagged: 'Marcados',
        recentActivity: 'Actividad Reciente',
        seeAll: 'Ver Todo',
        visitorLog: 'Registro de Visitas',
        emergencyAlert: 'Alerta de Emergencia',
        parkingStatus: 'Estado de Parqueo',
        lprCheck: 'Chequeo LPR',
        validateVisitorEntry: 'Validar entrada de visitante',
        officer: 'Oficial',
        guest: 'Invitado',
        // visitor: 'Visitante', // This key is not duplicated, but 'resident' is.
        noRecentActivity: 'No hay actividad reciente',
        logout: 'Cerrar Sesión',
        signOut: 'Cerrar Sesión',

        // Scanner
        cameraScanner: 'Escáner de Cámara',
        pointCamera: 'Apunte la cámara al código QR del visitante',
        manualCodeEntry: 'Entrada de Código Manual',
        validating: 'Validando...',
        verifyCode: 'Verificar Código de Acceso',
        manualEntryTitle: 'Entrada Manual',
        manualEntrySubtitle: 'Ingrese el código de 4 dígitos que se muestra en el pase del visitante.',
        cameraAccessRequired: 'Acceso a la Cámara Requerido',
        cameraPermissionText: 'Necesitamos su permiso para usar la cámara y escanear códigos QR.',
        grantPermission: 'Otorgar Permiso',
        invalidCode: 'Código Inválido',
        enter4DigitCode: 'Por favor ingrese un código de 4 dígitos',
        accessGranted: 'Acceso Concedido',
        checkInSuccess: 'Visitante: {name}\nEstado: INGRESADO',
        accessDenied: 'Acceso Denegado',
        invalidExpiredCode: 'Código inválido o expirado',
        residentApproved: 'Residente Aprobado',
        residentAccessVerified: 'Acceso verificado exitosamente.',
        assignedResident: 'Residente Asignado',
        scanNext: 'Escanear Siguiente',

        // Manual Entry
        visitDestination: 'Destino de Visita (Residente) *',
        selectResident: 'Seleccionar Residente',
        visitorNameLabel: 'Nombre del Visitante *',
        enterFullName: 'Ingrese nombre completo',
        visitorIdLabel: 'Número de ID *',
        enterIdNumber: 'Ingrese número de ID',
        licensePlateOptional: 'Placa (Opcional)',
        enterPlateNumber: 'Ingrese número de placa',
        companionsOptional: 'Acompañantes (Opcional)',
        numberOfGuests: 'Número de invitados',
        documentPhoto: 'Foto de Documento/Identidad',
        takePhoto: 'Tomar Foto',
        removePhoto: 'Eliminar Foto',
        parkingAllocation: 'Asignación de Parqueo (Espacios del Residente)',
        noSpacesAvailable: 'No hay espacios disponibles para este residente.',
        none: 'Ninguno',
        checkInVisitor: 'Registrar Visitante',
        visitorNameIdRequired: 'Nombre y ID del visitante son requeridos',
        checkInToastSuccess: 'Visitante registrado exitosamente',
        checkInFailed: 'Error al registrar visitante',
        loadResidentsFailed: 'Error al cargar residentes',
        searchResidentPlaceholder: 'Buscar por nombre o unidad...',
        noResidentsFound: 'No se encontraron residentes coincidiendo con "{query}"',

        // Report
        reportIncident: 'Reportar Incidente',
        unauthorizedEntry: 'Entrada No Autorizada',
        suspiciousActivity: 'Actividad Sospechosa',
        emergency: 'Emergencia',
        incidentTypeOther: 'Otro',
        sectionIncidentType: 'Tipo de Incidente',
        sectionDescription: 'Descripción',
        describeIncidentPlaceholder: 'Describa el incidente en detalle...',
        submitReport: 'Enviar Reporte',
        submitting: 'Enviando...',
        reportSubmitted: 'Reporte Enviado',
        reportLogged: 'El reporte de incidente ha sido registrado',
        selectTypeDescriptionError: 'Por favor seleccione tipo de incidente y provea descripción',
        submitReportFailed: 'Error al enviar reporte. Por favor intente de nuevo.',

        // Emergency
        emergencyConfirmTitle: 'Confirmar Emergencia',
        emergencyConfirmMessage: '¿Está seguro que desea activar una alerta de {type}? Esto notificará a todas las unidades cercanas.',
        triggerAlert: 'ACTIVAR ALERTA',
        alertActive: 'Alerta de {type} activa',
        alertFailed: 'Error al enviar alerta: {msg}',
        emergencyPolice: 'Seguridad/Policía',
        emergencyMedical: 'Emergencia Médica',
        emergencyFire: 'Fuego/Peligro',
        emergencyBackup: 'Solicitar Refuerzos',
        emergencyCenter: 'Centro de Emergencia',
        panic: 'PÁNICO',
        holdSilentAlert: 'Mantenga por 2 segundos para alerta silenciosa',
        generalPanic: 'Pánico General',

        // Profile
        mediaPermissionRequired: 'Se requiere permiso para acceder a la galería',
        notificationsEnabled: 'Notificaciones habilitadas',
        notificationsDisabled: 'Notificaciones deshabilitadas',
        updatePreferencesFailed: 'Error al actualizar preferencias',
        profileImageUpdated: 'Imagen de perfil actualizada',
        updateProfileImageFailed: 'Error al actualizar imagen de perfil',
        endShiftTitle: 'Terminar Turno',

        // Parking
        parkingStatusTitle: 'Estado de Parqueo',
        parkingAvailable: 'Disponibles',
        parkingOccupied: 'Ocupados',
        spacesDirectory: 'Directorio de Espacios',
        noParkingSpaces: 'No hay espacios configurados',
        statusAvailable: 'DISPONIBLE',
        statusOccupied: 'OCUPADO',

        // Verify Plate
        verifyPlateTitle: 'Verificar Placa',
        enterPlateError: 'Por favor ingrese una placa',
        verifyPlateFailed: 'Error al verificar placa',
        plateNumberLabel: 'Número de Placa',
        enterPlatePlaceholder: 'INGRESE PLACA',
        authorized: 'AUTORIZADO',
        notFound: 'NO ENCONTRADO',
        visitorLabel: 'Visitante:',
        idLabel: 'ID:',
        hostLabel: 'Anfitrión:',
        statusLabel: 'Estado:',
        unknown: 'Desconocido',
        noActiveVisits: 'No hay visitas activas con esta placa',
        statusCheckedIn: 'INGRESADO',

        // Checkout
        checkout: 'Salida',
        activeVisitorsCount: '{count} visitantes activos',
        loading: 'Cargando...',
        confirmCheckout: 'Confirmar Salida',
        confirmCheckoutMessage: '¿Registrar salida de {name}?',
        visitorCheckedOut: 'Visitante registrado salida',
        checkoutFailed: 'Error al registrar salida',
        noVehicle: 'Sin vehículo',
        enteredAt: 'Entró {time}',
        noActiveVisitors: 'No hay visitantes activos',
        allCheckedOut: 'Todos los visitantes han salido',

        // Expected
        expectedToday: 'Esperados Hoy',
        expectedVisitorsCount: '{count} visitantes esperados',
        statusPending: 'PENDIENTE',
        noVisitorsExpected: 'No Hay Visitantes Esperados',
        noVisitorsScheduled: 'No hay visitantes programados para hoy',

        // Activity Log
        activityLog: 'Registro de Actividad',
        totalEntries: '{count} entradas totales',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        na: 'N/A',
        statusCheckedOut: 'SALIDA',
        noActivityFound: 'No se encontró actividad',
        adjustFilters: 'Intente ajustar sus filtros',

        // Login
        securityAccess: 'Acceso de Seguridad',
        signInSubtitle: 'Inicie sesión para comenzar su turno',
        password: 'Contraseña',
        enterEmail: 'Ingrese su correo',
        enterPassword: 'Ingrese su contraseña',
        signIn: 'Iniciar Sesión',
        loginError: 'Inicio de sesión fallido. Verifique credenciales.',
        welcomeBack: '¡Bienvenido de vuelta!',
        enterCredentials: 'Por favor ingrese correo y contraseña',

        // Comunes / Faltantes
        details: 'Detalles',
        manualEntryCode: 'CÓDIGO DE ENTRADA MANUAL',
        noVisitorsFound: 'No se encontraron visitantes',
        vehiclePlate: 'Placa del Vehículo',
        companions: 'Acompañantes',
        welcome: 'Bienvenido',
        resident: 'Residente',
        visitDetails: 'Detalles de la Visita',
        success: 'EXITOSO',
        pending: 'PENDIENTE',
        unknownStatus: 'DESCONOCIDO',
        noImageAvailable: 'No hay imagen disponible',
        assignedParkingSpace: 'ESPACIO DE PARQUEO ASIGNADO',
        parkingGuide: 'Guíe al invitado a este lugar',
        authorizedByHost: 'AUTORIZADO POR (ANFITRIÓN)',
        created: 'Creado',
        entry: 'Entrada',
    }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('cosevi_app_lang');
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
                setLanguageState(savedLanguage as Language);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        } finally {
            setIsInitialized(true);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem('cosevi_app_lang', lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    if (!isInitialized) return null;

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}
