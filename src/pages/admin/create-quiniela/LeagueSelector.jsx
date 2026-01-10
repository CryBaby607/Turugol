import React, { useState, useEffect } from 'react';
import { POPULAR_LEAGUES, ALL_LEAGUES } from '../../../constants/leagues';

const LeagueSelector = ({ selectedLeagues, updateData, onNext, onPrev }) => {
    const [displayedLeagues, setDisplayedLeagues] = useState(POPULAR_LEAGUES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedLeagues && selectedLeagues.length > 0) {
            const missingLeagues = selectedLeagues
                .map(id => ALL_LEAGUES.find(l => l.id === id))
                .filter(l => l && !displayedLeagues.find(dl => dl.id === l.id));
            
            if (missingLeagues.length > 0) {
                setDisplayedLeagues(prev => [...prev, ...missingLeagues]);
            }
        }
    }, [selectedLeagues]);

    const toggleLeague = (leagueId) => {
        const current = selectedLeagues || [];
        if (current.includes(leagueId)) {
            updateData({ leagues: current.filter(id => id !== leagueId) });
        } else {
            updateData({ leagues: [...current, leagueId] });
        }
    };

    const handleAddLeagueFromModal = (league) => {
        if (!displayedLeagues.find(l => l.id === league.id)) {
            setDisplayedLeagues([...displayedLeagues, league]);
        }
        toggleLeague(league.id);
        
        setIsModalOpen(false);
        setSearchTerm('');
    };

    const modalLeagues = ALL_LEAGUES.filter(l => 
        !displayedLeagues.some(dl => dl.id === l.id) &&
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 relative">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccionar Competiciones</h2>
            <p className="text-gray-500 mb-6 text-sm">Elige todas las ligas y copas que quieras incluir en tu quiniela.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {displayedLeagues.map((league) => {
                    const isSelected = selectedLeagues?.includes(league.id);
                    return (
                        <div 
                            key={league.id}
                            onClick={() => toggleLeague(league.id)}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative group ${
                                isSelected 
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                        >
                            <img src={league.logo} alt={league.name} className="w-12 h-12 object-contain" />
                            <div className="text-center">
                                <span className={`font-bold text-sm block ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
                                    {league.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase">{league.country}</span>
                            </div>
                            
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-emerald-500 animate-in zoom-in">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                            )}
                        </div>
                    );
                })}

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all gap-2 h-full min-h-[140px]"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <i className="fas fa-plus text-lg"></i>
                    </div>
                    <span className="font-bold text-sm">Agregar Competición</span>
                </button>
            </div>

            <div className="flex justify-between mt-8 border-t pt-6">
                <button onClick={onPrev} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                    Atrás
                </button>
                <button 
                    onClick={onNext}
                    disabled={!selectedLeagues || selectedLeagues.length === 0}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                >
                    Siguiente: Buscar Partidos
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Agregar Competición</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="p-4 border-b">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input 
                                    type="text" 
                                    placeholder="Buscar liga, copa o país..." 
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {modalLeagues.length > 0 ? (
                                <div className="space-y-1">
                                    {modalLeagues.map(league => (
                                        <button
                                            key={league.id}
                                            onClick={() => handleAddLeagueFromModal(league)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left border border-transparent hover:border-blue-100 group"
                                        >
                                            <img src={league.logo} alt="" className="w-8 h-8 object-contain bg-white rounded-full border border-gray-100 p-0.5" />
                                            <div className="flex-1">
                                                <span className="block font-bold text-gray-700 group-hover:text-blue-700">{league.name}</span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    {league.country} 
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    {league.type === 'Cup' ? 'Copa' : 'Liga'}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <i className="fas fa-plus"></i>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="fas fa-search mb-3 text-3xl opacity-20"></i>
                                    <p className="text-sm font-medium">No se encontraron resultados.</p>
                                    {searchTerm === '' && <p className="text-xs mt-1">Escribe para buscar más ligas.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeagueSelector;