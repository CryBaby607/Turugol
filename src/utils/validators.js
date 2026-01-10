export const sanitizeInput = (input, maxLength = 200) => {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '')
        .slice(0, maxLength);
};

export const isValidPrediction = (selection) => {
    const VALID_PICKS = ['HOME', 'AWAY', 'DRAW'];
    return VALID_PICKS.includes(selection);
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
    return password && password.length >= 6;
};

export const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(String(phone));
};

export const validateName = (name) => {
    return name && name.trim().length >= 2;
};