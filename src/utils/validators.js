/**
 * Limpia una cadena de texto de caracteres peligrosos y limita su longitud.
 * @param {string} input - El texto a limpiar.
 * @param {number} maxLength - Longitud máxima permitida.
 * @returns {string} Texto sanitizado.
 */
export const sanitizeInput = (input, maxLength = 200) => {
    if (typeof input !== 'string') return '';
    
    return input
        // 1. Eliminar etiquetas HTML básicas (Prevención XSS simple)
        .replace(/[<>]/g, '')
        // 2. Limitar longitud
        .slice(0, maxLength);
        // Nota: No hacemos trim() aquí para permitir espacios mientras escribe,
        // pero sí deberíamos hacerlo al enviar (onSubmit).
};

/**
 * Valida que una selección de pronóstico sea legítima.
 * @param {string} selection - 'HOME', 'AWAY', 'DRAW'
 * @returns {boolean}
 */
export const isValidPrediction = (selection) => {
    const VALID_PICKS = ['HOME', 'AWAY', 'DRAW'];
    return VALID_PICKS.includes(selection);
};