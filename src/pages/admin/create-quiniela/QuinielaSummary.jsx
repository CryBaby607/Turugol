import React from 'react';

const QuinielaSummary = ({ data, onSubmit, onPrev, loading }) => {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Resumen de la Quiniela</h2>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Título</span>
                        <span className="font-bold text-gray-800 text-lg">{data.title}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Deadline (Inicio 1er juego)</span>
                        <span className="font-bold text-gray-800">
                            {data.deadline ? new Date(data.deadline).toLocaleString() : 'Automático'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Entrada</span>
                        <span className="font-bold text-emerald-600">${data.entryFee}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Partidos Seleccionados ({data.fixtures.length}):</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {data.fixtures.map((f, idx) => (
                            <li key={idx} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center shadow-sm">
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-gray-700">{f.teams.home.name} vs {f.teams.away.name}</span>
                                    {f.leagueName && <span className="block text-[10px] text-gray-400">{f.leagueName}</span>}
                                </div>
                                <span className="text-xs text-gray-400 self-center whitespace-nowrap ml-2">
                                    {new Date(f.fixture.date).toLocaleDateString([], {day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex justify-between max-w-2xl mx-auto">
                <button 
                    onClick={onPrev} 
                    disabled={loading}
                    className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                    Atrás
                </button>
                <button 
                    onClick={onSubmit}
                    disabled={loading}
                    className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-70"
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                    Confirmar y Crear
                </button>
            </div>
        </div>
    );
};

export default QuinielaSummary;