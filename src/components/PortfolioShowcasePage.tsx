import React, { useState, useEffect } from 'react';
import { enableDemoMode } from '../utils/demoMode';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  Code, 
  Layers, 
  ShieldCheck, 
  CheckCircle, 
  MessageSquare, 
  ArrowRight, 
  Maximize2, 
  RefreshCw, 
  Zap, 
  Building2, 
  ShoppingBag, 
  Coffee, 
  Bot, 
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Utensils,
  Star,
  Shield,
  FileText,
  Ticket,
  Trophy
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: 'saas' | 'ecommerce' | 'webapp' | 'automation';
  categoryLabel: string;
  description: string;
  tags: string[];
  features: string[];
  liveUrl?: string;
  fallbackGradient: string;
  icon: React.ElementType;
  metrics?: { label: string; value: string }[];
}

const PROJECTS: Project[] = [
  {
    id: 'sheerit-store',
    title: 'Sheerit Store - E-Commerce de Licencias',
    subtitle: 'Plataforma de Venta de Entretenimiento & Streaming',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Digital',
    description: 'Tienda virtual con catálogo interactivo de suscripciones, carrito de compras dinámico, comprobación de verificación de hogar y pagos automatizados.',
    tags: ['React', 'Vite', 'Tailwind CSS', 'WhatsApp API', 'Nequi / Bancolombia'],
    features: [
      'Catálogo de combos y planes con actualización en vivo',
      'Sistema de verificación de cuenta y hogar inteligente',
      'Carrito de compras dinámico con cálculo inmediato',
      'Diseño 100% responsivo adaptable a celulares y tablets'
    ],
    liveUrl: 'https://sheerit.com.co',
    fallbackGradient: 'from-purple-600 via-brand-primary to-indigo-900',
    icon: ShoppingBag,
    metrics: [
      { label: 'Transacciones', value: 'Automatizadas' },
      { label: 'UX / UI', value: 'Glassmorphism Premium' }
    ]
  },
  {
    id: 'rifa-sheerit',
    title: 'Rifa Sheerit - Boletería & Cuadrícula Digital',
    subtitle: 'Sistema Web de Selección de Números & Pagos',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Boletería',
    description: 'Sistema web para la venta interactiva de boletas y rifas digitales. Cuadrícula dinámica de números con estado en tiempo real (disponible / reservado), pasarela de pagos integrada y confirmación automática.',
    tags: ['PHP', 'MySQL', 'JavaScript', 'jQuery', 'AJAX', 'Wompi / Nequi'],
    features: [
      'Cuadrícula interactiva de 100 números con cálculo dinámico',
      'Estado en tiempo real de números disponibles y reservados',
      'Integración con pasarela de pago digital y Nequi',
      'Confirmación automática de boleta y comprobantes'
    ],
    liveUrl: 'https://github.com/developer-lifee/rifa.sheerit.com.co',
    fallbackGradient: 'from-purple-700 via-violet-800 to-slate-950',
    icon: Ticket,
    metrics: [
      { label: 'Cuadrícula', value: '100 Números Dinámicos' },
      { label: 'Integración', value: 'Pasarela de Pagos Wompi' }
    ]
  },
  {
    id: 'pickfost',
    title: 'Pickfost - Comida Sabrosa & Domicilios',
    subtitle: 'Plataforma Web de Menú Digital, Pedidos & Domicilios',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Gastronomía',
    description: 'Plataforma web promocional y tienda de domicilios gastronómicos con catálogo interactivo de platillos, carrito de compras y planificador de alimentación semanal.',
    tags: ['HTML5', 'MDBootstrap', 'JavaScript', 'CSS3', 'SweetAlert2'],
    features: [
      'Menú virtual interactivo con catálogo de Salchipapas, Mazorcadas y Hamburguesas',
      'Sistema de pedidos a domicilio con múltiples puntos de distribución',
      'Módulo de planificación de alimentación semanal, quincenal y mensual',
      'Carrito de compras dinámico con inicio de sesión y registro de usuarios'
    ],
    liveUrl: 'https://github.com/developer-lifee/pickfost.com.co',
    fallbackGradient: 'from-amber-600 via-orange-700 to-slate-950',
    icon: Utensils,
    metrics: [
      { label: 'Menú Digital', value: 'Catálogo Interactivo' },
      { label: 'Envíos', value: 'Domicilios Rápidos' }
    ]
  },
  {
    id: 'furdemy',
    title: 'ED-Fútbol / Furdemy - Estadísticas Deportivas',
    subtitle: 'Plataforma de Análisis de Rendimiento & Matrices NumPy',
    category: 'webapp',
    categoryLabel: 'App Web & Análisis',
    description: 'Aplicación web para el ingreso, análisis de rendimiento y cálculo matricial de estadísticas futbolísticas de equipos y jugadores. Generación de gráficos interactivos e informes PDF exportables.',
    tags: ['Python', 'Flask', 'NumPy', 'HTML5', 'JavaScript', 'ReportLab PDF'],
    features: [
      'Cálculo matricial de estadísticas avanzadas con Python NumPy',
      'Formularios de ingreso y tablas de rendimiento por jugador',
      'Generador automático de informes de rendimiento en PDF',
      'Gráficos e indicadores clave de efectividad de equipo'
    ],
    liveUrl: 'https://github.com/developer-lifee/furdemy2',
    fallbackGradient: 'from-blue-800 via-indigo-900 to-slate-950',
    icon: Trophy,
    metrics: [
      { label: 'Motor', value: 'Python & NumPy' },
      { label: 'Reportes', value: 'Exportación PDF' }
    ]
  },
  {
    id: 'aaipa',
    title: 'AAIPA - Servicios Migratorios & Visados',
    subtitle: 'Plataforma de Asesoría Legal de Inmigración & Cursos',
    category: 'webapp',
    categoryLabel: 'App Web LegalTech',
    description: 'Plataforma integral para gestión de trámites migratorios, cursos de derecho de inmigración, preparación para ciudadanía y autenticación social (Google & Apple).',
    tags: ['React', 'TypeScript', 'Vite', 'React Bootstrap', 'i18n', 'OAuth'],
    features: [
      'Cursos especializados: Basics, Visa Process y Citizenship Preparation',
      'Selector de planes de asesoría migratoria y evaluación de perfil',
      'Autenticación social integrada con Google y Apple Login',
      'Soporte multi-idioma con i18next'
    ],
    liveUrl: 'https://github.com/developer-lifee/react-app',
    fallbackGradient: 'from-blue-700 via-sky-800 to-slate-950',
    icon: FileText,
    metrics: [
      { label: 'Especialidad', value: 'Derecho Migratorio' },
      { label: 'Autenticación', value: 'Google & Apple OAuth' }
    ]
  },
  {
    id: 'scratchup',
    title: 'ScratchUp - Café de Especialidad & Coworking',
    subtitle: 'Plataforma Web para Tienda de Café de Origen & Reservas',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Gastronomía',
    description: 'Plataforma web para marca de Café de Especialidad en Bogotá y espacios de coworking innovadores. Catálogo de grano seleccionado, método de extracción y comunidad.',
    tags: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript', 'CartProvider'],
    features: [
      'Catálogo de café de especialidad de origen colombiano',
      'Sistema de reservas para áreas de trabajo y coworking',
      'Carrito de compras y pasarela de pedidos rápida',
      'Optimizado para dispositivos móviles y experiencia boutique'
    ],
    liveUrl: 'https://github.com/developer-lifee/v0-cafe-website',
    fallbackGradient: 'from-amber-700 via-amber-900 to-slate-950',
    icon: Coffee,
    metrics: [
      { label: 'Producto', value: 'Café de Origen' },
      { label: 'Espacio', value: 'Coworking Innovador' }
    ]
  },
  {
    id: 'consergeria',
    title: 'Conserjería Profesional & Propiedad Horizontal',
    subtitle: 'Plataforma de Servicios para Administración de Copropiedades',
    category: 'webapp',
    categoryLabel: 'App Web Empresarial',
    description: 'Plataforma corporativa para la contratación de servicios de conserjería profesional en propiedad horizontal, atención en portería y gestión de residentes.',
    tags: ['Next.js 14', 'React', 'Tailwind CSS', 'TypeScript', 'Lucide Icons'],
    features: [
      'Certificación de servicio 100% legal y cumplimiento normativo',
      'Atención profesional en portería, recepción y minutas',
      'Control de áreas comunes, accesos y paquetería',
      'Cero riesgo laboral directo para administradores de edificios'
    ],
    liveUrl: 'https://github.com/developer-lifee/consergeria-website',
    fallbackGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    icon: Building2,
    metrics: [
      { label: 'Legalidad', value: '100% Certificado' },
      { label: 'Cobertura', value: '24/7 Continua' }
    ]
  },
  {
    id: 'sheerit-saas',
    title: 'Sheerit Software - Panel SaaS & RPA',
    subtitle: 'Sistema de Gestión Administrativa & Bots Inteligentes',
    category: 'saas',
    categoryLabel: 'Plataforma SaaS & Bot',
    description: 'Suite empresarial de control operativo con gestión de cuadrantes de turnos, cálculo de nómina en tiempo real, ejecutor RPA y Asistente IA integrados.',
    tags: ['React', 'TypeScript', 'Express.js', 'MySQL', 'AI Assistant', 'RPA'],
    features: [
      'Gestor de horarios y restricción de equidad de turnos',
      'Buscador histórico por fecha con retención de contratos pasados',
      'Supervisión de ejecuciones de bots de WhatsApp en vivo',
      'Asistente conversacional omnipresente para consultas rápidas'
    ],
    liveUrl: 'https://www.sheerit.com.co/aiuda/admin',
    fallbackGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    icon: Bot,
    metrics: [
      { label: 'Ahorro de Tiempo', value: '95% Operativo' },
      { label: 'Automatización', value: 'Bots RPA Ininterrumpidos' }
    ]
  }
];

