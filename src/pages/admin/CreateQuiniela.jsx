import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleError } from '../../utils/errorHandler';
import QuinielaConfig from './create-quiniela/QuinielaConfig';
import LeagueSelector from './create-quiniela/LeagueSelector';
import FixturePicker from './create-quiniela/FixturePicker';
import QuinielaSummary from './create-quiniela/QuinielaSummary';
import { toast } from 'sonner';

const CreateQuiniela = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [quinielaData, setQuinielaData] = useState({
        title: '',
        type: 'public', 
        entryFee: 0,
        pot: 0,
        deadline: '',
        description: '',
        maxParticipants: 100,
        fixtures: [],
        leagues: []
    });

    const updateData = (newData) => {
        setQuinielaData(prev => ({ ...prev, ...newData }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const validateStep1 = () => {
        if (!quinielaData.title || !quinielaData.deadline) {
            toast.warning("Completa los campos obligatorios");
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (quinielaData.fixtures.length === 0) {
            toast.warning("Selecciona al menos un partido");
            return false;
        }
        return true;
    };

    const handleCreate = async () => {
        setLoading(true);
        const processingToast = toast.loading("Creando quiniela...");

        try {
            const newQuinielaRef = doc(collection(db, 'quinielas'));

            const payload = {
                metadata: {
                    title: quinielaData.title,
                    type: quinielaData.type,
                    entryFee: Number(quinielaData.entryFee),
                    pot: Number(quinielaData.pot),
                    deadline: new Date(quinielaData.deadline),
                    description: quinielaData.description,
                    maxParticipants: Number(quinielaData.maxParticipants),
                    createdBy: auth.currentUser?.uid || 'admin',
                    createdAt: serverTimestamp(),
                    status: 'active',
                    participantCount: 0
                },
                fixtures: quinielaData.fixtures.map(f => ({
                    id: f.fixture.id,
                    homeTeam: f.teams.home.name,
                    awayTeam: f.teams.away.name,
                    homeLogo: f.teams.home.logo,
                    awayLogo: f.teams.away.logo,
                    date: f.fixture.date,
                    status: 'NS', 
                    venue: f.fixture.venue.name
                })),
                leagues: quinielaData.leagues
            };

            await setDoc(newQuinielaRef, payload);

            toast.success("¡Quiniela creada exitosamente!", { id: processingToast });
            navigate('/dashboard/admin/quinielas');

        } catch (error) {
            toast.dismiss(processingToast);
            handleError(error, "No se pudo crear la quiniela");
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
                return <FixturePicker selectedLeagues={quinielaData.leagues} selectedFixtures={quinielaData.fixtures} updateData={updateData} onNext={() => validateStep3() && handleNext()} onPrev={handlePrev} />;
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
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>1. Config</span>
                    <div className="w-4 h-0.5 bg-gray-200"></div>
                    <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>2. Ligas</span>
                    <div className="w-4 h-0.5 bg-gray-200"></div>
                    <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>3. Partidos</span>
                    <div className="w-4 h-0.5 bg-gray-200"></div>
                    <span className={`px-3 py-1 rounded-full ${step === 4 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-gray-100'}`}>4. Resumen</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
                {renderStep()}
            </div>
        </div>
    );
};

export default CreateQuiniela;