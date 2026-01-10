import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase/config'; // [!code ++] Agregamos auth
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'; // [!code ++] serverTimestamp
import { fetchFromApi } from '../../../services/footballApi';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const ResultsManager = () => {
    const { quinielaId } = useParams();
    const navigate = useNavigate();

    const [quiniela, setQuiniela] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingScores, setEditingScores] = useState({});
    const [isSyncing, setIsSyncing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchQuiniela = async () => {
            if (!quinielaId) return;

            try {
                const docRef = doc(db, 'quinielas', quinielaId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setQuiniela(data);

                    // [!code ++] Advertencia visual si alguien más está procesando
                    if (data.metadata?.isProcessing) {
                        toast.warning(`⚠️ Esta quiniela está siendo procesada por: ${data.metadata.processingBy || 'Otro Admin'}`);
                    }

                    const initialScores = {};
                    if (data.fixtures) {
                        data.fixtures.forEach(fixture => {
                            if (fixture.result) {
                                initialScores[fixture.id] = {
                                    home: fixture.result.home,
                                    away: fixture.result.away
                                };
                            }
                        });
                    }
                    setEditingScores(initialScores);
                } else {
                    toast.error("Quiniela no encontrada");
                    navigate('/dashboard/admin/quinielas');
                }
            } catch (error) {
                console.error("Error cargando quiniela:", error);
                toast.error("Error al cargar los datos del evento");
            } finally {
                setLoading(false);
            }
        };

        fetchQuiniela();
    }, [quinielaId, navigate]);

    const determineOutcome = (homeScore, awayScore, fixtureStatus) => {
        const VALID_FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'Match Finished', 'Full Time'];
        const statusStr = typeof fixtureStatus === 'object' ? fixtureStatus.short : fixtureStatus;

        if (!VALID_FINISHED_STATUSES.includes(statusStr)) return null;

        const h = parseInt(homeScore);
        const a = parseInt(awayScore);
        
        if (isNaN(h) || isNaN(a)) return null;

        if (h > a) return 'HOME';
        if (a > h) return 'AWAY';
        return 'DRAW';
    };

    const syncWithApi = async () => {
        if (!quiniela) return;
        setIsSyncing(true);
        const loadingToast = toast.loading("Sincronizando con la API...");

        try {
            const promises = quiniela.fixtures.map(async (fixture) => {
                const data = await fetchFromApi('fixtures', `?id=${fixture.id}&timezone=America/Mexico_City`);
                return data.response[0];
            });

            const results = await Promise.all(promises);
            const newScores = { ...editingScores };
            let updatesCount = 0;
            const updatedFixturesLocal = [...quiniela.fixtures];

            results.forEach(match => {
                if (!match) return;

                const fixtureIndex = updatedFixturesLocal.findIndex(f => String(f.id) === String(match.fixture.id));
                
                if (fixtureIndex !== -1) {
                    updatedFixturesLocal[fixtureIndex].status = match.fixture.status.short;
                    delete updatedFixturesLocal[fixtureIndex].isLocked;
                    delete updatedFixturesLocal[fixtureIndex].lockedAt;
                }

                const statusShort = match.fixture.status.short;

                if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                    let homeScore = match.goals.home;
                    let awayScore = match.goals.away;

                    if (match.score && match.score.fulltime && match.score.fulltime.home !== null) {
                        homeScore = match.score.fulltime.home;
                        awayScore = match.score.fulltime.away;
                    }

                    newScores[match.fixture.id] = { home: homeScore, away: awayScore };
                    updatesCount++;
                }
            });

            setEditingScores(newScores);
            setQuiniela({ ...quiniela, fixtures: updatedFixturesLocal });

            toast.success(`Sincronización lista: ${updatesCount} partidos actualizados`, {
                id: loadingToast
            });
        } catch (error) {
            console.error(error);
            toast.error("Error al conectar con la API", { id: loadingToast });
        } finally {
            setIsSyncing(false);
        }
    };

    const saveResultsAndCalculate = async () => {
        if (!quiniela) return;

        // [!code ++] 1. Check de seguridad: Consultar estado fresco antes de intentar nada
        const freshDocSnap = await getDoc(doc(db, 'quinielas', quiniela.id));
        if (freshDocSnap.exists() && freshDocSnap.data().metadata?.isProcessing) {
            return Swal.fire({
                icon: 'error',
                title: 'Bloqueado',
                text: `Otro administrador (${freshDocSnap.data().metadata.processingBy}) está calculando puntos en este momento. Intenta en unos segundos.`
            });
        }

        const result = await Swal.fire({
            title: '¿Confirmas el cálculo de puntos?',
            text: "Se tomarán los marcadores actuales (90 min) para calcular el ranking.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, calcular',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        setIsProcessing(true);
        const processingToast = toast.loading("Procesando puntos de usuarios...");
        const quinielaRef = doc(db, 'quinielas', quiniela.id);

        try {
            // [!code ++] 2. LOCK: Establecer bandera de procesamiento
            await updateDoc(quinielaRef, {
                'metadata.isProcessing': true,
                'metadata.processingBy': auth.currentUser?.email || 'Admin',
                'metadata.processingStartedAt': serverTimestamp()
            });

            const officialOutcomes = {};

            // 1. Guardar resultados oficiales en la Quiniela
            const updatedFixtures = quiniela.fixtures.map(fixture => {
                const newScore = editingScores[fixture.id];
                let updatedFixture = { ...fixture };

                delete updatedFixture.isLocked;
                delete updatedFixture.lockedAt;

                if (newScore && newScore.home !== undefined && newScore.away !== undefined) {
                    const statusToCheck = fixture.status?.short || fixture.status || 'FT';
                    
                    const outcome = determineOutcome(newScore.home, newScore.away, statusToCheck);
                    
                    if (outcome) {
                        officialOutcomes[String(fixture.id)] = outcome;
                    }

                    updatedFixture = {
                        ...updatedFixture,
                        result: { home: parseInt(newScore.home), away: parseInt(newScore.away) },
                        outcome: outcome,
                        calculatedAt: new Date().toISOString(),
                        isValid: outcome !== null
                    };
                }
                return updatedFixture;
            });

            // Actualizamos fixtures pero MANTENEMOS el lock (no lo quitamos aquí)
            await updateDoc(quinielaRef, { fixtures: updatedFixtures });

            // 2. Calcular puntos de los usuarios
            const q = query(collection(db, 'userEntries'), where('quinielaId', '==', quiniela.id));
            const participationsSnapshot = await getDocs(q);

            if (participationsSnapshot.empty) {
                toast.info("Resultados guardados (Sin participantes).", { id: processingToast });
                return; // Irá al finally para desbloquear
            }

            const BATCH_SIZE = 400;
            let batch = writeBatch(db);
            let counter = 0;
            let batchCount = 0;

            for (const participationDoc of participationsSnapshot.docs) {
                const data = participationDoc.data();
                let userPoints = 0;

                if (data.predictions) {
                    Object.keys(data.predictions).forEach(fixtureId => {
                        const userPick = data.predictions[fixtureId];
                        const actualOutcome = officialOutcomes[String(fixtureId)];

                        if (userPick && actualOutcome) {
                            const isHit = Array.isArray(userPick)
                                ? userPick.includes(actualOutcome)
                                : userPick === actualOutcome;
                            
                            if (isHit) userPoints += 1;
                        }
                    });
                }

                batch.update(doc(db, 'userEntries', participationDoc.id), {
                    puntos: userPoints,
                    status: 'finalized',
                    calculatedAt: new Date().toISOString()
                });

                counter++;
                if (counter >= BATCH_SIZE) {
                    await batch.commit();
                    batch = writeBatch(db);
                    counter = 0;
                    batchCount++;
                }
            }

            if (counter > 0) await batch.commit();

            toast.success("Resultados y puntos calculados correctamente", { id: processingToast });
            navigate(`/dashboard/admin/quinielas/${quinielaId}`);

        } catch (error) {
            console.error("Error cálculo:", error);
            toast.error("Error al procesar resultados", { id: processingToast });
        } finally {
            // [!code ++] 3. UNLOCK: Siempre liberar el recurso al terminar (éxito o error)
            try {
                await updateDoc(quinielaRef, {
                    'metadata.isProcessing': false,
                    'metadata.lastProcessedAt': serverTimestamp(),
                    'metadata.processingBy': null
                });
            } catch (unlockError) {
                console.error("Error al desbloquear quiniela:", unlockError);
            }
            
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Cargando datos del evento...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
                <div>
                    <Link to={`/dashboard/admin/quinielas/${quinielaId}`} className="text-gray-500 hover:text-gray-800 text-sm mb-1 inline-flex items-center">
                        <i className="fas fa-arrow-left mr-2"></i> Volver al Detalle
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">Resultados & Cálculo</h2>
                    <p className="text-sm text-gray-500">{quiniela?.metadata?.title}</p>
                    {/* [!code ++] Indicador visual si está bloqueado */}
                    {quiniela?.metadata?.isProcessing && (
                        <p className="text-xs text-orange-600 mt-1 font-bold bg-orange-50 inline-block px-2 py-1 rounded animate-pulse">
                            <i className="fas fa-cog fa-spin mr-1"></i>
                            Procesando actualmente...
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={syncWithApi}
                        disabled={isSyncing || isProcessing || quiniela?.metadata?.isProcessing}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
                    >
                        {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-download-alt"></i>}
                        Sincronizar API
                    </button>
                    <button
                        onClick={saveResultsAndCalculate}
                        disabled={isProcessing || quiniela?.metadata?.isProcessing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 transition-all"
                    >
                        {isProcessing ? 'Procesando...' : 'Guardar y Calcular'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Marcadores Oficiales (API - 90 mins)</h3>
                </div>

                <div className="divide-y divide-gray-100">
                    {quiniela?.fixtures?.map((fixture) => (
                        <div
                            key={fixture.id}
                            className="flex flex-col md:flex-row items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 w-full md:w-1/3 mb-2 md:mb-0">
                                <span className="text-sm font-semibold text-right w-full truncate text-gray-700">
                                    {fixture.homeTeam}
                                    {fixture.status && (
                                        <span className="block text-[10px] text-gray-400 font-normal">
                                            {typeof fixture.status === 'object' ? fixture.status.short : fixture.status}
                                        </span>
                                    )}
                                </span>
                                <img src={fixture.homeLogo} alt="" className="w-10 h-10 object-contain" />
                            </div>

                            <div className="flex items-center gap-4 mx-4">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 shadow-inner">
                                    <input
                                        type="number"
                                        className="w-12 h-10 text-center font-bold text-xl outline-none bg-transparent text-gray-600 cursor-default"
                                        value={editingScores[fixture.id]?.home ?? ''}
                                        readOnly
                                        placeholder="-"
                                    />
                                    <span className="text-gray-300 font-bold">:</span>
                                    <input
                                        type="number"
                                        className="w-12 h-10 text-center font-bold text-xl outline-none bg-transparent text-gray-600 cursor-default"
                                        value={editingScores[fixture.id]?.away ?? ''}
                                        readOnly
                                        placeholder="-"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-1/3 justify-end mt-2 md:mt-0">
                                <img src={fixture.awayLogo} alt="" className="w-10 h-10 object-contain" />
                                <span className="text-sm font-semibold text-left w-full truncate text-gray-700">
                                    {fixture.awayTeam}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsManager;