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