import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import PaymentBanner from '../admin/quinielas/PaymentBanner';

const UserHistory = () => {
    const navigate = useNavigate();
    const [participaciones, setParticipaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; 

    const [selectedParticipation, setSelectedParticipation] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null); 
    const [selectedQuinielaDetails, setSelectedQuinielaDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchHistory(user);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchHistory = async (user) => {
        try {
            const q = query(
                collection(db, 'userEntries'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setParticipaciones(data);
        } catch (error) {
            console.error(error);
            if (error.code === 'failed-precondition') {
                try {
                    const qFallback = query(
                        collection(db, 'userEntries'), 
                        where('userId', '==', user.uid),
                        limit(50)
                    );
                    const snapFallback = await getDocs(qFallback);
                    const dataFallback = snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    dataFallback.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                    setParticipaciones(dataFallback);
                } catch (e) { console.error(e); }
            }
        } finally {
            setLoading(false);
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentParticipaciones = participaciones.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(participaciones.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleViewDetails = async (participation) => {
        setSelectedParticipation(participation);
        setLoadingDetails(true);
        setSelectedQuinielaDetails(null);

        try {
            const quinielaRef = doc(db, 'quinielas', participation.quinielaId);
            const quinielaSnap = await getDoc(quinielaRef);
            
            if (quinielaSnap.exists()) {
                setSelectedQuinielaDetails(quinielaSnap.data());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewPayment = (e, participation) => {
        e.stopPropagation();
        setSelectedPayment(participation);
    };

    const closeDetails = () => {
        setSelectedParticipation(null);
        setSelectedQuinielaDetails(null);
    };

    const closePayment = () => {
        setSelectedPayment(null);
    };

    const translatePick = (pick) => {
        if (!pick) return '-';
        const picks = Array.isArray(pick) ? pick : [pick];
        const dictionary = { 'HOME': 'Local', 'AWAY': 'Visita', 'DRAW': 'Empate' };
        return picks.map(p => dictionary[p] || p).join(' / ');
    };

    const getResultColor = (userPick, officialOutcome) => {
        if (!officialOutcome) return 'bg-gray-100 text-gray-500 border-gray-200';
        const isHit = Array.isArray(userPick)
            ? userPick.includes(officialOutcome)
            : userPick === officialOutcome;
        return isHit
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-red-50 text-red-600 border-red-100 opacity-75';
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Mis Pronósticos</h2>
            <p className="text-gray-500 mb-8">Revisa tu desempeño en las jornadas pasadas.</p>

            {loading ? (
                <div className="p-12 text-center text-gray-400">Cargando historial...</div>
            ) : participaciones.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <i className="fas fa-ticket-alt text-4xl text-gray-200 mb-4"></i>
                    <p className="text-gray-500 font-medium">Aún no has participado en ninguna quiniela.</p>
                    <a
                        href="/dashboard/user/available-quinielas"
                        className="mt-4 inline-block text-blue-600 font-bold hover:underline"
                    >
                        Ir a jugar ahora
                    </a>
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        {currentParticipaciones.map((part) => (
                            <div
                                key={part.id}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                                        Q
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            part.status === 'finalized'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                            {part.status === 'finalized' ? 'FINALIZADA' : 'EN JUEGO'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            part.paymentStatus === 'paid'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>
                                            {part.paymentStatus === 'paid' ? 'PAGADO $$' : 'PAGO PENDIENTE'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">
                                    {part.quinielaName}
                                </h3>
                                
                                <p className="text-xs text-gray-400 mb-6">
                                    Enviado: {part.createdAt?.toDate ? part.createdAt.toDate().toLocaleDateString() : 'Fecha desconocida'}
                                </p>

                                <div className="flex justify-between items-end">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                                            Aciertos
                                        </p>
                                        <p className="text-2xl font-black text-gray-800">
                                            {part.puntos ?? '0'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {part.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={(e) => handleViewPayment(e, part)}
                                                className="px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-sm font-bold shadow-sm transition-colors"
                                                title="Información de Pago"
                                            >
                                                <i className="fas fa-wallet"></i>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleViewDetails(part)}
                                            className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-gray-200 hover:bg-black"
                                        >
                                            Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pb-8">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                    currentPage === 1 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <i className="fas fa-chevron-left"></i> Anterior
                            </button>
                            
                            <span className="text-sm font-medium text-gray-500">
                                Página <span className="text-gray-900 font-bold">{currentPage}</span> de <span className="text-gray-900 font-bold">{totalPages}</span>
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                    currentPage === totalPages 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Siguiente <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                     <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in duration-200">
                         <button
                            onClick={closePayment}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-20"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <div className="mt-2">
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">Realizar Pago</h3>
                            <p className="text-gray-500 text-sm mb-6">Sigue las instrucciones para validar tu quiniela: <span className="font-semibold text-gray-700">{selectedPayment.quinielaName}</span></p>
                            
                            <PaymentBanner
                                totalCost={selectedPayment.totalCost || 100}
                                hideButton={true}
                            />
                        </div>
                     </div>
                </div>
            )}

            {selectedParticipation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-4 md:p-8 shadow-2xl my-auto">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Detalle de Pronósticos</h3>
                                <p className="text-sm text-gray-500">
                                    {selectedParticipation.quinielaName}
                                </p>
                            </div>
                            <button
                                onClick={closeDetails}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="py-12 text-center text-gray-400">
                                <i className="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
                                <p>Cargando resultados...</p>
                            </div>
                        ) : !selectedQuinielaDetails ? (
                            <div className="py-10 text-center text-red-400">Error al cargar información.</div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                                    <div className="col-span-5">Partido</div>
                                    <div className="col-span-3 text-center">Tu Pick</div>
                                    <div className="col-span-3 text-center">Resultado</div>
                                    <div className="col-span-1 text-center">Pts</div>
                                </div>

                                <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {selectedQuinielaDetails.fixtures.map((fixture) => {
                                        const userPick = selectedParticipation.predictions[fixture.id];
                                        const officialOutcome = fixture.outcome;
                                        const statusClass = getResultColor(userPick, officialOutcome);
                                        
                                        const isHit = Array.isArray(userPick)
                                            ? userPick.includes(officialOutcome)
                                            : userPick === officialOutcome;

                                        return (
                                            <div key={fixture.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border ${statusClass}`}>
                                                <div className="col-span-5 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <img src={fixture.homeLogo} className="w-4 h-4 object-contain" alt="" />
                                                        <span className={`text-xs font-bold truncate ${officialOutcome === 'HOME' ? 'text-gray-900' : 'text-gray-500'}`}>{fixture.homeTeam}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <img src={fixture.awayLogo} className="w-4 h-4 object-contain" alt="" />
                                                        <span className={`text-xs font-bold truncate ${officialOutcome === 'AWAY' ? 'text-gray-900' : 'text-gray-500'}`}>{fixture.awayTeam}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-3 flex flex-col items-center justify-center">
                                                    <span className="text-xs font-black uppercase text-gray-700 text-center">
                                                        {translatePick(userPick)}
                                                    </span>
                                                </div>
                                                <div className="col-span-3 flex flex-col items-center justify-center text-center">
                                                    {officialOutcome ? (
                                                        <>
                                                            <span className="text-xs font-bold text-gray-800">{translatePick(officialOutcome)}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono">({fixture.result?.home ?? '-'} - {fixture.result?.away ?? '-'})</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Pendiente</span>
                                                    )}
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center">
                                                    {officialOutcome ? (
                                                        isHit ? (
                                                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm"><i className="fas fa-check text-xs"></i></div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center shadow-sm opacity-50"><i className="fas fa-times text-xs"></i></div>
                                                        )
                                                    ) : (
                                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={closeDetails}
                                className="px-6 py-2 md:py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserHistory;