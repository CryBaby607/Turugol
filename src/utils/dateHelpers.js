/**
 * Convierte cualquier formato de fecha (Firestore Timestamp, string, Date) 
 * a un objeto Date nativo de JS válido.
 */
export const parseFirebaseDate = (timestamp) => {
    if (!timestamp) return null;

    // Caso 1: Es un Timestamp de Firestore (tiene método toDate)
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // Caso 2: Ya es un objeto Date
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // Caso 3: Es un string (ISO) o número (ms)
    return new Date(timestamp);
};

/**
 * Verifica si una fecha límite ya pasó.
 * Retorna true si ha expirado, false si sigue vigente.
 */
export const isExpired = (deadline) => {
    const date = parseFirebaseDate(deadline);
    if (!date) return false; // Si no hay fecha límite, asumimos que no expira (o ajusta según tu regla)
    return new Date() > date;
};

/**
 * Formatea una fecha para mostrar al usuario (Ej: "lunes, 15 de enero, 14:00")
 */
export const formatDisplayDate = (timestamp) => {
    const date = parseFirebaseDate(timestamp);
    if (!date) return '';
    
    return new Intl.DateTimeFormat('es-MX', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
    }).format(date);
};

/**
 * Calcula tiempo restante simple
 */
export const getTimeRemaining = (timestamp) => {
    const date = parseFirebaseDate(timestamp);
    if (!date) return '';
    
    const total = date - new Date();
    const hours = Math.floor((total / (1000 * 60 * 60)));
    const days = Math.floor(hours / 24);
    
    if (total <= 0) return "Cerrado";
    if (days > 0) return `${days} días restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return "¡Cierra pronto!";
};