import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export function WhatsAppButton() {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=573118587974"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
      aria-label="Contactar por WhatsApp"
    >
      <FaWhatsapp className="w-6 h-6" />
    </a>
  );
}