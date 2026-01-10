import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
// [!code ++] CAMBIO: Importación nombrada (con llaves) para corregir el error de sintaxis
import { useAuthStatusAndRole } from '../../hooks/useAuthStatusAndRole';

const Leaderboard = () => {
    const params = useParams();
    const quinielaId = (params.quinielaId || params.id)?.trim(); 
    const navigate = useNavigate();
    
    // [!code ++] CAMBIO: Usamos las propiedades reales que devuelve el hook
    const { isAdmin, userData } = useAuthStatusAndRole();
    // Mapeamos userData a currentUser para mantener compatibilidad con el resto del código
    const currentUser = userData; 

    const [leaderboard, setLeaderboard] = useState([]);
    const [quinielaInfo, setQuinielaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchQuinielaInfo = async () => {
            if (!quinielaId) {
                setError("ID de quiniela no detectado.");
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'quinielas', quinielaId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setQuinielaInfo(docSnap.data());
                } else {
                    setError("La quiniela no existe o el ID es incorrecto.");
                }
            } catch (err) {
                console.error("Error info quiniela:", err);
                setError("Error cargando información.");
            }
        };
        fetchQuinielaInfo();
    }, [quinielaId]);

    useEffect(() => {
        let unsubscribe = null;

        const setupListener = async () => {
            if (!quinielaId) return;

            if (unsubscribe) {
                unsubscribe();
            }

            const entriesRef = collection(db, 'userEntries');
            const q = query(
                entriesRef,
                where('quinielaId', '==', quinielaId),
                orderBy('puntos', 'desc')
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const rawData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                let currentRank = 1;
                const processedData = rawData.map((entry, index) => {
                    if (index > 0) {
                        const prevEntry = rawData[index - 1];
                        if (entry.puntos < prevEntry.puntos) {
                            currentRank = index + 1;
                        }
                    }
                    return { ...entry, rank: currentRank };
                });

                setLeaderboard(processedData);
                setLoading(false);
            }, (err) => {
                console.error("Error Leaderboard:", err);
                setError("Error al conectar con la base de datos.");
                setLoading(false);
            });
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [quinielaId]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <i className="fas fa-medal text-yellow-400 text-2xl drop-shadow-sm filter"></i>;
        if (rank === 2) return <i className="fas fa-medal text-gray-400 text-2xl drop-shadow-sm filter"></i>;
        if (rank === 3) return <i className="fas fa-medal text-amber-700 text-2xl drop-shadow-sm filter"></i>;
        return <span className="font-bold text-gray-500 text-lg">#{rank}</span>;
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 shadow-sm">
                    <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
                    <h3 className="font-bold text-lg">Ocurrió un problema</h3>
                    <p className="text-sm opacity-80 mb-4">{error}</p>
                    <button onClick={() => navigate(-1)} className="text-sm font-bold underline hover:text-red-800">
                        Regresar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="text-center md:text-left w-full">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-2 text-sm font-bold mx-auto md:mx-0 transition-colors">
                        <i className="fas fa-arrow-left"></i> Volver
                    </button>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Posiciones</h2>
                        {!loading && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    {quinielaInfo && <p className="text-emerald-600 font-bold tracking-wide text-sm mt-1">{quinielaInfo.metadata?.title}</p>}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative min-h-[300px] flex flex-col">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                        <i className="fas fa-circle-notch fa-spin text-4xl text-emerald-500 mb-3"></i>
                        <p className="text-gray-400 font-medium animate-pulse">Sincronizando resultados...</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <i className="fas fa-users-slash text-4xl mb-4 opacity-30"></i>
                        <p>No hay participantes registrados aún.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-[10px] md:text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                        <th className="p-4 font-black text-center w-20">Lugar</th>
                                        <th className="p-4 font-black">Jugador</th>
                                        <th className="p-4 font-black text-center">Puntos</th>
                                        <th className="p-4 font-black text-center hidden sm:table-cell">Pago</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {currentItems.map((entry) => {
                                        const isMe = entry.userId === currentUser?.uid;
                                        return (
                                            <tr key={entry.id} className={`border-b border-gray-50 last:border-0 transition-colors ${isMe ? 'bg-emerald-50/60' : 'hover:bg-gray-50'}`}>
                                                <td className="p-4 text-center">{getRankIcon(entry.rank)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ${isMe ? 'bg-emerald-500' : 'bg-gradient-to-br from-indigo-400 to-blue-500'}`}>
                                                            {entry.userName ? entry.userName.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`font-bold text-sm md:text-base leading-tight ${isMe ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                                {entry.userName} 
                                                                {isMe && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-800 uppercase tracking-wide">Tú</span>}
                                                            </span>
                                                            {isAdmin && (
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1 rounded border border-gray-200">
                                                                        ID: {entry.userId?.substring(0, 6)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className={`inline-flex items-center justify-center w-12 h-10 rounded-xl font-black text-lg shadow-sm ${isMe ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                                        {entry.puntos || 0}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center hidden sm:table-cell">
                                                    {entry.paymentStatus === 'paid' ? (
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100" title="Pago Verificado">
                                                            <i className="fas fa-check-circle"></i>
                                                            <span className="hidden md:inline">OK</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold border border-yellow-100" title="Pago Pendiente">
                                                            <i className="fas fa-clock"></i>
                                                            <span className="hidden md:inline">Pend</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs text-gray-500">Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, leaderboard.length)} de {leaderboard.length}</span>
                                <div className="flex gap-2">
                                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1 text-xs font-bold rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-100">
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <span className="text-xs font-bold px-2 py-1">{currentPage} / {totalPages}</span>
                                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 text-xs font-bold rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-100">
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;