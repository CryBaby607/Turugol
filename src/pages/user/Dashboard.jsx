import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const StatCard = ({ title, value, icon, subtext }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <span className="p-2 bg-gray-50 text-emerald-600 rounded-lg">
          <i className={`${icon} text-lg`}></i>
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {subtext && <span className="text-xs text-gray-400 mt-1">{subtext}</span>}
      </div>
    </div>
  );
};

const UserDashboardPage = () => {
  const [stats, setStats] = useState({
    activeQuinielasCount: 0,
    quinielasPlayed: 0,
    nextDeadline: null,
    nextDeadlineTitle: ''
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const partRef = collection(db, 'userEntries');
        const q = query(partRef, where('userId', '==', user.uid));
        const partSnap = await getDocs(q);

        let allEntries = [];
        let activeCount = 0;

        partSnap.forEach(doc => {
          const data = doc.data();
          const fechaObj = data.createdAt?.toDate() || new Date(); 
          if (data.status !== 'finalized') activeCount++;
          allEntries.push({ id: doc.id, ...data, displayDate: fechaObj });
        });

        allEntries.sort((a, b) => b.displayDate - a.displayDate);
        const history = allEntries.slice(0, 5);

        const quinielasRef = collection(db, 'quinielas');
        const now = new Date();
        const qDeadline = query(
          quinielasRef,
          where('metadata.deadline', '>', now),
          orderBy('metadata.deadline', 'asc'),
          limit(1)
        );
        const deadlineSnap = await getDocs(qDeadline);

        let nextDate = null;
        let nextTitle = 'Sin eventos próximos';
        if (!deadlineSnap.empty) {
          const qData = deadlineSnap.docs[0].data();
          nextDate = qData.metadata.deadline?.toDate();
          nextTitle = qData.metadata.title;
        }

        setStats({
          activeQuinielasCount: activeCount,
          quinielasPlayed: partSnap.size,
          nextDeadline: nextDate,
          nextDeadlineTitle: nextTitle
        });
        setRecentActivity(history);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const getTimeRemaining = (date) => {
    if (!date) return '';
    const diff = date - new Date();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h restantes`;
    const days = Math.floor(hours / 24);
    return `${days}d restantes`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 font-light">
        <i className="fas fa-circle-notch fa-spin mr-2"></i> Cargando...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-gray-100">
        <div>
          <p className="text-gray-400 text-sm mb-1">Bienvenido de nuevo,</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {user?.displayName || 'Jugador'}
          </h1>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link
            to="/dashboard/user/history"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Historial
          </Link>
          <Link
            to="/dashboard/user/available-quinielas"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            Nueva Quiniela
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          title="Quinielas Activas" 
          value={stats.activeQuinielasCount} 
          icon="fas fa-bolt" 
          subtext="En espera de resultados"
        />
        <StatCard 
          title="Próximo Cierre" 
          value={stats.nextDeadline ? stats.nextDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} 
          icon="fas fa-clock" 
          subtext={stats.nextDeadlineTitle}
        />
        <StatCard 
          title="Total Jugadas" 
          value={stats.quinielasPlayed} 
          icon="fas fa-ticket-alt" 
          subtext="Historial completo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            Actividad Reciente
            {recentActivity.length > 0 && <span className="ml-2 w-2 h-2 bg-emerald-500 rounded-full"></span>}
          </h2>
          
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">Aún no has participado en ninguna quiniela.</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div 
                  key={item.id} 
                  className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm
                      ${item.status === 'finalized' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <i className="fas fa-futbol"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {item.quinielaName}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.displayDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {item.status === 'finalized' ? (
                      <span className="inline-flex items-center text-sm font-bold text-gray-900">
                        {item.puntos} pts
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        En curso
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {stats.nextDeadline && (
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-100 mb-6 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-2">No te olvides</p>
                <h3 className="text-xl font-bold mb-1">{stats.nextDeadlineTitle}</h3>
                <p className="text-sm opacity-90 mb-4">Cierra en: {getTimeRemaining(stats.nextDeadline)}</p>
                <Link to="/dashboard/user/available-quinielas" className="inline-block bg-white text-emerald-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                  Jugar Ahora
                </Link>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          )}

          <div className="rounded-2xl p-6 border border-gray-100 bg-gray-50">
             <h3 className="text-gray-900 font-bold text-sm mb-2">Consejo Pro</h3>
             <p className="text-gray-500 text-xs leading-relaxed mb-3">
               Consulta el Leaderboard global para ver tu posición respecto a otros jugadores.
             </p>
             <Link to="/dashboard/user/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
               Ver Tabla de Posiciones &rarr;
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;