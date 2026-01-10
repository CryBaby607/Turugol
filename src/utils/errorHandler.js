import { toast } from 'sonner';

/**
 * Diccionario de errores comunes de Firebase/App
 */
const ERROR_MESSAGES = {
    'permission-denied': 'No tienes permisos para realizar esta acción.',
    'unavailable': 'Servicio temporalmente no disponible. Revisa tu conexión.',
    'auth/user-not-found': 'No se encontró cuenta con este correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'storage/unknown': 'Ocurrió un error al subir el archivo.',
    'deadline-exceeded': 'La solicitud tardó demasiado. Intenta de nuevo.'
};

/**
 * Manejador centralizado de errores.
 * @param {Error|string} error - El objeto de error original.
 * @param {string} [customMessage] - (Opcional) Mensaje contexto para el usuario.
 */
export const handleError = (error, customMessage = null) => {
    // 1. Log para el desarrollador (siempre visible en consola)
    console.error("❌ [System Error]:", error);

    // 2. Determinar el mensaje para el usuario
    let userMessage = customMessage || 'Ocurrió un error inesperado.';

    // Si es un error de Firebase conocido, usamos su traducción
    if (error?.code && ERROR_MESSAGES[error.code]) {
        userMessage = ERROR_MESSAGES[error.code];
    } 
    // Si no hay mensaje custom y el error tiene mensaje legible (cuidado con esto en prod)
    else if (!customMessage && error?.message) {
        // Opcional: Solo mostrar mensaje técnico en desarrollo
        // userMessage = error.message; 
    }

    // 3. Mostrar Toast UI
    toast.error(userMessage);

    // 4. (Futuro) Aquí podrías agregar:
    // logToSentry(error);
    // logToAnalytics(error);
};