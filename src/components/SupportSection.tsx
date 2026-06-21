import { useState, useEffect } from 'react';
interface Step {
  text: string;
}

interface Issue {
  id: string;
  title: string;
  image: string;
  whatsappMessage: string;
  steps: Step[];
}

interface SupportPlatform {
  id: string;
  name: string;
  logo: string;
  issues: Issue[];
}

import { ArrowLeft, MessageCircle, CheckCircle2 } from 'lucide-react';

const getApiUrl = () => {
  return window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;
};

export function SupportSection() {
  const [data, setData] = useState<SupportPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<SupportPlatform | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/support`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Error loading support data:', err));
  }, []);

  const WHATSAPP_NUMBER = "573118587974"; // From previous WhatsAppButton component

  const handleIssueSelect = (issue: Issue) => {
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
          {data.map((platform) => (
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
          <div className="md:w-1/2 p-6 flex flex-col items-center bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {selectedIssue.title}
            </h3>
            {selectedIssue.image && (
              <img 
                src={selectedIssue.image} 
                alt={selectedIssue.title}
                className="w-full max-w-sm rounded-xl object-cover shadow-md mb-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
               <h4 className="font-bold text-brand-primary mb-3">Si no funciona:</h4>
               <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                 Si después de seguir los pasos el problema persiste, contacta directamente a un asesor.
               </p>
               <button
                 onClick={handleContactSupport}
                 className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#1ebe57] text-white py-2 px-4 rounded-lg font-bold transition-colors"
               >
                 <MessageCircle className="w-5 h-5 mr-2" />
                 Hablar con Soporte
               </button>
            </div>
          </div>
          <div className="md:w-1/2 p-8 flex flex-col">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Sigue estos pasos para solucionar:
            </h4>
            <div className="space-y-6 flex-grow">
              {selectedIssue.steps && selectedIssue.steps.length > 0 ? (
                selectedIssue.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 pt-1">
                      {step.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No hay pasos documentados. Por favor contacta soporte.</p>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-center text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Solución verificada por Sheerit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
