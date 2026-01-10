import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ParticipantsManager = () => {
    const { quinielaId } = useParams();
    
    const [entries, setEntries] = useState([]);
    const [quinielaInfo, setQuinielaInfo] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtenemos info de la quiniela
                const qDoc = await getDoc(doc(db, 'quinielas', quinielaId));
                let baseFee = 0;
                if (qDoc.exists()) {
                    const data = qDoc.data();
                    setQuinielaInfo(data);
                    baseFee = data.metadata?.entryFee || 0;
                }

                const q = query(
                    collection(db, 'userEntries'), 
                    where('quinielaId', '==', quinielaId)
                );
                const snapshot = await getDocs(q);
                
                const entriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    displayCost: doc.data().totalCost || baseFee
                }));
                
                // Ordenar: Pendientes primero, luego por fecha
                setEntries(entriesData.sort((a, b) => {
                    if (a.paymentStatus === b.paymentStatus) {
                        return b.createdAt?.seconds - a.createdAt?.seconds;
                    }
                    return a.paymentStatus === 'paid' ? 1 : -1;
                }));
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error al cargar participantes");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quinielaId]);

    const togglePaymentStatus = async (entry) => {
        // [!code ++] VALIDACIÓN: Si ya está pagado, no permitir cambios
        if (entry.paymentStatus === 'paid') {
            return; 
        }

        // Como solo permitimos de pendiente a pagado, el nuevo estado siempre será 'paid'
        const newStatus = 'paid'; 
        
        // Confirmación al marcar como pagado
        const result = await Swal.fire({
            title: '¿Confirmar Pago?',
            html: `
                <p>Vas a registrar el pago de <b>$${entry.displayCost}</b></p>
                <p class="text-sm text-gray-500 mt-2">Usuario: ${entry.userName || 'Desconocido'}</p>
                <p class="text-sm text-gray-500">Tel: ${entry.phoneNumber || 'Sin número'}</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar pago',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setProcessingId(entry.id);
        try {
            await updateDoc(doc(db, 'userEntries', entry.id), {
                paymentStatus: newStatus,
                paymentUpdatedAt: new Date()
            });

            setEntries(prev => prev.map(e => 
                e.id === entry.id ? { ...e, paymentStatus: newStatus } : e
            ));
            
            toast.success("Pago registrado correctamente");

        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar estado");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        const result = await Swal.fire({
            title: '¿Eliminar participación?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'userEntries', entryId));
                setEntries(prev => prev.filter(e => e.id !== entryId));
                toast.success('Participación eliminada');
            } catch (error) {
                toast.error('Error al eliminar');
            }
        }
    };

    // Filtros y Paginación
    const filteredEntries = entries.filter(entry => 
        entry.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando participantes...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <Link to={`/dashboard/admin/quinielas/${quinielaId}`} className="text-gray-500 hover:text-gray-700 text-sm mb-1 inline-flex items-center">
                        <i className="fas fa-arrow-left mr-2"></i> Volver al Detalle
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">Participantes</h2>
                    <p className="text-sm text-gray-500">{quinielaInfo?.metadata?.title || 'Quiniela'}</p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text" 
                        placeholder="Buscar usuario..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
                                <th className="p-4 font-semibold">Ref (UID)</th>
                                <th className="p-4 font-semibold">Usuario</th>
                                <th className="p-4 font-semibold">Teléfono</th>
                                <th className="p-4 font-semibold hidden md:table-cell">Registro</th>
                                <th className="p-4 font-semibold text-center">Monto</th>
                                <th className="p-4 font-semibold text-center">Estado Pago</th>
                                <th className="p-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {currentItems.length > 0 ? (
                                currentItems.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {entry.userId ? entry.userId.substring(0, 6) : entry.id.substring(0, 6)}
                                            </span>
                                        </td>
                                        
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{entry.userName || 'Anónimo'}</div>
                                            <div className="text-xs text-gray-400">{entry.email}</div>
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {entry.phoneNumber ? (
                                                <span className="flex items-center gap-2">
                                                    <i className="fas fa-phone-alt text-xs text-gray-400"></i>
                                                    {entry.phoneNumber}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Sin número</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-gray-500 hidden md:table-cell text-xs">
                                            {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : '-'}
                                            <br/>
                                            <span className="text-[10px] text-gray-400">
                                                {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                                            </span>
                                        </td>
                                        
                                        <td className="p-4 text-center font-mono font-bold text-gray-700">
                                            ${entry.displayCost}
                                        </td>

                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => togglePaymentStatus(entry)}
                                                // [!code ++] Deshabilitar si está procesando O si ya está pagado
                                                disabled={processingId === entry.id || entry.paymentStatus === 'paid'}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                                    entry.paymentStatus === 'paid'
                                                    ? 'bg-green-50 text-green-600 border-green-200 cursor-default opacity-100' // Estilo fijo si pagado
                                                    : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 cursor-pointer'
                                                } ${processingId === entry.id ? 'opacity-50' : ''}`}
                                            >
                                                {processingId === entry.id ? (
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                ) : entry.paymentStatus === 'paid' ? (
                                                    <span><i className="fas fa-check mr-1"></i> PAGADO</span>
                                                ) : (
                                                    <span><i className="fas fa-clock mr-1"></i> PENDIENTE</span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleDeleteEntry(entry.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                                title="Eliminar Participación"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">
                                        No se encontraron participantes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <div className="flex gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs font-bold rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-100"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                                        currentPage === i + 1 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'bg-white border text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs font-bold rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-100"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantsManager;