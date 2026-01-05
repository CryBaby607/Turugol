import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const ParticipantsManager = () => {
    const { quinielaId } = useParams();
    
    const [entries, setEntries] = useState([]);
    const [quinielaTitle, setQuinielaTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Obtener título
                const qDoc = await getDoc(doc(db, 'quinielas', quinielaId));
                if (qDoc.exists()) setQuinielaTitle(qDoc.data().metadata.title);

                // 2. Obtener participantes
                const q = query(
                    collection(db, 'userEntries'), 
                    where('quinielaId', '==', quinielaId)
                );
                const snapshot = await getDocs(q);
                
                const entriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // 3. ORDENAMIENTO: Pendientes primero
                setEntries(entriesData.sort((a, b) => {
                    const isPaidA = a.paymentStatus === 'paid';
                    const isPaidB = b.paymentStatus === 'paid';
                    
                    // Prioridad 1: Estado de pago (Pendientes arriba)
                    if (isPaidA !== isPaidB) return isPaidA ? 1 : -1;
                    
                    // Prioridad 2: Fecha (Más recientes arriba)
                    const dateA = new Date(a.createdAt?.seconds * 1000 || 0);
                    const dateB = new Date(b.createdAt?.seconds * 1000 || 0);
                    return dateB - dateA;
                }));

            } catch (error) {
                console.error("Error al cargar participantes:", error);
            } finally {
                setLoading(false);
            }
        };

        if (quinielaId) fetchData();
    }, [quinielaId]);

    // Filtrado
    const filteredEntries = entries.filter(entry => {
        const name = (entry.displayName || entry.userName || '').toLowerCase();
        const email = (entry.email || '').toLowerCase();
        const uid = (entry.userId || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search) || uid.includes(search);
    });

    // Lógica de Paginación
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);

    // Cambiar página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Acción: Toggle Pago
    const togglePaymentStatus = async (entryId, currentStatus) => {
        setProcessingId(entryId);
        try {
            const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
            const entryRef = doc(db, 'userEntries', entryId);
            
            await updateDoc(entryRef, { 
                paymentStatus: newStatus,
                paymentUpdatedAt: new Date().toISOString()
            });

            setEntries(prev => {
                const updatedList = prev.map(entry => 
                    entry.id === entryId ? { ...entry, paymentStatus: newStatus } : entry
                );
                return updatedList.sort((a, b) => {
                    const isPaidA = a.paymentStatus === 'paid';
                    const isPaidB = b.paymentStatus === 'paid';
                    if (isPaidA !== isPaidB) return isPaidA ? 1 : -1;
                    return new Date(b.createdAt?.seconds * 1000 || 0) - new Date(a.createdAt?.seconds * 1000 || 0);
                });
            });

        } catch (error) {
            console.error("Error actualizando pago:", error);
            alert("No se pudo actualizar el estado de pago.");
        } finally {
            setProcessingId(null);
        }
    };

    // Acción: Eliminar (Solo si NO está pagado)
    const handleDeleteEntry = async (entryId, userName) => {
        if (!window.confirm(`⚠️ ¿Estás seguro de eliminar a ${userName}? \n\nEsta acción borrará su quiniela permanentemente y NO se puede deshacer.`)) return;

        setProcessingId(entryId);
        try {
            await deleteDoc(doc(db, 'userEntries', entryId));
            
            // Eliminar de la lista local
            setEntries(prev => prev.filter(e => e.id !== entryId));
            
            // Si la página actual queda vacía y no es la 1, retroceder
            if (currentItems.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }

        } catch (error) {
            console.error("Error eliminando:", error);
            alert("Error al eliminar.");
        } finally {
            setProcessingId(null);
        }
    };

    // Utilidades
    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';
    const getAvatarColor = (name) => {
        const colors = ['bg-red-100 text-red-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600'];
        let hash = 0;
        if (!name) return colors[0];
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    if (loading) return <div className="p-10 text-center text-gray-500 italic animate-pulse">Cargando participantes...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <Link to={`/dashboard/admin/quinielas/${quinielaId}`} className="text-gray-500 hover:text-gray-800 text-sm mb-1 inline-flex items-center transition-colors">
                        <i className="fas fa-arrow-left mr-2"></i> Volver al Detalle
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">Participantes</h2>
                    <p className="text-sm text-gray-500">Gestión de pagos para: <span className="font-semibold text-blue-600">{quinielaTitle}</span></p>
                </div>
                
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
                    <span className="text-gray-500 mr-2">Total Inscritos:</span>
                    <span className="font-bold text-gray-800 text-lg">{entries.length}</span>
                </div>
            </div>

            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, correo o referencia..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ref (UID 6)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Registro</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Puntos</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Estado Pago</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-400">
                                        <i className="fas fa-user-slash text-3xl mb-3 block opacity-30"></i>
                                        {searchTerm ? 'No se encontraron coincidencias.' : 'No hay usuarios inscritos aún.'}
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(entry => {
                                    const name = entry.displayName || entry.userName || 'Usuario';
                                    const email = entry.email || '-';
                                    const phone = entry.phone || entry.phoneNumber || 'N/A';
                                    const isPaid = entry.paymentStatus === 'paid';
                                    
                                    const date = entry.createdAt?.toDate 
                                        ? entry.createdAt.toDate().toLocaleString('es-MX', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                        }) 
                                        : '-';

                                    const shortUID = entry.userId ? entry.userId.substring(0, 6).toUpperCase() : 'N/A';

                                    return (
                                        <tr key={entry.id} className={`transition-colors ${isPaid ? 'bg-white hover:bg-gray-50' : 'bg-yellow-50/40 hover:bg-yellow-50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(name)}`}>
                                                        {getInitials(name)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-semibold text-gray-900">{name}</div>
                                                        <div className="text-xs text-gray-500">{email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold border border-gray-200 select-all">
                                                    {shortUID}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-gray-700">{entry.puntos || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button 
                                                    onClick={() => togglePaymentStatus(entry.id, entry.paymentStatus)}
                                                    disabled={processingId === entry.id}
                                                    className={`
                                                        relative inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95
                                                        ${isPaid 
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 animate-pulse'}
                                                        ${processingId === entry.id ? 'opacity-50 cursor-wait' : ''}
                                                    `}
                                                >
                                                    {processingId === entry.id ? (
                                                        <i className="fas fa-circle-notch fa-spin mr-2"></i>
                                                    ) : (
                                                        <i className={`fas ${isPaid ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                                                    )}
                                                    {isPaid ? 'PAGADO' : 'PENDIENTE'}
                                                </button>
                                            </td>
                                            
                                            {/* COLUMNA DE ACCIONES SEGURA */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {!isPaid && ( // <-- SOLO SE MUESTRA SI NO HA PAGADO
                                                    <button 
                                                        onClick={() => handleDeleteEntry(entry.id, name)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                        title="Eliminar participación (Solo si no ha pagado)"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- CONTROLES DE PAGINACIÓN --- */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredEntries.length)} de {filteredEntries.length}
                        </span>
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