import React from 'react';

const QuinielaConfig = ({ title, deadline, description, maxFixtures, cost, handleInputChange, MAX_DESCRIPTION_CHARS }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Configuración del Evento
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">
                        Nombre de la Quiniela
                    </label>
                    <input 
                        type="text" 
                        name="title"
                        value={title}
                        onChange={handleInputChange}
                        placeholder="Ej: Gran Quiniela Jornada 10" 
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">
                            Cierre de Pronósticos
                        </label>
                        <input 
                            type="datetime-local" 
                            name="deadline"
                            value={deadline}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                    
                    {/* NUEVO CAMPO: Costo de Entrada */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">
                            Costo de Entrada (MXN)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                            <input 
                                type="number" 
                                name="cost"
                                value={cost}
                                onChange={handleInputChange}
                                placeholder="100"
                                min="0"
                                className="w-full pl-8 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">
                            Máximo de Partidos
                        </label>
                        <input 
                            type="number" 
                            name="maxFixtures"
                            value={maxFixtures}
                            onChange={handleInputChange}
                            min="1"
                            max="20"
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">
                        Descripción / Reglas
                    </label>
                    <textarea 
                        name="description"
                        value={description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Instrucciones para los participantes..."
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                    ></textarea>
                    <div className="text-right text-xs text-gray-400 mt-1">
                        {description.length}/{MAX_DESCRIPTION_CHARS}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuinielaConfig;