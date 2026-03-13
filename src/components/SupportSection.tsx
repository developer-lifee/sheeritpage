import { useState } from 'react';
import { SupportPlatform, SupportIssue, supportData } from '../data/supportData';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export function SupportSection() {
  const [selectedPlatform, setSelectedPlatform] = useState<SupportPlatform | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SupportIssue | null>(null);

  const WHATSAPP_NUMBER = "573133866170"; // From previous WhatsAppButton component

  const handleIssueSelect = (issue: SupportIssue) => {
    setSelectedIssue(issue);
  };

  const handleContactSupport = () => {
    if (selectedIssue) {
      const message = encodeURIComponent(selectedIssue.whatsappMessage);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    }
  };

  const resetSelection = () => {
    if (selectedIssue) {
      setSelectedIssue(null);
    } else if (selectedPlatform) {
      setSelectedPlatform(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[60vh]">
      <div className="mb-8">
        {(selectedPlatform || selectedIssue) && (
          <button 
            onClick={resetSelection}
            className="flex items-center text-brand-primary dark:text-brand-secondary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        )}
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {!selectedPlatform 
            ? 'Selecciona la plataforma en la que tengas inconvenientes'
            : !selectedIssue 
              ? `¿Qué problema tienes con ${selectedPlatform.name}?`
              : `Detalle del problema`}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Obtén ayuda rápida y enfocada a tu problema específico.
        </p>
      </div>

      {!selectedPlatform ? (
        // Grid de Plataformas
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {supportData.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform)}
              className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-transparent hover:border-brand-primary cursor-pointer group"
            >
              <div className="w-20 h-20 mb-4 flex items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <img 
                  src={platform.logo} 
                  alt={`${platform.name} logo`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {platform.name}
              </span>
            </button>
          ))}
        </div>
      ) : !selectedIssue ? (
        // Grid de Problemas de la Plataforma
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedPlatform.issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handleIssueSelect(issue)}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary text-left"
            >
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                <img 
                  src={issue.image} 
                  alt={issue.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300';
                  }}
                />
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between w-full">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                  {issue.title}
                </h3>
                <span className="w-full text-center bg-brand-primary hover:bg-brand-secondary text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Seleccionar
                </span>
              </div>
            </button>
          ))}
          {selectedPlatform.issues.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                No hay problemas reportados frecuentemente para esta plataforma.
              </p>
            </div>
          )}
        </div>
      ) : (
        // Detalle del Problema
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto flex flex-col md:flex-row">
          <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {selectedIssue.title}
            </h3>
            <img 
              src={selectedIssue.image} 
              alt={selectedIssue.title}
              className="w-full max-w-sm rounded-xl object-cover shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300';
              }}
            />
          </div>
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ¿Cómo proceder?
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Para resolver este inconveniente con {selectedPlatform.name}, comunícate directamente con nuestro equipo de soporte por WhatsApp. Analizaremos tu caso e intentaremos solucionarlo lo antes posible.
            </p>
            <button
              onClick={handleContactSupport}
              className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#1ebe57] text-white py-3 px-6 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Contactar Soporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
