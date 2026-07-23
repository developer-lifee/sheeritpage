import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

export function WhatsAppButton() {
  const { getWaLink } = useWhatsAppContact();
  return (
    <a
      href={getWaLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
      aria-label="Contactar por WhatsApp"
    >
      <FaWhatsapp className="w-6 h-6" />
    </a>
  );
}