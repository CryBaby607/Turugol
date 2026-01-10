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

export const calculateQuinielaCost = (predictions, basePrice = 100) => {
    const { doubles, triples } = analyzePredictions(predictions);
    
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