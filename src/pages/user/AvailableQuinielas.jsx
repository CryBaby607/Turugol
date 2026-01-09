import React, { useState, useEffect } from 'react';
import { quinielaService } from '../../services/quinielaService';
import { Link } from 'react-router-dom'; 

const AvailableQuinielas = () => {
  const [quinielas, setQuiniela] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchQuinielas = async () => {
      try {
        const docs = await quinielaService.getActive();
        setQuiniela(docs);
      } catch (error) {
        console.error("Error al cargar quinielas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuinielas();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const getTimeRemaining = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const total = date - new Date();
    const hours = Math.floor((total / (1000 * 60 * 60)));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} días restantes`;
    if (hours > 0) return `${hours} horas restantes`;
    return "¡Cierra pronto!";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuinielas = quinielas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(quinielas.length / itemsPerPage);

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

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800">🏆 Quinielas Disponibles</h2>
        <p className="text-gray-500 mt-2">Demuestra tus conocimientos y gana. Elige una jornada para participar.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : quinielas.length > 0 ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentQuinielas.map((q) => {
                const deadlineDate = q.metadata.deadline.toDate ? q.metadata.deadline.toDate() : new Date(q.metadata.deadline);
                const isUrgent = (deadlineDate - new Date()) < (24 * 60 * 60 * 1000);
                
                return (
                <div key={q.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 group">
                    <div className="bg-emerald-600 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full"></div>
                    <h3 className="text-white font-bold text-lg truncate z-10 relative">{q.metadata.title}</h3>
                    <p className="text-emerald-100 text-xs z-10 relative mt-1">{q.fixtures?.length || 0} Partidos</p>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{q.metadata.description || "Participa pronosticando los resultados de esta jornada."}</p>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                        <i className={`fas fa-clock mr-2 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}></i>
                        <div>
                            <p className="font-semibold">Cierre de apuestas:</p>
                            <p className="text-xs">{formatDate(q.metadata.deadline)}</p>
                            {isUrgent && <p className="text-xs text-red-500 font-bold mt-1">{getTimeRemaining(q.metadata.deadline)}</p>}
                        </div>
                        </div>
                    </div>

                    <Link 
                        to={`/dashboard/user/play/${q.id}`} 
                        className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold text-center hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 group-hover:scale-[1.02] transform duration-200"
                    >
                        <span>Jugar Ahora</span>
                        <i className="fas fa-arrow-right"></i>
                    </Link>
                    </div>
                </div>
                );
            })}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pb-8">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        <i className="fas fa-chevron-left"></i> Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-500">Página <span className="text-gray-900 font-bold">{currentPage}</span> de <span className="text-gray-900 font-bold">{totalPages}</span></span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        Siguiente <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <i className="fas fa-futbol text-6xl text-gray-200 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-600">No hay quinielas activas</h3>
          <p className="text-gray-400 mt-2">Vuelve más tarde para ver nuevos eventos.</p>
        </div>
      )}
    </div>
  );
};

export default AvailableQuinielas;