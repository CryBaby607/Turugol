// src/constants/leagues.js

// --- CONFIGURACIÓN Y DATOS DE LIGAS ---

// 1. Ligas Destacadas (Se muestran por defecto)
export const POPULAR_LEAGUES = [
    { id: 262, name: "Liga MX", type: "League", country: "Mexico", logo: "https://media.api-sports.io/football/leagues/262.png" },
    { id: 39, name: "Premier League", type: "League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, name: "La Liga", type: "League", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 2, name: "Champions League", type: "Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { id: 13, name: "Copa Libertadores", type: "Cup", country: "South America", logo: "https://media.api-sports.io/football/leagues/13.png" },
    { id: 61, name: "Ligue 1", type: "League", country: "France", logo: "https://media.api-sports.io/football/leagues/61.png" },
    { id: 135, name: "Serie A", type: "League", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png" }
];

// 2. Catálogo Completo (Para el buscador)
export const ALL_LEAGUES = [
    ...POPULAR_LEAGUES,
    // --- EUROPA ---
    { id: 78, name: "Bundesliga", type: "League", country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png" },
    { id: 88, name: "Eredivisie", type: "League", country: "Netherlands", logo: "https://media.api-sports.io/football/leagues/88.png" },
    { id: 94, name: "Primeira Liga", type: "League", country: "Portugal", logo: "https://media.api-sports.io/football/leagues/94.png" },
    { id: 3, name: "Europa League", type: "Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/3.png" },
    
    // --- AMÉRICA ---
    { id: 253, name: "MLS", type: "League", country: "USA", logo: "https://media.api-sports.io/football/leagues/253.png" },
    { id: 128, name: "Liga Profesional", type: "League", country: "Argentina", logo: "https://media.api-sports.io/football/leagues/128.png" },
    { id: 71, name: "Brasileirão A", type: "League", country: "Brazil", logo: "https://media.api-sports.io/football/leagues/71.png" },
    { id: 265, name: "Liga Expansión MX", type: "League", country: "Mexico", logo: "https://media.api-sports.io/football/leagues/265.png" },
    { id: 11, name: "Copa Sudamericana", type: "Cup", country: "South America", logo: "https://media.api-sports.io/football/leagues/11.png" },
    
    // --- SELECCIONES ---
    { id: 1, name: "World Cup", type: "Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/1.png" },
    { id: 9, name: "Copa América", type: "Cup", country: "South America", logo: "https://media.api-sports.io/football/leagues/9.png" },
    { id: 4, name: "Euro Championship", type: "Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/4.png" },
    { id: 268, name: "Eliminatorias CONMEBOL", type: "Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/268.png" }
];

// --- DICCIONARIOS Y UTILIDADES DE TRADUCCIÓN ---

export const commonTerms = {
    "Cup": "Copa",
    "League": "Liga",
    "Women": "Femenil",
    "Women's": "Femenil",
    "Division": "División",
    "Super": "Súper",
    "National": "Nacional",
    "Premier": "Premier",
    "Championship": "Campeonato",
    "Play-offs": "Eliminatorias",
    "Friendlies": "Amistosos",
    "Qualifying": "Clasificación",
    "U20": "Sub-20",
    "U23": "Sub-23",
    "U17": "Sub-17",
    "Apertura": "Apertura",
    "Clausura": "Clausura",
    "Youth": "Juvenil"
};

/**
 * Traduce el nombre de una liga usando el diccionario commonTerms.
 * Ejemplo: "Premier League" -> "Liga Premier" (según configuración) o se mantiene si no hay regla.
 */
export const translateLeagueName = (name) => {
    if (!name) return name;
    let translatedName = name;
    
    Object.entries(commonTerms).forEach(([eng, esp]) => {
        // Busca la palabra exacta en inglés
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translatedName = translatedName.replace(regex, esp);
    });
    
    return translatedName;
};

// Helper para obtener nombre por ID rápidamente
export const getLeagueName = (id) => {
    const league = ALL_LEAGUES.find(l => l.id === parseInt(id));
    return league ? league.name : 'Liga Desconocida';
};