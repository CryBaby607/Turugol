import React from 'react';

const POPULAR_LEAGUES = [
    { id: 39, name: "Premier League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, name: "La Liga", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 262, name: "Liga MX", country: "Mexico", logo: "https://media.api-sports.io/football/leagues/262.png" },
    { id: 135, name: "Serie A", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png" },
    { id: 2, name: "Champions League", country: "World", logo: "https://media.api-sports.io/football/leagues/2.png" }
];

const LeagueSelector = ({ selectedLeagues, updateData, onNext, onPrev }) => {
    
    const toggleLeague = (leagueId) => {
        const current = selectedLeagues || [];
        if (current.includes(leagueId)) {
            updateData({ leagues: current.filter(id => id !== leagueId) });
        } else {
            updateData({ leagues: [...current, leagueId] });
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccionar Competiciones</h2>
            <p className="text-gray-500 mb-6 text-sm">Elige las ligas de las cuales buscarás partidos.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {POPULAR_LEAGUES.map((league) => {
                    const isSelected = selectedLeagues?.includes(league.id);
                    return (
                        <div 
                            key={league.id}
                            onClick={() => toggleLeague(league.id)}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                                isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                        >
                            <img src={league.logo} alt={league.name} className="w-12 h-12 object-contain" />
                            <span className={`font-bold text-sm ${isSelected ? 'text-emerald-700' : 'text-gray-600'}`}>
                                {league.name}
                            </span>
                            {isSelected && <div className="absolute top-2 right-2 text-emerald-500"><i className="fas fa-check-circle"></i></div>}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={onPrev} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                    Atrás
                </button>
                <button 
                    onClick={onNext}
                    disabled={!selectedLeagues || selectedLeagues.length === 0}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente: Buscar Partidos
                </button>
            </div>
        </div>
    );
};

export default LeagueSelector;