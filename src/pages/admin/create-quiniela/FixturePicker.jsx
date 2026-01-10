import React, { useState, useEffect } from 'react';
import { fetchFromApi } from '../../../services/footballApi'; 
import { toast } from 'sonner';

const FixturePicker = ({ selectedLeagues, selectedFixtures, updateData, onNext, onPrev }) => {
    const [loading, setLoading] = useState(false);
    const [availableFixtures, setAvailableFixtures] = useState([]);

    useEffect(() => {
        loadFixtures();
    }, [selectedLeagues]);

    const loadFixtures = async () => {
        setLoading(true);
        try {
            // NOTA: Asegúrate de tener una función que soporte múltiples ligas o iterar
            // Aquí un ejemplo simple iterando las ligas seleccionadas
            let allFixtures = [];
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const toDate = nextWeek.toISOString().split('T')[0];

            // Ejemplo de llamada real (ajusta según tu servicio):
            for (const leagueId of selectedLeagues) {
                 const data = await fetchFromApi('fixtures', `?league=${leagueId}&season=2024&from=${today}&to=${toDate}&timezone=America/Mexico_City`);
                 if (data.response) {
                     allFixtures = [...allFixtures, ...data.response];
                 }
            }
            
            setAvailableFixtures(allFixtures);
        } catch (error) {
            console.error("Error cargando partidos", error);
            toast.error("No se pudieron cargar los partidos de la API");
        } finally {
            setLoading(false);
        }
    };

    const toggleFixture = (fixture) => {
        const current = selectedFixtures || [];
        const exists = current.find(f => f.fixture.id === fixture.fixture.id);
        
        if (exists) {
            updateData({ fixtures: current.filter(f => f.fixture.id !== fixture.fixture.id) });
        } else {
            updateData({ fixtures: [...current, fixture] });
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Seleccionar Partidos</h2>
                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                    {selectedFixtures.length} seleccionados
                </span>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400">
                    <i className="fas fa-circle-notch fa-spin text-2xl"></i> Cargando partidos...
                </div>
            ) : availableFixtures.length === 0 ? (
                <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    No se encontraron partidos próximos en estas ligas.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {availableFixtures.map((match) => {
                        const isSelected = selectedFixtures.some(f => f.fixture.id === match.fixture.id);
                        return (
                            <div 
                                key={match.fixture.id}
                                onClick={() => toggleFixture(match)}
                                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                                    isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-100 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="text-right flex-1 font-semibold text-sm">{match.teams.home.name}</div>
                                    <div className="flex flex-col items-center px-2">
                                        <div className="flex gap-2">
                                            <img src={match.teams.home.logo} className="w-6 h-6 object-contain" alt="" />
                                            <span className="font-bold text-gray-400">VS</span>
                                            <img src={match.teams.away.logo} className="w-6 h-6 object-contain" alt="" />
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {new Date(match.fixture.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-left flex-1 font-semibold text-sm">{match.teams.away.name}</div>
                                </div>
                                <div className="ml-4">
                                    {isSelected ? (
                                        <i className="fas fa-check-circle text-emerald-500 text-xl"></i>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t">
                <button onClick={onPrev} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                    Atrás
                </button>
                <button 
                    onClick={onNext}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700"
                >
                    Siguiente: Resumen
                </button>
            </div>
        </div>
    );
};

export default FixturePicker;