// HTML interactivo de la Rifa Sheerit (rifa.sheerit.com.co)
const RIFA_AUTHENTIC_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rifa Sheerit - Selección de Números</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
    .rifa-header { background: #1e293b; border-bottom: 2px solid #a855f7; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(46px, 1fr)); gap: 8px; max-height: 280px; overflow-y: auto; padding: 12px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; }
    .grid-item { padding: 8px 0; text-align: center; font-weight: 800; font-size: 13px; border-radius: 10px; cursor: pointer; user-select: none; transition: all 0.15s; }
    .grid-item.disponible { background: #334155; color: #f8fafc; border: 1px solid #475569; }
    .grid-item.disponible:hover { background: #475569; border-color: #a855f7; }
    .grid-item.selected { background: #a855f7; color: #ffffff; border-color: #c084fc; box-shadow: 0 0 10px rgba(168, 85, 247, 0.4); }
    .grid-item.reservado { background: #1e1b4b; color: #64748b; border: 1px solid #1e293b; cursor: not-allowed; opacity: 0.5; }
    .btn-purchase { background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; font-weight: 800; padding: 10px 20px; border-radius: 12px; border: none; width: 100%; font-size: 14px; }
  </style>
</head>
<body>
  <header class="rifa-header">
    <div class="d-flex align-items-center gap-2">
      <i class="fa-solid fa-ticket text-purple" style="font-size:22px; color:#c084fc;"></i>
      <span style="font-weight:900; font-size:18px; color:#ffffff;">RIFA SHEERIT DIGITAL</span>
    </div>
    <span class="badge bg-purple" style="background:#a855f7; padding:6px 12px; font-size:11px;">$20.000 COP / Boleta</span>
  </header>

  <div class="container my-4">
    <div class="text-center mb-3">
      <h4 class="fw-bold text-white mb-1">Selecciona tus Números Afortunados 🎟️</h4>
      <p class="text-slate-400 small mb-0" style="color:#94a3b8;">Haz clic en los números disponibles para armar tu paquete de boletas.</p>
    </div>

    <div class="grid-container mb-4" id="raffle-grid"></div>

    <div class="p-3 bg-slate-900 rounded-3 border border-slate-800 d-flex align-items-center justify-content-between gap-3">
      <div>
        <span class="text-slate-400 small d-block" style="color:#94a3b8;">Boletas Seleccionadas: <strong id="selected-count" class="text-white">0</strong></span>
        <h5 class="fw-bold mb-0" style="color:#c084fc;">Total: $<span id="total-price">0</span> COP</h5>
      </div>
      <button class="btn-purchase" onclick="buyRaffle()"><i class="fa-solid fa-credit-card"></i> Comprar Boletas</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script>
    const gridEl = document.getElementById('raffle-grid');
    let selected = [];
    const price = 20000;

    for (let i = 1; i <= 100; i++) {
      const numStr = i < 10 ? '0' + i : '' + i;
      const isReserved = (i % 7 === 0 || i % 13 === 0);
      const item = document.createElement('div');
      item.className = 'grid-item ' + (isReserved ? 'reservado' : 'disponible');
      item.innerText = numStr;
      if (!isReserved) {
        item.onclick = function() {
          if (item.classList.contains('selected')) {
            item.classList.remove('selected');
            selected = selected.filter(n => n !== numStr);
          } else {
            item.classList.add('selected');
            selected.push(numStr);
          }
          document.getElementById('selected-count').innerText = selected.length;
          document.getElementById('total-price').innerText = (selected.length * price).toLocaleString('es-CO');
        };
      }
      gridEl.appendChild(item);
    }

    function buyRaffle() {
      if (selected.length === 0) {
        Swal.fire('Selecciona tus números', 'Por favor selecciona al menos un número para proceder con la compra.', 'warning');
        return;
      }
      Swal.fire({
        title: '🚀 Confirmar Compra de Boletas',
        html: '<p>Números: <strong>' + selected.join(', ') + '</strong></p>' +
              '<h4 style="color:#a855f7;">Total a Pagar: $' + (selected.length * price).toLocaleString('es-CO') + ' COP</h4>',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Pagar por Nequi / Wompi',
        confirmButtonColor: '#a855f7'
      }).then(res => {
        if (res.isConfirmed) {
          Swal.fire('¡Pago Generado!', 'Tus números han sido reservados con éxito.', 'success');
        }
      });
    }
  </script>
</body>
</html>
`;

// HTML interactivo de ED-Fútbol / Furdemy (furdemy2)
const FURDEMY_AUTHENTIC_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Furdemy / ED-Fútbol - Estadísticas Deportivas</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b132b; color: #ffffff; margin: 0; padding: 0; }
    .furdemy-header { background: #1c2541; border-bottom: 2px solid #3a86ff; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .card-stat { background: #1c2541; border: 1px solid #3a86ff33; border-radius: 16px; padding: 18px; text-align: center; }
    .stat-number { font-size: 24px; font-weight: 900; color: #3a86ff; }
    .table-furdemy { background: #1c2541; color: #ffffff; border-radius: 12px; overflow: hidden; }
    .table-furdemy th { background: #0b132b; color: #3a86ff; font-weight: 800; border-color: #3a86ff33; }
    .table-furdemy td { border-color: #3a86ff22; }
    .btn-pdf { background: #3a86ff; color: white; font-weight: 800; border-radius: 10px; padding: 8px 18px; border: none; }
  </style>
</head>
<body>
  <header class="furdemy-header">
    <div class="d-flex align-items-center gap-2">
      <i class="fa-solid fa-trophy text-warning" style="font-size:22px;"></i>
      <span style="font-weight:900; font-size:18px; letter-spacing:0.5px;">ED-FÚTBOL / FURDEMY</span>
    </div>
    <span class="badge bg-primary" style="padding:6px 12px; font-size:11px;"><i class="fa-solid fa-chart-line"></i> Análisis Matricial NumPy</span>
  </header>

  <div class="container my-4">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <div>
        <h4 class="fw-bold mb-1">Plataforma de Análisis & Estadísticas Deportivas ⚽</h4>
        <p class="small mb-0" style="color:#8d99ae !important;">Procesamiento matricial con Python & NumPy y generación de informes PDF.</p>
      </div>
      <button class="btn-pdf" onclick="exportPDF()"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card-stat">
          <div class="stat-number">88.4%</div>
          <div class="small" style="color:#8d99ae !important;">Efectividad de Pases (Matriz)</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card-stat">
          <div class="stat-number text-success">3.2</div>
          <div class="small" style="color:#8d99ae !important;">Goles Esperados (xG) / Partido</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card-stat">
          <div class="stat-number text-warning">14.6</div>
          <div class="small" style="color:#8d99ae !important;">Recuperaciones por Encuentro</div>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-furdemy align-middle">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Posición</th>
            <th>PJ</th>
            <th>Goles</th>
            <th>Asistencias</th>
            <th>Matriz de Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Carlos Valderrama (Demo)</strong></td>
            <td>Mediocampista</td>
            <td>12</td>
            <td>5</td>
            <td>14</td>
            <td><span class="badge bg-success">Excelente (0.94)</span></td>
          </tr>
          <tr>
            <td><strong>Radamel Falcao (Demo)</strong></td>
            <td>Delantero Centro</td>
            <td>10</td>
            <td>11</td>
            <td>2</td>
            <td><span class="badge bg-primary">Alto (0.88)</span></td>
          </tr>
          <tr>
            <td><strong>James Rodríguez (Demo)</strong></td>
            <td>Volante Creativo</td>
            <td>14</td>
            <td>8</td>
            <td>10</td>
            <td><span class="badge bg-success">Excelente (0.96)</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script>
    function exportPDF() {
      Swal.fire({
        title: '📄 Generando Informe PDF...',
        text: 'Procesando matrices con NumPy y compilando reporte con ReportLab.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    }
  </script>
</body>
</html>
`;

// Código HTML/CSS 100% auténtico renderizado con las imágenes REALES del repositorio pickfost.com.co
const PICKFOST_AUTHENTIC_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pickfost - Comida Sabrosa & Domicilios</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #212529; margin: 0; padding: 0; }
    .pickfost-header { background: #ffffff; border-bottom: 2px solid #ec5252; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .pickfost-logo-img { height: 38px; object-fit: contain; }
    .banner { background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('/pickfost/banner_1.webp'); background-size: cover; background-position: center; color: white; padding: 50px 20px; text-align: center; }
    .banner h1 { font-size: 30px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
    .banner p { font-size: 14px; opacity: 0.95; max-width: 600px; margin: 0 auto 20px; }
    .btn-warning-custom { background: #ffb703; color: #000; font-weight: 700; border-radius: 20px; padding: 10px 24px; border: none; text-decoration: none; display: inline-block; }
    .section-title { font-weight: 800; text-transform: uppercase; text-align: center; margin: 35px 0 20px; font-size: 20px; }
    .card-dish { background: white; border-radius: 16px; border: 1px solid #e9ecef; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); transition: transform 0.2s; margin-bottom: 24px; }
    .card-dish:hover { transform: translateY(-4px); }
    .dish-img { height: 180px; width: 100%; object-fit: cover; }
    .card-dish-body { padding: 18px; text-align: center; }
    .card-dish-title { font-weight: 800; font-size: 18px; margin-bottom: 6px; }
    .btn-add { background: #28a745; color: white; font-weight: 700; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; text-decoration: none; }
    .footer-pickfost { background: #14111a; color: white; padding: 30px 20px; font-size: 13px; margin-top: 50px; text-align: center; }
  </style>
</head>
<body>
  <header class="pickfost-header">
    <div class="d-flex align-items-center gap-2">
      <img src="/pickfost/pickfost.png" alt="Pickfost Logo" class="pickfost-logo-img" />
      <span style="font-weight:900; font-size:18px; color:#ec5252; text-transform:uppercase;">PICKFOST</span>
    </div>
    <div>
      <span id="cart-badge" onclick="showCartModal()" class="badge bg-warning text-dark font-weight-bold" style="padding: 8px 14px; font-size:12px; cursor:pointer;"><i class="fa-solid fa-shopping-bag"></i> Carrito (2)</span>
    </div>
  </header>

  <div class="banner">
    <h1>Bienvenido a PICKFOST</h1>
    <p>Comida del pueblo y para el pueblo sabrosa con su paladar y bolsillo, domicilios buenos, bonitos y baratos.</p>
    <a href="#menu" onclick="scrollToMenu(event)" class="btn-warning-custom"><i class="fa-solid fa-hamburger"></i> Ir al menú</a>
  </div>

  <div class="container my-4">
    <h3 class="section-title">Nuestros Servicios Domiciliarios</h3>
    <div class="row text-center g-3">
      <div class="col-12 col-md-4">
        <div class="p-3 bg-white rounded-3 shadow-sm border h-100">
          <i class="fa-solid fa-truck-fast text-danger fa-3x mb-3"></i>
          <h5 class="fw-bold">Envíos a Domicilio</h5>
          <p class="text-muted small">Nuestro innovador sistema con múltiples puntos de distribución hace que sus domicilios lleguen calientes y frescos.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="p-3 bg-white rounded-3 shadow-sm border h-100">
          <i class="fa-solid fa-utensils text-warning fa-3x mb-3"></i>
          <h5 class="fw-bold">Sazón y Sabor</h5>
          <p class="text-muted small">Revolucionando la industria con nuestros excelentes productos únicos. Todo el sabor de Colombia reunido en un menú.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="p-3 bg-white rounded-3 shadow-sm border h-100">
          <i class="fa-solid fa-store-alt text-success fa-3x mb-3"></i>
          <h5 class="fw-bold">Planifique su Alimentación</h5>
          <p class="text-muted small">Planes semanales, quincenales y mensuales para que planifique su alimento sin cargar portacomidas.</p>
        </div>
      </div>
    </div>

    <h3 class="section-title" id="menu">Nuestros Platillos Más Populares</h3>
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <div class="card-dish">
          <img src="/pickfost/salchipapas.jfif" alt="Salchipapas" class="dish-img" />
          <div class="card-dish-body">
            <div class="card-dish-title">Salchipapas</div>
            <p class="text-danger fw-bold mb-2">$6.000 - $26.000</p>
            <button onclick="addDish('Salchipapas Especiales', 16000)" class="btn-add"><i class="fa-solid fa-shopping-bag"></i> &nbsp; Agregar</button>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card-dish">
          <img src="/pickfost/mazorcada.jfif" alt="Mazorcada" class="dish-img" />
          <div class="card-dish-body">
            <div class="card-dish-title">Mazorcadas</div>
            <p class="text-danger fw-bold mb-2">$12.000 - $25.000</p>
            <button onclick="addDish('Mazorcada Mixta', 18000)" class="btn-add"><i class="fa-solid fa-shopping-bag"></i> &nbsp; Agregar</button>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card-dish">
          <img src="/pickfost/hamburgesas.jfif" alt="Hamburguesas" class="dish-img" />
          <div class="card-dish-body">
            <div class="card-dish-title">Hamburguesas</div>
            <p class="text-danger fw-bold mb-2">$8.000 - $25.000</p>
            <button onclick="addDish('Hamburguesa Artesanal', 15000)" class="btn-add"><i class="fa-solid fa-shopping-bag"></i> &nbsp; Agregar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-5 align-items-center bg-white p-4 rounded-3 border shadow-sm">
      <div class="col-12 col-md-6 text-center">
        <img src="/pickfost/registration.png" alt="Registration App" class="img-fluid" style="max-height: 220px;" />
      </div>
      <div class="col-12 col-md-6 text-center text-md-start">
        <h4 class="fw-bold">Descarga nuestra app</h4>
        <p class="text-muted small">Descarga nuestra aplicación para poder acceder a nuestros servicios y realizar pedidos desde tu celular.</p>
        <button class="btn btn-primary btn-sm px-4 py-2 font-weight-bold">Click aquí para registrarte</button>
      </div>
    </div>
  </div>

  <footer class="footer-pickfost">
    <p class="mb-1"><strong>Esteban Ávila — PICKFOST Colombia</strong></p>
    <p class="text-muted mb-0">© Todos los derechos reservados</p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script>
    let cartItems = [
      { name: 'Salchipapas Especiales', price: 16000 },
      { name: 'Mazorcada Mixta', price: 18000 }
    ];

    function updateCartBadge() {
      const badge = document.getElementById('cart-badge');
      if (badge) badge.innerText = 'Carrito (' + cartItems.length + ')';
    }

    function scrollToMenu(e) {
      if (e) e.preventDefault();
      const menuEl = document.getElementById('menu');
      if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
    }

    function addDish(name, price) {
      cartItems.push({ name: name, price: price });
      updateCartBadge();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡' + name + ' agregado al carrito!',
        showConfirmButton: false,
        timer: 2000
      });
    }

    function showCartModal() {
      const total = cartItems.reduce((acc, item) => acc + item.price, 0);
      let itemsHtml = cartItems.map(item => 
        '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">' +
        '<span>' + item.name + '</span>' +
        '<strong>$' + item.price.toLocaleString('es-CO') + ' COP</strong>' +
        '</div>'
      ).join('');

      Swal.fire({
        title: '🛒 Carrito de Pedidos - Pickfost',
        html: '<div style="text-align:left; max-height:200px; overflow-y:auto; margin-bottom:15px;">' +
              (itemsHtml || '<p style="text-align:center;">El carrito está vacío</p>') +
              '</div>' +
              '<h4 style="text-align:right; color:#ec5252;">Total: $' + total.toLocaleString('es-CO') + ' COP</h4>',
        showCancelButton: true,
        confirmButtonText: '🚀 Realizar Pedido',
        cancelButtonText: 'Seguir Comprando',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('¡Pedido Enviado!', 'Tu pedido ha sido recibido y está en preparación para entrega inmediata.', 'success');
        }
      });
    }
  </script>
</body>
</html>
`;

// Código HTML/CSS 100% auténtico del proyecto react-app (AAIPA Association Immigration Services)
const AAIPA_AUTHENTIC_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AAIPA - Association Immigration Services</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #212529; margin: 0; padding: 0; }
    .aaipa-header { background: #1a2530; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0d6efd; }
    .aaipa-logo { font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; }
    .aaipa-hero { background: linear-gradient(rgba(26, 37, 48, 0.85), rgba(26, 37, 48, 0.95)), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200'); background-size: cover; background-position: center; color: white; padding: 60px 24px; text-align: center; }
    .hero-title { font-size: 30px; font-weight: 900; margin-bottom: 14px; }
    .hero-text { font-size: 14px; color: #e2e8f0; max-width: 650px; margin: 0 auto 24px; line-height: 1.6; }
    .btn-aaipa { background: #0d6efd; color: white; font-weight: 700; border-radius: 20px; padding: 10px 28px; border: none; text-decoration: none; display: inline-block; }
    .card-course { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05); height: 100%; transition: transform 0.2s; }
    .card-course:hover { transform: translateY(-4px); }
    .course-img-box { height: 150px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 42px; }
    .footer-aaipa { background: #0f172a; color: #94a3b8; padding: 25px 20px; font-size: 12px; text-align: center; margin-top: 50px; }
  </style>
</head>
<body>
  <header class="aaipa-header">
    <div class="d-flex align-items-center gap-2">
      <i class="fa-solid fa-passport text-primary" style="font-size:22px;"></i>
      <span class="aaipa-logo">AAIPA IMMIGRATION SERVICES</span>
    </div>
    <div>
      <span class="btn btn-outline-light btn-sm font-weight-bold" style="font-size:12px;"><i class="fa-solid fa-user"></i> Portal Cliente</span>
    </div>
  </header>

  <div class="aaipa-hero">
    <h1 class="hero-title">Welcome to AAIPA Association Immigration Services</h1>
    <p class="hero-text">AAIPA Association is dedicated to helping individuals and families navigate the complex immigration process. We offer a wide range of services tailored to your needs.</p>
    <a href="#courses" class="btn-aaipa"><i class="fa-solid fa-graduation-cap"></i> Explorar Cursos & Servicios</a>
  </div>

  <div class="container my-5" id="courses">
    <h3 class="text-center font-weight-bold mb-4" style="font-weight:800; text-transform:uppercase;">Courses and Immigration Services</h3>
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <div class="card-course">
          <div class="course-img-box">
            <i class="fa-solid fa-scale-balanced"></i>
          </div>
          <div class="p-4 text-center">
            <h5 class="fw-bold">Immigration Law Basics</h5>
            <p class="text-muted small">Learn the fundamentals of immigration law to help you navigate complex legal processes effectively.</p>
            <button class="btn btn-primary btn-sm px-4">Ver Detalles</button>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card-course">
          <div class="course-img-box" style="background: linear-gradient(135deg, #047857, #10b981);">
            <i class="fa-solid fa-stamp"></i>
          </div>
          <div class="p-4 text-center">
            <h5 class="fw-bold">Visa Application Process</h5>
            <p class="text-muted small">Get detailed step-by-step guidance on how to apply for different types of visas and residency status.</p>
            <button class="btn btn-primary btn-sm px-4">Ver Detalles</button>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card-course">
          <div class="course-img-box" style="background: linear-gradient(135deg, #b91c1c, #f43f5e);">
            <i class="fa-solid fa-flag-usa"></i>
          </div>
          <div class="p-4 text-center">
            <h5 class="fw-bold">Citizenship Preparation</h5>
            <p class="text-muted small">Prepare for the citizenship test and interview with our comprehensive learning resources and support.</p>
            <button class="btn btn-primary btn-sm px-4">Ver Detalles</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer-aaipa">
    <p class="mb-1"><strong>AAIPA Association Immigration Services</strong></p>
    <p class="mb-0">© Todos los derechos reservados — Esteban Ávila</p>
  </footer>
</body>
</html>
`;

// Código HTML/CSS 100% auténtico del proyecto consergeria-website extraído de su repositorio
const CONSERGERIA_AUTHENTIC_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conserjería Profesional para Copropiedades</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
    .consergeria-header { background: #1e293b; border-bottom: 1px solid #334155; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
    .consergeria-hero { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 55px 24px; text-align: center; border-bottom: 1px solid #334155; }
    .badge-certified { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin-bottom: 16px; }
    .hero-title { font-size: 30px; font-weight: 900; color: #ffffff; margin-bottom: 14px; }
    .hero-subtitle { font-size: 14px; color: #94a3b8; max-width: 650px; margin: 0 auto 28px; line-height: 1.6; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 18px; text-align: center; }
    .stat-value { font-size: 26px; font-weight: 900; }
    .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
    .service-box { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 22px; height: 100%; transition: border-color 0.2s; }
    .service-box:hover { border-color: #6366f1; }
    .btn-quote { background: #6366f1; color: white; font-weight: 800; padding: 12px 26px; border-radius: 12px; border: none; text-decoration: none; display: inline-block; }
    .footer-consergeria { background: #0b0f19; color: #64748b; padding: 24px; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; margin-top: 40px; }
  </style>
</head>
<body>
  <header class="consergeria-header">
    <div class="d-flex align-items-center gap-2">
      <i class="fa-solid fa-shield-halved" style="font-size:22px; color:#818cf8;"></i>
      <span style="font-weight:900; font-size:18px; color:#ffffff; letter-spacing:0.5px;">CONSERJERÍA PROFESIONAL</span>
    </div>
    <span class="badge bg-success" style="padding:6px 12px; font-size:11px;"><i class="fa-solid fa-circle-check"></i> Cobertura 24/7 Activa</span>
  </header>

  <div class="consergeria-hero">
    <div class="badge-certified"><i class="fa-solid fa-shield"></i> Servicio Certificado & 100% Legal</div>
    <h1 class="hero-title">Conserjería Profesional para su Copropiedad</h1>
    <p class="hero-subtitle">Servicio especializado para propiedad horizontal, atención en portería, gestión de residentes y control administrativo en Edificios y Conjuntos Residenciales.</p>
    
    <div class="d-flex justify-content-center gap-3">
      <a href="#contacto" class="btn-quote"><i class="fa-solid fa-file-contract"></i> Solicitar Cotización</a>
    </div>

    <div class="row g-3 mt-4 max-w-4xl mx-auto">
      <div class="col-12 col-md-4">
        <div class="stat-card">
          <div class="stat-value" style="color:#34d399;">100%</div>
          <div class="stat-label">Cumplimiento Legal</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="stat-card">
          <div class="stat-value" style="color:#818cf8;">24 / 7</div>
          <div class="stat-label">Cobertura Continua</div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="stat-card">
          <div class="stat-value" style="color:#38bdf8;">0%</div>
          <div class="stat-label">Riesgo Laboral Directo</div>
        </div>
      </div>
    </div>
  </div>

  <div class="container my-5">
    <h3 class="text-center text-white font-weight-bold mb-4" style="font-weight:800; text-transform:uppercase;">Nuestros Servicios Principales</h3>
    <div class="row g-4">
      <div class="col-12 col-md-4">
        <div class="service-box">
          <i class="fa-solid fa-user-shield fa-2x mb-3" style="color:#818cf8;"></i>
          <h5 class="fw-bold text-white">Atención en Portería</h5>
          <p class="small mb-0" style="color:#94a3b8;">Control estricto de accesos, recepción de encomiendas y atención respetuosa a visitantes y propietarios.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="service-box">
          <i class="fa-solid fa-building-circle-check fa-2x mb-3" style="color:#38bdf8;"></i>
          <h5 class="fw-bold text-white">Gestión Operativa</h5>
          <p class="small mb-0" style="color:#94a3b8;">Supervisión del aseo de áreas comunes, control de parqueaderos de visitantes y reporte de minutas en tiempo real.</p>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="service-box">
          <i class="fa-solid fa-clipboard-list fa-2x mb-3" style="color:#34d399;"></i>
          <h5 class="fw-bold text-white">Soporte Administrativo</h5>
          <p class="small mb-0" style="color:#94a3b8;">Asistencia directa al administrador de la copropiedad, bitácora digital e intermediación de comunicados.</p>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer-consergeria">
    <p class="mb-1"><strong>Conserjería Profesional para Propiedad Horizontal</strong></p>
    <p class="mb-0">© Todos los derechos reservados — Esteban Ávila</p>
  </footer>
</body>
</html>
`;

export const PortfolioShowcasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProject, setActiveProject] = useState<Project>(PROJECTS[0]);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);

  useEffect(() => {
    if (activeProject.id === 'sheerit-saas' && typeof window !== 'undefined') {
      enableDemoMode();
    }
  }, [activeProject.id]);

  const filteredProjects = selectedCategory === 'all' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === selectedCategory);

  const currentProject = activeProject || PROJECTS[0];
  const IconComp = currentProject?.icon || Building2;

  const handleNextProject = () => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === currentProject.id);
    const nextIndex = (currentIndex + 1) % filteredProjects.length;
    setActiveProject(filteredProjects[nextIndex]);
  };

  const handlePrevProject = () => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === currentProject.id);
    const prevIndex = (currentIndex - 1 + filteredProjects.length) % filteredProjects.length;
    setActiveProject(filteredProjects[prevIndex]);
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const getDeviceWidthClass = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-full max-w-[430px] h-[780px] rounded-[36px] border-[6px] border-slate-800 shadow-2xl';
      case 'tablet':
        return 'w-full max-w-[820px] h-[720px] rounded-[24px] border-[6px] border-slate-800 shadow-2xl';
      case 'desktop':
      default:
        return 'w-full h-[650px] rounded-2xl border border-slate-700/80 shadow-2xl';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Principal */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Portafolio de Desarrollos Realizados</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Nuestros Trabajos & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Proyectos Web Completados
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Explora las plataformas web, tiendas virtuales y sistemas SaaS desarrollados con tecnología de vanguardia, máximo rendimiento y diseño interactivo para nuestros clientes.
          </p>
        </div>

        {/* Categorías de Filtro */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-medium">
          {[
            { id: 'all', label: 'Todos los Proyectos' },
            { id: 'webapp', label: '🏢 Apps Web' },
            { id: 'ecommerce', label: '🛍️ E-Commerce & Gastronomía' },
            { id: 'saas', label: '⚡ SaaS & Bots' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Visualizador Interactivo de Dispositivo */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          
          {/* Top Bar de Visualización */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {/* Botones de Navegación Anterior/Siguiente */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handlePrevProject}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Ver proyecto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono px-1 font-bold">
                  {filteredProjects.findIndex(p => p.id === currentProject.id) + 1}/{filteredProjects.length}
                </span>
                <button
                  onClick={handleNextProject}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Ver siguiente proyecto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <IconComp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentProject.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentProject.categoryLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{currentProject.subtitle}</p>
              </div>
            </div>

            {/* Selector de Tamaño de Pantalla (Desktop, Tablet, Mobile) */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Escritorio / Laptop"
              >
                <Laptop className="w-4 h-4" />
                <span className="hidden sm:inline">Laptop</span>
              </button>

              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Tablet"
              >
                <Tablet className="w-4 h-4" />
                <span className="hidden sm:inline">Tablet</span>
              </button>

              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Móvil</span>
              </button>

              <div className="w-px h-5 bg-slate-800 mx-1" />

              <button
                onClick={handleRefreshIframe}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Recargar vista previa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {currentProject.liveUrl && (
                <a
                  href={currentProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir Sitio</span>
                </a>
              )}
            </div>
          </div>

          {/* Contenedor del Marco del Dispositivo */}
          <div className="flex justify-center items-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 min-h-[500px] overflow-hidden">
            <div className={`transition-all duration-500 overflow-hidden relative flex flex-col ${getDeviceWidthClass()}`}>
              
              {/* Fake Browser Address Bar */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>

                <div className="flex-1 bg-slate-950 text-slate-400 text-[11px] font-mono px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2 truncate">
                  <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{currentProject.liveUrl || 'https://demo.sheerit.com.co'}</span>
                </div>
              </div>

              {/* Contenido Visual en IFRAME CON CONSTRUCCIÓN INTERNA DE ASSETS REALES */}
              <div className="flex-1 bg-white relative flex flex-col overflow-hidden">
                {currentProject.id === 'sheerit-store' ? (
                  <iframe
                    key={iframeKey}
                    src="/"
                    title="Sheerit Store Live"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'sheerit-saas' ? (
                  <iframe
                    key={iframeKey}
                    src="/aiuda/admin"
                    title="Sheerit Software Admin Panel Live"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'rifa-sheerit' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={RIFA_AUTHENTIC_HTML}
                    title="Rifa Sheerit Digital"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'furdemy' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={FURDEMY_AUTHENTIC_HTML}
                    title="ED-Fútbol / Furdemy"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'pickfost' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={PICKFOST_AUTHENTIC_HTML}
                    title="Pickfost Internal Build"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'aaipa' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={AAIPA_AUTHENTIC_HTML}
                    title="AAIPA Immigration Services"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.id === 'consergeria' ? (
                  <iframe
                    key={iframeKey}
                    srcDoc={CONSERGERIA_AUTHENTIC_HTML}
                    title="Conserjería Profesional"
                    className="w-full h-full border-0 bg-white"
                  />
                ) : currentProject.liveUrl ? (
                  <iframe
                    key={iframeKey}
                    src={currentProject.liveUrl}
                    title={currentProject.title}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                  />
                ) : (
                  <div className={`flex-1 bg-gradient-to-br ${currentProject.fallbackGradient} p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
                    <div className="absolute -right-10 -bottom-10 opacity-15">
                      <IconComp className="w-80 h-80 text-white" />
                    </div>

                    <div className="space-y-4 relative z-10">
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold">
                        {currentProject.categoryLabel}
                      </span>
                      <h2 className="text-3xl font-extrabold">{currentProject.title}</h2>
                      <p className="text-slate-200 text-sm max-w-lg leading-relaxed">{currentProject.description}</p>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-2 pt-4">
                      {currentProject.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra Inferior de Navegación entre Proyectos */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <button
              onClick={handlePrevProject}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-indigo-400" />
              <span>Proyecto Anterior</span>
            </button>

            <div className="text-center hidden sm:block">
              <span className="text-xs text-slate-400">
                Viendo <strong className="text-white">{currentProject.title}</strong>
              </span>
            </div>

            <button
              onClick={handleNextProject}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-500/40 text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>Siguiente Proyecto</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Galería de Tarjetas de Proyectos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Explorar Todos los Trabajos ({filteredProjects.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Selecciona un proyecto para probarlo en el marco</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const IconComp = project.icon;
              const isSelected = currentProject.id === project.id;

              return (
                <div
                  key={project.id}
                  onClick={() => setActiveProject(project)}
                  className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border transition-colors ${
                          isSelected ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-xs text-slate-400">{project.subtitle}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {project.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Features Chips */}
                    <div className="space-y-1.5 pt-1">
                      {project.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Badges */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-md text-[10px] font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>{isSelected ? '▶️ Viendo en pantalla' : 'Probar este proyecto'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-white flex items-center gap-1 underline font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Enlace</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjeta de Cotización Directa para Nuevos Clientes */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 p-8 rounded-3xl border border-indigo-500/40 shadow-2xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Desarrollo Web & Software a la Medida</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Quieres desarrollar una página web o sistema para tu empresa?
            </h3>
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Creamos aplicaciones web, plataformas e-commerce, bots de automatización y software administrativo a la medida con tecnología premium y soporte continuo.
            </p>
          </div>

          <a
            href="https://wa.me/573118587974?text=Hola,%20me%20interesa%20cotizar%20un%20desarrollo%20web%20o%20sistema%20software%20con%20Sheerit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2 text-sm shrink-0 active:scale-95 z-10"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Cotizar Proyecto por WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default PortfolioShowcasePage;
