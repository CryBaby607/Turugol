import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { quinielaService } from '../../services/quinielaService';
import { calculateQuinielaCost } from '../../services/pricingService';
import { isExpired } from '../../utils/dateHelpers';
import { handleError } from '../../utils/errorHandler';
import { toast } from 'sonner';
import PaymentBanner from '../admin/quinielas/PaymentBanner';
import FixtureList from './FixtureList';
import QuinielaSummary from './QuinielaSummary';

const PlayQuiniela = () => {
    const { quinielaId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(auth.currentUser);

    const [quiniela, setQuiniela] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [predictions, setPredictions] = useState({});
    const [alreadyPlayed, setAlreadyPlayed] = useState(false);
    const [showPaymentBanner, setShowPaymentBanner] = useState(false);
    const [expiredStatus, setExpiredStatus] = useState(false);

    const MAX_TRIPLES = 3;
    const MAX_DOUBLES = 4;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!quinielaId) return;
            try {
                const data = await quinielaService.getById(quinielaId);
                
                if (data) {
                    setQuiniela(data);
                    if (isExpired(data.metadata?.deadline)) {
                        setExpiredStatus(true);
                    }
                } else {
                    toast.error("Quiniela no encontrada");
                    navigate("/dashboard/user");
                    return;
                }
                
                if (user) {
                    const q = query(
                        collection(db, 'userEntries'),
                        where('userId', '==', user.uid),
                        where('quinielaId', '==', quinielaId)
                    );
                    const entrySnap = await getDocs(q);
                    if (!entrySnap.empty) setAlreadyPlayed(true);
                }
            } catch (error) { 
                handleError(error, "Error al cargar la quiniela");
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [quinielaId, user, navigate]);

    const handleSelect = (fixtureId, selection) => {
        if (alreadyPlayed || showPaymentBanner || expiredStatus) return;

        const currentPicks = predictions[fixtureId] || [];
        const newPicks = currentPicks.includes(selection)
            ? currentPicks.filter(item => item !== selection)
            : [...currentPicks, selection];

        const nextPredictions = { ...predictions, [fixtureId]: newPicks };
        const currentBasePrice = quiniela?.metadata?.cost !== undefined ? Number(quiniela.metadata.cost) : 100;
        
        const { doubles: nextDoubles, triples: nextTriples } = calculateQuinielaCost(nextPredictions, currentBasePrice);

        if (nextDoubles > MAX_DOUBLES) {
            toast.warning(`Límite de dobles excedido (Máx: ${MAX_DOUBLES})`);
            return;
        }

        if (nextTriples > MAX_TRIPLES) {
            toast.warning(`Límite de triples excedido (Máx: ${MAX_TRIPLES})`);
            return;
        }

        setPredictions(nextPredictions);
    };

    const stats = useMemo(() => {
        const currentBasePrice = quiniela?.metadata?.cost !== undefined ? Number(quiniela.metadata.cost) : 100;
        return calculateQuinielaCost(predictions, currentBasePrice);
    }, [predictions, quiniela]);

    const { doubles, triples, totalCost, combinations, basePrice } = stats;

    const handleSubmit = async () => {
        if (!user) return toast.error("Debes iniciar sesión para participar");
        
        if (isExpired(quiniela?.metadata?.deadline)) {
            setExpiredStatus(true);
            return toast.error("¡Lo sentimos! El tiempo para participar ha terminado.");
        }

        const totalFixtures = quiniela?.fixtures?.length || 0;
        const completeMatches = Object.values(predictions).filter(p => p.length > 0).length;

        if (completeMatches < totalFixtures) return toast.warning("Debes completar todos los partidos.");
        if (triples > MAX_TRIPLES) return toast.warning(`Límite de triples excedido (Máx: ${MAX_TRIPLES})`);
        if (doubles > MAX_DOUBLES) return toast.warning(`Límite de dobles excedido (Máx: ${MAX_DOUBLES})`);

        setSubmitting(true);
        try {
            await quinielaService.submitEntry({
                userId: user.uid,
                userName: user.displayName || 'Usuario',
                email: user.email,
                quinielaId,
                quinielaName: quiniela.metadata.title,
                predictions,
                totalCost,
                combinations,
                basePrice
            });
            
            setShowPaymentBanner(true);
            toast.success("¡Quiniela guardada con éxito!");
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            handleError(error, "No se pudo guardar tu quiniela");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center font-bold text-emerald-600 animate-pulse text-xl tracking-widest uppercase">
                Cargando Quiniela...
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
            {showPaymentBanner && (
                <PaymentBanner 
                    totalCost={totalCost} 
                    onNavigate={() => navigate('/dashboard/user/history')} 
                />
            )}

            <div className={`flex flex-col lg:flex-row gap-8 items-start transition-opacity duration-500 ${
                showPaymentBanner ? 'opacity-30 pointer-events-none' : 'opacity-100'
            }`}>
                
                <div className="lg:w-2/3 w-full">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
                                {quiniela?.metadata?.title}
                            </h1>
                            {expiredStatus ? (
                                <p className="text-red-600 text-xs mt-1 font-bold bg-red-50 px-2 py-1 rounded inline-block">
                                    <i className="fas fa-lock mr-1"></i> CERRADA
                                </p>
                            ) : (
                                <div className="mt-1 text-sm text-gray-500">
                                    <span className="font-bold text-emerald-600">Precio por quiniela: ${basePrice} MXN</span>
                                    <span className="mx-2">•</span>
                                    <span className="italic">Selecciona dobles/triples para aumentar tus chances</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <FixtureList 
                        fixtures={quiniela?.fixtures} 
                        predictions={predictions} 
                        onSelect={handleSelect}
                        disabled={alreadyPlayed || expiredStatus}
                    />
                </div>

                <div className="lg:w-1/3 w-full space-y-6">
                    {expiredStatus && !showPaymentBanner && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm animate-pulse">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-clock text-red-500"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-bold">Tiempo agotado</p>
                                    <p className="text-xs text-red-600">Esta quiniela ya ha cerrado sus inscripciones.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <QuinielaSummary 
                        totalCost={totalCost}
                        doubles={doubles}
                        triples={triples}
                        maxDoubles={MAX_DOUBLES}
                        maxTriples={MAX_TRIPLES}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        disabled={alreadyPlayed || expiredStatus}
                        combinations={combinations}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlayQuiniela;