import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
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
    const [isExpired, setIsExpired] = useState(false);

    // Límites de combinaciones (Reglas de Negocio)
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
                const docSnap = await getDoc(doc(db, 'quinielas', quinielaId));
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setQuiniela(data);

                    if (data.metadata?.deadline) {
                        const deadlineDate = new Date(data.metadata.deadline);
                        if (new Date() > deadlineDate) {
                            setIsExpired(true);
                        }
                    }
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
                console.error(error);
                toast.error("Error al cargar la quiniela");
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [quinielaId, user]);

    const handleSelect = (fixtureId, selection) => {
        if (alreadyPlayed || showPaymentBanner || isExpired) return;
        
        setPredictions(prev => {
            const currentPicks = prev[fixtureId] || [];
            // Si ya está seleccionado, lo quita (toggle). Si no, lo agrega.
            const newPicks = currentPicks.includes(selection)
                ? currentPicks.filter(item => item !== selection)
                : [...currentPicks, selection];

            return { ...prev, [fixtureId]: newPicks };
        });
    };

    // --- CORRECCIÓN DE LÓGICA DE CÁLCULO ---
    const calculateStats = () => {
        let doubles = 0;
        let triples = 0;

        // Contar dobles y triples según las selecciones del usuario
        Object.values(predictions).forEach(p => {
            if (p.length === 2) doubles++;
            if (p.length === 3) triples++;
        });

        // Fórmula matemática para combinaciones: 2^D * 3^T
        const combinations = (2 ** doubles) * (3 ** triples);

        // Obtenemos el PRECIO BASE configurado por el Admin (default 100 si no existe)
        // Nota: Ahora 'cost' se interpreta como "Costo por Quiniela Sencilla"
        const basePrice = quiniela?.metadata?.cost !== undefined ? Number(quiniela.metadata.cost) : 100;

        // Costo Total = Combinaciones * Precio Base
        const totalCost = combinations * basePrice;

        return { doubles, triples, totalCost, combinations, basePrice };
    };

    const { doubles, triples, totalCost, combinations, basePrice } = calculateStats();

    const handleSubmit = async () => {
        if (!user) return toast.error("Debes iniciar sesión para participar");
        
        if (quiniela?.metadata?.deadline) {
            const deadlineDate = new Date(quiniela.metadata.deadline);
            if (new Date() > deadlineDate) {
                setIsExpired(true);
                return toast.error("¡Lo sentimos! El tiempo para participar ha terminado.");
            }
        }

        const totalFixtures = quiniela?.fixtures?.length || 0;
        const completeMatches = Object.values(predictions).filter(p => p.length > 0).length;

        // Validación: Deben estar todos los partidos pronosticados (al menos 1 opción)
        if (completeMatches < totalFixtures) {
            return toast.warning("Debes completar todos los partidos.");
        }

        if (triples > MAX_TRIPLES) {
            return toast.warning(`Límite de triples excedido (Máx: ${MAX_TRIPLES})`);
        }
        if (doubles > MAX_DOUBLES) {
            return toast.warning(`Límite de dobles excedido (Máx: ${MAX_DOUBLES})`);
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'userEntries'), {
                userId: user.uid,
                userName: user.displayName || 'Usuario',
                email: user.email,
                quinielaId,
                quinielaName: quiniela.metadata.title,
                predictions,
                totalCost,      // Guardamos el costo calculado final
                combinations,   // Guardamos el número de combinaciones jugadas
                basePrice,      // (Opcional) Guardar el precio base histórico
                createdAt: serverTimestamp(),
                status: 'active',
                puntos: 0, 
                paymentStatus: 'pending' 
            });
            
            setShowPaymentBanner(true);
            toast.success("¡Quiniela guardada con éxito!");
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            toast.error("Error al guardar: " + error.message);
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
                            {isExpired ? (
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
                        disabled={alreadyPlayed || isExpired}
                    />
                </div>

                <div className="lg:w-1/3 w-full space-y-6">
                    {isExpired && !showPaymentBanner && (
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

                    {/* El resumen recibirá el costo total ya multiplicado */}
                    <QuinielaSummary 
                        totalCost={totalCost}
                        doubles={doubles}
                        triples={triples}
                        maxDoubles={MAX_DOUBLES}
                        maxTriples={MAX_TRIPLES}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        disabled={alreadyPlayed || isExpired}
                        // Pasamos combinations por si QuinielaSummary quiere mostrarlo (ej: "8 quinielas")
                        combinations={combinations}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlayQuiniela;