import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { fetchFromApi } from '../../services/footballApi';
import { handleError } from '../../utils/errorHandler';
import { getCurrentFootballSeason } from '../../utils/dateHelpers';
import { toast } from 'sonner';

import QuinielaConfig from './create-quiniela/QuinielaConfig';
import LeagueSelector from './create-quiniela/LeagueSelector';
import FixturePicker from './create-quiniela/FixturePicker';
import QuinielaSummary from './create-quiniela/QuinielaSummary';
import { POPULAR_LEAGUES } from '../../constants/leagues'; 

const CreateQuiniela = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [activeLeagueId, setActiveLeagueId] = useState(null); 
    const [availableRounds, setAvailableRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [availableFixtures, setAvailableFixtures] = useState([]);
    const [roundsLoading, setRoundsLoading] = useState(false);
    const [fixturesLoading, setFixturesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [quinielaData, setQuinielaData] = useState({
        title: '',
        type: 'public', 
        entryFee: 0,
        deadline: '', 
        description: '',
        maxParticipants: 100,
        fixtures: [], 
        leagues: []   
    });

    useEffect(() => {
        if (step === 3 && quinielaData.leagues.length > 0 && !activeLeagueId) {
            setActiveLeagueId(quinielaData.leagues[0]);
        }
    }, [step, quinielaData.leagues]);

    useEffect(() => {
        if (activeLeagueId) {
            fetchRounds(activeLeagueId);
        }
    }, [activeLeagueId]);

    useEffect(() => {
        if (selectedRound && activeLeagueId) {
            fetchFixturesByRound(selectedRound, activeLeagueId);
        }
    }, [selectedRound]);

    const fetchRounds = async (leagueId) => {
        setRoundsLoading(true);
        setAvailableRounds([]); 
        try {
            const currentSeason = getCurrentFootballSeason(); 
            
            const [allRoundsRes, currentRoundRes] = await Promise.all([
                fetchFromApi('fixtures/rounds', `?league=${leagueId}&season=${currentSeason}`),
                fetchFromApi('fixtures/rounds', `?league=${leagueId}&season=${currentSeason}&current=true`)
            ]);
            
            if (allRoundsRes.response && allRoundsRes.response.length > 0) {
                setAvailableRounds(allRoundsRes.response);
                
                let targetRound;
                if (currentRoundRes.response && currentRoundRes.response.length > 0) {
                    targetRound = currentRoundRes.response[0];
                } else {
                    targetRound = allRoundsRes.response[allRoundsRes.response.length - 1];
                }

                setSelectedRound(targetRound);
            } else {
                toast.warning(`No hay jornadas activas para esta liga.`);
            }
        } catch (error) {
            handleError(error, "Error cargando jornadas");
        } finally {
            setRoundsLoading(false);
        }
    };

    const fetchFixturesByRound = async (round, leagueId) => {
        setFixturesLoading(true);
        try {
            const currentSeason = getCurrentFootballSeason();
            const data = await fetchFromApi('fixtures', `?league=${leagueId}&season=${currentSeason}&round=${round}&timezone=America/Mexico_City`);
            
            if (data.response) {
                const upcoming = data.response.filter(f => 
                    ['NS', 'TBD', 'PST'].includes(f.fixture.status.short)
                );
                setAvailableFixtures(upcoming);
            }
        } catch (error) {
            handleError(error, "Error cargando partidos");
        } finally {
            setFixturesLoading(false);
        }
    };

    const updateData = (newData) => {
        setQuinielaData(prev => ({ ...prev, ...newData }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleActiveLeagueChange = (newLeagueId) => {
        setActiveLeagueId(Number(newLeagueId));
        setAvailableFixtures([]); 
        setSearchTerm('');
    };

    const toggleFixtureSelection = (fixtureItem) => {
        const current = quinielaData.fixtures || [];
        const exists = current.find(f => f.fixture.id === fixtureItem.fixture.id);
        
        if (exists) {
            updateData({ fixtures: current.filter(f => f.fixture.id !== fixtureItem.fixture.id) });
        } else {
            const fixtureWithLeague = {
                ...fixtureItem,
                league: {
                    id: fixtureItem.league.id,
                    name: fixtureItem.league.name,
                    round: fixtureItem.league.round
                }
            };
            updateData({ fixtures: [...current, fixtureWithLeague] });
        }
    };

    const filteredFixtures = availableFixtures.filter(item => 
        item.teams.home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.teams.away.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateStep1 = () => {
        if (!quinielaData.title) {
            toast.warning("Completa el título de la quiniela");
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!quinielaData.fixtures || quinielaData.fixtures.length === 0) {
            toast.warning("Selecciona al menos un partido");
            return false;
        }
        return true;
    };

    const handleStep3Next = () => {
        if (!validateStep3()) return;

        const sortedFixtures = [...quinielaData.fixtures].sort((a, b) => 
            new Date(a.fixture.date) - new Date(b.fixture.date)
        );
        
        if (sortedFixtures.length > 0) {
            const firstMatchDate = sortedFixtures[0].fixture.date;
            updateData({ deadline: firstMatchDate });
        }

        handleNext();
    };

    const handleCreate = async () => {
        setLoading(true);
        const processingToast = toast.loading("Creando quiniela...");

        try {
            const newQuinielaRef = doc(collection(db, 'quinielas'));
            const currentSeason = getCurrentFootballSeason();

            const payload = {
                metadata: {
                    title: quinielaData.title,
                    type: quinielaData.type,
                    entryFee: Number(quinielaData.entryFee),
                    pot: 0, 
                    deadline: new Date(quinielaData.deadline), 
                    description: quinielaData.description || '',
                    maxParticipants: Number(quinielaData.maxParticipants),
                    createdBy: auth.currentUser?.uid || 'admin',
                    createdAt: serverTimestamp(),
                    status: 'active',
                    participantCount: 0,
                    season: currentSeason,
                    isMultiLeague: quinielaData.leagues.length > 1
                },
                fixtures: quinielaData.fixtures.map(f => ({
                    id: f.fixture.id,
                    homeTeam: f.teams.home.name,
                    awayTeam: f.teams.away.name,
                    homeLogo: f.teams.home.logo,
                    awayLogo: f.teams.away.logo,
                    date: f.fixture.date,
                    status: 'NS', 
                    venue: f.fixture.venue.name,
                    leagueId: f.league.id,
                    leagueName: f.league.name,
                    round: f.league.round
                })),
                leagues: quinielaData.leagues
            };

            await setDoc(newQuinielaRef, payload);
            toast.success("¡Quiniela creada exitosamente!", { id: processingToast });
            navigate('/dashboard/admin/quinielas');

        } catch (error) {
            toast.dismiss(processingToast);
            handleError(error, "Error al crear quiniela");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return <QuinielaConfig data={quinielaData} updateData={updateData} onNext={() => validateStep1() && handleNext()} />;
            case 2:
                return <LeagueSelector selectedLeagues={quinielaData.leagues || []} updateData={updateData} onNext={handleNext} onPrev={handlePrev} />;
            case 3:
                return (
                    <FixturePicker 
                        filteredFixtures={filteredFixtures}
                        selectedFixtures={quinielaData.fixtures || []}
                        activeLeagueId={activeLeagueId}
                        selectedLeaguesIds={quinielaData.leagues}
                        allLeaguesData={POPULAR_LEAGUES}
                        availableRounds={availableRounds}
                        selectedRound={selectedRound}
                        
                        isLoading={fixturesLoading}
                        isLoadingRounds={roundsLoading}
                        searchTerm={searchTerm}
                        
                        setSearchTerm={setSearchTerm}
                        toggleFixtureSelection={toggleFixtureSelection}
                        handleRoundChange={(e) => setSelectedRound(e.target.value)}
                        handleActiveLeagueChange={handleActiveLeagueChange}
                    />
                );
            case 4:
                return <QuinielaSummary data={quinielaData} onSubmit={handleCreate} onPrev={handlePrev} loading={loading} />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear Nueva Quiniela</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto">
                    <span className={`px-3 py-1 rounded-full whitespace-nowrap ${step >= 1 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>1. Config</span>
                    <div className="w-4 h-0.5 bg-gray-200 shrink-0"></div>
                    <span className={`px-3 py-1 rounded-full whitespace-nowrap ${step >= 2 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>2. Ligas</span>
                    <div className="w-4 h-0.5 bg-gray-200 shrink-0"></div>
                    <span className={`px-3 py-1 rounded-full whitespace-nowrap ${step >= 3 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>3. Partidos</span>
                    <div className="w-4 h-0.5 bg-gray-200 shrink-0"></div>
                    <span className={`px-3 py-1 rounded-full whitespace-nowrap ${step === 4 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>4. Resumen</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
                {renderStep()}
            </div>
            
            {step === 3 && (
                <div className="flex justify-between p-6 bg-white border-t border-gray-100">
                    <button onClick={handlePrev} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                        Atrás
                    </button>
                    <button 
                        onClick={handleStep3Next}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700"
                    >
                        Siguiente: Resumen ({quinielaData.fixtures.length} partidos)
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreateQuiniela;