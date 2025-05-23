import React from 'react';
import { Clock, Shield, Headphones, RefreshCw, Timer, HelpCircle } from 'lucide-react';

const features = [
  {
    icon: Timer,
    title: 'Entrega en tiempo real',
    description: 'Entrega en tiempo real después del pago sin espera'
  },
  {
    icon: HelpCircle,
    title: 'Consulta credenciales',
    description: '¿No funciona la contraseña? Click en averiguar para tener todas las credenciales al alcance de tu número'
  },
  {
    icon: Shield,
    title: 'Certificado SSL',
    description: 'El pago se realiza en condición segura con la pasarela de bolt o por transferencia de bancos o billeteras digitales'
  },
  {
    icon: Headphones,
    title: '24/7 Asistencia en directo',
    description: 'Sheer it ofrece asistencia privada de 24/7 al cliente'
  },
  {
    icon: RefreshCw,
    title: 'Cuentas renovables',
    description: 'Mantén tu identidad digital intacta con nuestras cuentas permanentes. Los correos electrónicos se mantienen sin cambios mientras mantengas tu suscripción activa.'
  },
  {
    icon: Clock,
    title: 'Política de reembolso',
    description: 'Garantizamos tu satisfacción con nuestra política de reembolso transparente de hasta 20 días'
  }
];

export function Features() {
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          ¿Por qué 250,000+ usuarios eligieron Sheer it?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="w-12 h-12 bg-brand-primary rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}