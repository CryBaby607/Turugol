/**
 * Analiza las predicciones para contar dobles y triples.
 * @param {Object} predictions - Objeto con los picks del usuario { fixtureId: ['HOME', 'DRAW'] }
 * @returns {Object} { doubles, triples }
 */
const analyzePredictions = (predictions) => {
    let doubles = 0;
    let triples = 0;

    if (!predictions) return { doubles: 0, triples: 0 };

    Object.values(predictions).forEach(p => {
        if (Array.isArray(p)) {
            if (p.length === 2) doubles++;
            if (p.length === 3) triples++;
        }
    });

    return { doubles, triples };
};

/**
 * Calcula el costo total de la quiniela basado en las combinaciones.
 * @param {Object} predictions - Objeto de predicciones.
 * @param {number} basePrice - Precio base por quiniela sencilla.
 * @returns {Object} Estadísticas completas y costo.
 */
export const calculateQuinielaCost = (predictions, basePrice = 100) => {
    const { doubles, triples } = analyzePredictions(predictions);
    
    // Fórmula: 2^dobles * 3^triples
    const combinations = (2 ** doubles) * (3 ** triples);
    const totalCost = combinations * basePrice;

    return {
        doubles,
        triples,
        combinations,
        basePrice,
        totalCost
    };
};