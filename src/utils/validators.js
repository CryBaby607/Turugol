export const sanitizeInput = (input, maxLength = 200) => {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Eliminar caracteres peligrosos simples
        .slice(0, maxLength);
};

export const isValidPrediction = (selection) => {
    const VALID_PICKS = ['HOME', 'AWAY', 'DRAW'];
    return VALID_PICKS.includes(selection);
};

// [!code ++] NUEVAS FUNCIONES AGREGADAS PARA CORREGIR EL ERROR

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
    // Mínimo 6 caracteres (según tu lógica en Register.jsx)
    return password && password.length >= 6;
};

export const validatePhone = (phone) => {
    // Acepta solo números y debe tener 10 dígitos
    const re = /^\d{10}$/;
    return re.test(String(phone));
};

export const validateName = (name) => {
    // Verifica que no esté vacío y tenga al menos 2 caracteres
    return name && name.trim().length >= 2;
};