import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ManageQuinielas = () => {
    const [quinielas, setQuinielas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [filter, setFilter] = useState('active');

    useEffect(() => {
        fetchQuinielas();
    }, []);

    const fetchQuinielaData = async () => {
        const q = query(collection(db, "quinielas"), orderBy("metadata.createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchQuinielas = async () => {
        setLoading(true);
        try {
            const data = await fetchQuinielaData();
            setQuinielas(data);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar quinielas");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "quinielas", id));
                setQuinielas(prev => prev.filter(q => q.id !== id));
                toast.success('Quiniela eliminada.');
            } catch (error) {
                toast.error('Error al eliminar.');
            }
        }
    };

    const now = new Date();
    const filteredQuinielas = quinielas.filter(q => {
        const deadline = q.metadata.deadline?.toDate ? q.metadata.deadline.toDate() : new Date();
        return filter === 'active' ? deadline > now : deadline <= now;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQuinielas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQuinielas.length / itemsPerPage);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Administrar Quinielas</h1>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button onClick={() => { setFilter('active'); setCurrentPage(1); }} className={`pb-2 px-4 font-medium transition-colors ${filter === 'active' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    En Juego
                </button>
                <button onClick={() => { setFilter('history'); setCurrentPage(1); }} className={`pb-2 px-4 font-medium transition-colors ${filter === 'history' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Historial
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Cargando...</div>
            ) : filteredQuinielas.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No hay quinielas en esta sección.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {currentItems.map((quiniela) => (
                            <div key={quiniela.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                            {quiniela.metadata.type || 'Standard'}
                                        </span>
                                        <div className="flex gap-1">
                                            <Link to={`/dashboard/admin/quinielas/${quiniela.id}`} className="text-gray-400 hover:text-blue-600 p-1"><i className="fas fa-eye"></i></Link>
                                            <button onClick={() => handleDelete(quiniela.id)} className="text-gray-400 hover:text-red-600 p-1"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{quiniela.metadata.title}</h3>
                                    
                                    <p className="text-sm text-gray-500 mb-4">
                                        Cierre: {quiniela.metadata.deadline?.toDate ? quiniela.metadata.deadline.toDate().toLocaleDateString() : 'N/A'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-users text-gray-400"></i>
                                            <span>Participantes</span>
                                        </div>
                                        <span className="font-bold">0</span> 
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400">ID: {quiniela.id.substring(0,6)}...</span>
                                    <Link to={`/dashboard/admin/quinielas/${quiniela.id}`} className="text-sm font-bold text-emerald-600 hover:underline">Gestionar &rarr;</Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
                            <span className="px-3 py-1">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageQuinielas;