import React, { useState, useEffect } from 'react';
import { quinielaService } from '../../services/quinielaService';
import { isExpired, formatDisplayDate } from '../../utils/dateHelpers'; // [!code ++]
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ManageQuinielas = () => {
    const navigate = useNavigate();
    const [quinielas, setQuinielas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Configuración de Paginación y Filtros
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [filter, setFilter] = useState('active');

    useEffect(() => {
        fetchQuinielas();
    }, []);

    const fetchQuinielas = async () => {
        setLoading(true);
        try {
            const data = await quinielaService.getAll();
            setQuinielas(data);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar quinielas");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); 
        
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto. Se eliminará la quiniela y todos sus datos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await quinielaService.delete(id);
                setQuinielas(prev => prev.filter(q => q.id !== id));
                toast.success('Quiniela eliminada.');
            } catch (error) {
                console.error(error);
                toast.error('Error al eliminar.');
            }
        }
    };

    // [!code success] Lógica de filtrado unificada con utils
    const filteredQuinielas = quinielas.filter(q => {
        const expired = isExpired(q.metadata.deadline);
        return filter === 'active' ? !expired : expired;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQuinielas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQuinielas.length / itemsPerPage);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Encabezado limpio sin botones */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Administrar Quinielas</h1>
            </div>

            {/* Pestañas de Filtro */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button onClick={() => { setFilter('active'); setCurrentPage(1); }} className={`pb-2 px-4 font-medium transition-colors ${filter === 'active' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    En Juego
                </button>
                <button onClick={() => { setFilter('history'); setCurrentPage(1); }} className={`pb-2 px-4 font-medium transition-colors ${filter === 'history' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Historial
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-400">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Cargando...
                </div>
            ) : filteredQuinielas.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-3"></i>
                    <p className="text-gray-500 font-medium">No hay quinielas en esta sección.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {currentItems.map((quiniela) => (
                            <div 
                                key={quiniela.id} 
                                onClick={() => navigate(`/dashboard/admin/quinielas/${quiniela.id}`)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group relative"
                            >
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${filter === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {filter === 'active' ? 'Activa' : 'Finalizada'}
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => handleDelete(quiniela.id, e)} 
                                            className="text-gray-300 hover:text-red-500 p-1 transition-colors z-10"
                                            title="Eliminar Quiniela"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        {quiniela.metadata.title}
                                    </h3>
                                    
                                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                        <i className="far fa-calendar-alt"></i>
                                        {formatDisplayDate(quiniela.metadata.deadline)}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg group-hover:bg-emerald-50/30 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-users text-gray-400"></i>
                                            <span>Participantes</span>
                                        </div>
                                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm">
                                            {quiniela.metadata.participantCount || 0}
                                        </span> 
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center group-hover:bg-gray-100 transition-colors">
                                    <span className="text-xs font-mono text-gray-400">ID: {quiniela.id.substring(0,6)}</span>
                                    <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Gestionar <i className="fas fa-chevron-right"></i>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pb-8">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página <span className="font-bold text-gray-900">{currentPage}</span> de {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageQuinielas;