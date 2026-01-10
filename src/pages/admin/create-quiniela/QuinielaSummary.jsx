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
                        <span className="block text-xs text-gray-500 uppercase font-bold">Deadline</span>
                        <span className="font-bold text-gray-800">
                            {data.deadline ? new Date(data.deadline).toLocaleString() : '-'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Entrada</span>
                        <span className="font-bold text-emerald-600">${data.entryFee}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 uppercase font-bold">Pozo Inicial</span>
                        <span className="font-bold text-emerald-600">${data.pot}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase">Partidos Seleccionados ({data.fixtures.length})</h3>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {data.fixtures.map((f, i) => (
                            <li key={i} className="text-sm bg-white p-2 rounded border border-gray-100 flex justify-between">
                                <span className="text-gray-600">{f.teams.home.name} vs {f.teams.away.name}</span>
                                <span className="text-xs text-gray-400 self-center">{new Date(f.fixture.date).toLocaleDateString()}</span>
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