import { useState, useEffect } from 'react';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return 'https://whatbot.sheerit.com';
};

const DEFAULT_WA_NUMBER = '573118587974';
let cachedWaNumber = DEFAULT_WA_NUMBER;

export function useWhatsAppContact() {
  const [waNumber, setWaNumber] = useState<string>(cachedWaNumber);

  useEffect(() => {
    let isMounted = true;
    const fetchWaConfig = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/public/support-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.whatsapp_contact_number) {
            const cleanNum = String(data.whatsapp_contact_number).replace(/\D/g, '');
            if (cleanNum && isMounted) {
              cachedWaNumber = cleanNum;
              setWaNumber(cleanNum);
            }
          }
        }
      } catch (e) {
        // Fallback to default
      }
    };
    fetchWaConfig();
    return () => { isMounted = false; };
  }, []);

  const getWaLink = (message?: string) => {
    const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://api.whatsapp.com/send?phone=${waNumber}${textParam}`;
  };

  const getFormattedPhone = () => {
    if (waNumber.startsWith('57') && waNumber.length === 12) {
      return `+57 ${waNumber.slice(2, 5)} ${waNumber.slice(5, 8)} ${waNumber.slice(8)}`;
    }
    return `+${waNumber}`;
  };

  return { waNumber, getWaLink, getFormattedPhone };
}
