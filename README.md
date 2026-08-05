# 💻 Sheerit Dashboard & Administration Panel

Este repositorio contiene la aplicación Frontend para el panel de administración de **Sheerit.com.co**. Está diseñada para ser consumida por asesores y administradores con el fin de gestionar la atención al cliente de WhatsApp, coordinar cobros, planificar turnos, ver estadísticas en tiempo real y automatizar flujos de configuración.

## 🌟 Características del Dashboard

### 1. 💬 Panel de Soporte y Chats Multi-Agente (TicketsView)
- **Atención en Tiempo Real**: Lista chats activos segmentados por estados: *En Espera*, *Asignados*, *Archivados/Resueltos* y *Por Salir / Probablemente Terminados (IA)*.
- **Asignación de Asesores**: Permite reclamar un ticket para evitar colisiones de atención humana.
- **Badge de Resolución**: Muestra de forma visible quién resolvió el ticket (`✅ Resuelto por [Asesor]`).
- **Leaderboard de Resoluciones**: Un modal estadístico que despliega el conteo de tickets resueltos por cada asesor en el día actual (`CURDATE()`) y el histórico acumulado.

### 2. 📅 Planificación de Turnos y Reloj Control (SupportScheduleView)
- **Calendario Paginable**: Permite a los asesores estructurar sus jornadas laborales semana a semana en intervalos de 30 minutos.
- **Plantilla Base (Default)**: Si no hay un horario configurado para una fecha real, el sistema hereda de forma inteligente su plantilla por defecto.
- **Reglas de Cuidado y Salud Mental**: Valida que la hora de descanso/almuerzo tenga al menos 1.5 horas (90 minutos) de separación con la hora de entrada y de salida.
- **Bloqueo de Horas Extras**: Interruptor administrativo para impedir que los asesores excedan las 8 horas laborales diarias permitidas.

### 3. 💸 Gestión de Nómina y Pagos (Payroll Panel)
- **Acceso Restringido**: Vista de nómina de visualización exclusiva para administradores autorizados.
- **Cálculo de Horas**: Suma automáticamente las horas netas mensuales trabajadas por colaborador restando las horas de break.
- **Control Financiero**: Permite establecer el valor de la hora de soporte, agregar bonos e incentivos personalizados con descripción y realizar cierres mensuales de nómina persistiendo los datos históricos.

### 4. 🧠 Automatizador RPA (RpaAutomatorView)
- **Generador de Puppeteer**: Permite arrastrar y subir los instructivos PDF de Scribe.
- **Integración con IA**: El sistema backend traduce la guía Scribe mediante Gemini y la transforma en una receta JSON interactiva para interactuar con paneles de proveedores terceros de streaming (Netflix, Disney+, etc.) a nivel de navegador.

### 5. ⚡ Auditoría de Sistema, Seguridad e Historial de Contratos
- **Cierre de Sesión Automático por Inactividad**: Validación en tiempo real contra la base de datos MariaDB. Si un colaborador con contrato terminado/inactivo intenta acceder o mantener una sesión guardada, la aplicación destruye inmediatamente las credenciales locales y bloquea el acceso.
- **Autenticación Dinámica de Asesores**: Validación instantánea contra la API de colaboradores registrados en MariaDB, eliminando la necesidad de listas estáticas en código.
- **Modulo de Logs de Auditoría (`system_activity_logs`)**: Modal de administración con registro cronológico de las acciones del sistema y eventos clave realizados por cada colaborador (con timestamps e identificación de asesor).
- **Optimización de Cambio de Chat en Vivo**: Limpieza instantánea del estado de mensajes y resolución de condiciones de carrera al cambiar de conversación, garantizando una transición fluida y sin retrasos.

### 6. 📧 Correos y Cuentas 2FA
- **Gestión de Gmails**: Vista unificada para autorizar, guardar y eliminar bandejas de correo que el bot inspecciona para verificar transferencias.
- **OTP / Google Authenticator**: Módulo interactivo que despliega en tiempo real los códigos 2FA activos de ChatGPT y Amazon Prime junto con un contador de segundos restantes antes de su expiración.

---

## 🛠️ Tecnologías Utilizadas

- **Core**: React 18 & TypeScript (TSX)
- **Entorno de Compilación**: Vite
- **Estilos y Maquetación**: TailwindCSS
- **Iconografía**: Lucide React
- **Navegación**: React Router DOM

---

## 🚀 Instalación y Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:5173`.

3. **Conexión con el Backend**:
   La aplicación detecta automáticamente el entorno:
   - Si estás en `localhost`, apuntará al puerto local del bot: `http://localhost:3000`.
   - En producción, conectará automáticamente al dominio oficial del bot: `https://bot.sheerit.com.co`.

---

## 📦 Compilación para Producción

Para compilar el proyecto y generar los archivos estáticos listos para producción:
```bash
npm run build
```
Esto generará la carpeta `dist/` con el código HTML/JS/CSS optimizado.

---

## 🌎 Despliegue en Producción

Una vez compilado o confirmados los cambios en local:
1. Asegúrate de hacer commit de tus cambios:
   ```bash
   git add .
   git commit -m "feat: [descripción de la mejora en español]"
   git push origin main
   ```
2. En el servidor VPS de Sheerit, dirígete a la carpeta `sheeritpage`, haz pull de la rama `main` y compila para que los archivos estáticos se sirvan actualizados en el servidor web.
