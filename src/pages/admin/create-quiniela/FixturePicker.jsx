import React from 'react';

const FixturePicker = ({ 
    isLoading, 
    filteredFixtures, 
    selectedFixtures, 
    toggleFixtureSelection, 
    
    // Props nuevos Multi-Liga
    activeLeagueId,
    selectedLeaguesIds,
    allLeaguesData,
    handleActiveLeagueChange,

    selectedRound, 
    handleRoundChange, 
    isLoadingRounds, 
    availableRounds, 
    searchTerm, 
    setSearchTerm 
}) => {

    return (
        <div className="bg-white flex flex-col h-full">
            {/* 1. HEADER: Selector de Ligas Activas */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ligas Seleccionadas:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedLeaguesIds.map(id => {
                        const leagueInfo = allLeaguesData.find(l => l.id === id);
                        const isActive = activeLeagueId === id;
                        
                        return (
                            <button
                                key={id}
                                onClick={() => handleActiveLeagueChange(id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all ${
                                    isActive 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                {leagueInfo?.logo && <img src={leagueInfo.logo} className="w-4 h-4 object-contain bg-white rounded-full" alt="" />}
                                {leagueInfo?.name || 'Liga'}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. CONTROLES: Buscador y Jornadas */}
            <div className="p-6 pb-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center shrink-0">
                        Partidos Disponibles
                        <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                            {filteredFixtures.length}
                        </span>
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input 
                                type="text" 
                                placeholder="Buscar equipo..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <select 
                            value={selectedRound} 
                            onChange={handleRoundChange}
                            disabled={isLoadingRounds}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white max-w-[200px]"
                        >
                            {isLoadingRounds ? (
                                <option>Cargando...</option>
                            ) : availableRounds && availableRounds.length > 0 ? (
                                availableRounds.map(round => (
                                    <option key={round} value={round}>
                                        {round.replace('Regular Season - ', 'Jornada ')}
                                    </option>
                                ))
                            ) : (
                                <option value="">Sin jornadas</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. GRID DE PARTIDOS */}
            <div className="flex-1 p-6 pt-2 overflow-y-auto min-h-[400px]">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <i className="fas fa-circle-notch fa-spin text-3xl mb-3 text-blue-500"></i>
                        <p>Cargando partidos...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFixtures.map(item => {
                            // Check global: ¿Este partido ya está en mi carrito?
                            const isSelected = selectedFixtures.some(f => f.fixture.id === item.fixture.id);

                            const matchDate = new Date(item.fixture.date);
                            const dateString = matchDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
                            const timeString = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div 
                                    key={item.fixture.id} 
                                    onClick={() => toggleFixtureSelection(item)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group relative ${
                                        isSelected 
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                            : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col items-center flex-1 text-center">
                                            <img src={item.teams.home.logo} alt="" className="h-10 w-10 object-contain mb-2" />
                                            <span className="text-[10px] font-bold text-gray-700 uppercase leading-tight">{item.teams.home.name}</span>
                                        </div>

                                        <div className="flex flex-col items-center shrink-0 min-w-[85px]">
                                            <span className="text-[10px] font-black text-gray-400 mb-1">{dateString}</span>
                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">{timeString}</span>
                                        </div>

                                        <div className="flex flex-col items-center flex-1 text-center">
                                            <img src={item.teams.away.logo} alt="" className="h-10 w-10 object-contain mb-2" />
                                            <span className="text-[10px] font-bold text-gray-700 uppercase leading-tight">{item.teams.away.name}</span>
                                        </div>
                                    </div>
                                    {isSelected && <div className="absolute top-2 right-2 text-emerald-500"><i className="fas fa-check-circle"></i></div>}
                                </div>
                            );
                        })}
                        
                        {!isLoading && filteredFixtures.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                <p className="text-gray-400 font-medium">No se encontraron partidos en esta búsqueda.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. FOOTER: Resumen del Carrito */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center text-sm">
                <span>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Partidos seleccionados totales: <strong>{selectedFixtures.length}</strong>
                </span>
                <span className="text-gray-400 text-xs">
                    (De {selectedLeaguesIds.length} ligas diferentes)
                </span>
            </div>
        </div>
    );
};

export default FixturePicker;