import React from 'react';

const QuinielaConfig = ({ data, updateData, onNext }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Título de la Quiniela</label>
                    <input
                        type="text"
                        name="title"
                        value={data.title}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Ej: Quiniela Jornada 10"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Fecha y Hora Límite</label>
                    <input
                        type="datetime-local"
                        name="deadline"
                        value={data.deadline}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Costo de Entrada ($)</label>
                    <input
                        type="number"
                        name="entryFee"
                        value={data.entryFee}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Premio Acumulado Inicial ($)</label>
                    <input
                        type="number"
                        name="pot"
                        value={data.pot}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">Descripción (Opcional)</label>
                    <textarea
                        name="description"
                        value={data.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    ></textarea>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onNext}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                >
                    Siguiente: Seleccionar Ligas <i className="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    );
};

export default QuinielaConfig;