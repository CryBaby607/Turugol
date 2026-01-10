export const parseFirebaseDate = (timestamp) => {
    if (!timestamp) return null;

    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    if (timestamp instanceof Date) {
        return timestamp;
    }

    return new Date(timestamp);
};

export const isExpired = (deadline) => {
    const date = parseFirebaseDate(deadline);
    if (!date) return false; 
    return new Date() > date;
};

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

export const getCurrentFootballSeason = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    if (month < 6) { 
        return year - 1;
    }
    
    return year;
};