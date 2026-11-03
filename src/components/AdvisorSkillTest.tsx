import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ShieldAlert, Award, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Sparkles, Send, RefreshCw, Eye, BookOpen, Brain, 
  ThumbsUp, UserCheck, MessageSquare, AlertCircle, Play, Pause, 
  Volume2, VolumeX, ShieldCheck, EyeOff, Lock, Shuffle
} from 'lucide-react';

interface RealCase {
  id: string;
  category: string;
  clientName: string;
  isAudioCase: boolean;
  audioDuration: string;
  audioTranscript?: string; // Solo reproducido por voz (TTS), no mostrado en pantalla
  clientMessage?: string;   // Mostrado solo en casos de texto
  realContext: string;
  idealResponse: string;
  options: {
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
}

// BANCO MAESTRO DE 16 CASOS REALES Y CONFIDENCIALES DE SHEERIT
const MASTER_CASES_BANK: RealCase[] = [
  {
    id: 'case_audio_tony',
    category: 'Pagos & Cobros (Nota de Voz WhatsApp)',
    clientName: 'Tony (Renovación Claude 3.5 Sonnet)',
    isAudioCase: true,
    audioDuration: '0:13',
    audioTranscript: 'Qué más compa. Mira que ya te hice la transferencia de 20 mil pesos por Nequi a la llave Bre-V 0087387259 a nombre de Esteban Ávila Sheerit para renovar mi Claude de la fila 180. En el chat me sale un número raro con arroba 1422... ¿Me confirmas porfa si ya quedó activo?',
    realContext: 'Comprobante transferido a la llave oficial Bre-V 0087387259. En el bot sale como LID @142270875582521. Fila 180 de Claude.',
    idealResponse: 'Verificar en el extracto de cuenta bancaria que hayan entrado los $20.000 a la llave Bre-V y asentar la renovación con el comando @bot confirmar 142270875582521.',
    options: [
      {
        label: 'Verificar en los movimientos de la app bancaria de Sheerit que ingresaron los $20.000 a la llave Bre-V 0087387259 y asentar en el grupo con el comando "@bot confirmar 142270875582521" para actualizar la fila 180 de Claude.',
        isCorrect: true,
        explanation: '¡Correcto! Procedimiento exacto de Sheerit: validación bancaria en caja real y asentamiento en Excel usando el LID.'
      },
      {
        label: 'Ejecutar inmediatamente el comando "@bot confirmar 142270875582521" basándose solo en la imagen del comprobante sin revisar la cuenta bancaria para no demorar al cliente.',
        isCorrect: false,
        explanation: 'Fallo operativo grave. Siempre se debe cotejar la entrada de fondos en la app bancaria antes de asentar.'
      },
      {
        label: 'Rechazar la transferencia diciendo que Bre-V no concilia cuentas compartidas de Claude y pedirle que consigne al número de celular personal del asesor.',
        isCorrect: false,
        explanation: 'Grave falta de ética y fraude. 0087387259 es la Llave Bre-V oficial de la empresa.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_audio_sharay',
    category: 'Soporte Cuentas (Nota de Voz WhatsApp)',
    clientName: 'Sharay Manuel (Plan Familiar Microsoft 365)',
    isAudioCase: true,
    audioDuration: '0:11',
    audioTranscript: 'Hola buenas tardes, mira que compré la cuenta de Microsoft 365 con ustedes pero me dieron un correo temporal que no me gusta. ¿Será que puedo cambiarlo por mi correo personal de Hotmail o me toca pagar una cuenta nueva?',
    realContext: 'Cliente activa con Microsoft 365 familiar compartido. Desea asociar su correo personal de Outlook/Hotmail.',
    idealResponse: 'Explicarle con amabilidad que al ser plan familiar se reasigna el cupo enviando una nueva invitación a su correo personal sin cobro extra.',
    options: [
      {
        label: 'Explicarle con amabilidad que en planes familiares Microsoft se puede reasignar el cupo; solicitar su correo personal de Hotmail/Outlook y reenviarle la invitación familiar desde la consola de Microsoft sin costo adicional.',
        isCorrect: true,
        explanation: '¡Excelente! Respuesta empática, rápida y apegada a la política de soporte de planes familiares.'
      },
      {
        label: 'Solicitarle la contraseña de su correo personal de Hotmail para que el asesor ingrese a su cuenta y vincule la suscripción manualmente.',
        isCorrect: false,
        explanation: 'Inadmisible violación de privacidad. Nunca se solicitan contraseñas de correos personales de clientes.'
      },
      {
        label: 'Decirle que los cupos familiares de Microsoft son inmutables por 1 año y que si desea cambiar de correo debe pagar un mes de penalidad.',
        isCorrect: false,
        explanation: 'Cobro indebido. El soporte de correo en planes vigentes es gratuito.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_audio_amazon_tv',
    category: '2FA & Códigos (Nota de Voz WhatsApp)',
    clientName: 'Cliente en Smart TV (Prime Video sheerstreaming@gmail.com)',
    isAudioCase: true,
    audioDuration: '0:12',
    audioTranscript: 'Hermano, buenas tardes. Estoy acá frente al televisor tratando de entrar a Prime Video y me sale un código en pantalla. La cuenta es sheerstreaming@gmail.com, ¿dónde saco ese código o ustedes me lo mandan?',
    realContext: 'La cuenta sheerstreaming@gmail.com tiene "Gmail API (Token Activo)" y "Extracción Activa" en el panel de cuentas.',
    idealResponse: 'Indicarle que presione Continuar en su TV y que el código se extrae al instante en sheerit.co/verificar o por el bot en segundos.',
    options: [
      {
        label: 'Indicarle que presione "Continuar" o "Reenviar código" en su TV y recordarle que puede ver su código al instante en sheerit.co/verificar o esperar 10 segundos la extracción automática del bot vía Gmail API.',
        isCorrect: true,
        explanation: '¡Impecable! Soluciona en tiempo récord usando el ecosistema de autogestión de códigos 2FA de Sheerit.'
      },
      {
        label: 'Entregarle el código de inicio de sesión que llegó al correo hace 3 horas sin verificar si el cliente ya presionó continuar en su pantalla actual.',
        isCorrect: false,
        explanation: 'Error común. Ese código ya expiró y provocará que el televisor arroje error de autenticación.'
      },
      {
        label: 'Entregarle la contraseña del correo Gmail de la empresa para que él mismo ingrese a revisar la bandeja de entrada.',
        isCorrect: false,
        explanation: 'Grave infracción de seguridad que compromete todas las cuentas asociadas a ese correo.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_audio_netflix_hogar',
    category: 'Netflix & Hogar (Nota de Voz WhatsApp)',
    clientName: 'Cristian Prieto (Netflix prime44544@gmail.com)',
    isAudioCase: true,
    audioDuration: '0:12',
    audioTranscript: 'Hola compa, la clave panini26col me dio en Netflix pero ahora me sale en la pantalla del televisor un letrero que dice Este televisor no forma parte de tu Hogar con Netflix. ¿Qué hago ahí?',
    realContext: 'La clave actualizada en el sistema de Sheerit es "panini26col". El código de hogar se autogestiona en sheerit.co/actualizar/ o sheerit.co/verificar.',
    idealResponse: 'Entregar la clave vigente panini26col e indicarle que presione "Estoy de viaje" en el televisor para validar su código en sheerit.co/verificar al instante.',
    options: [
      {
        label: 'Indicarle que en su pantalla seleccione "Estoy de viaje / Ver temporalmente" y consulte su código de hogar al instante en sheerit.co/verificar para habilitar el televisor de inmediato.',
        isCorrect: true,
        explanation: '¡Impecable! Procedimiento estándar de Sheerit para códigos temporales de hogar en Smart TV.'
      },
      {
        label: 'Entregarle un correo y clave de otra cuenta de Netflix diferente sin registrar el cambio ni consultar la disponibilidad en el Excel maestro.',
        isCorrect: false,
        explanation: 'Genera descuadre grave de perfiles y sobrecupo en otras cuentas.'
      },
      {
        label: 'Decirle que Netflix ya no permite perfiles en televisores y que para ver en TV debe pagar una suscripción exclusiva de pantalla completa de $40.000.',
        isCorrect: false,
        explanation: 'Información falsa. Las cuentas de Sheerit cuentan con soporte para televisores.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_wiki_tarjeta_temporal',
    category: 'Reglas Operativas Wiki Sheerit (Confidencial)',
    clientName: 'Caso Interno de Inventario (Excel Maestro)',
    isAudioCase: false,
    clientMessage: 'Un cliente frecuente te escribe por WhatsApp diciendo: "Compa, me gustó mucho el servicio, quiero renovar de una vez por 6 meses completos por adelantado, hazme una rebajita". Al abrir el Excel maestro de Sheerit, ves que su cuenta asignada está con fondo ROJO y tiene la etiqueta "Tarjeta Temporal".',
    realContext: 'Según la Wiki interna de Sheerit: Las cuentas marcadas con fondo rojo y "Tarjeta Temporal" se pagan con tarjetas bancarias virtuales desechables que expiran en 30 días.',
    idealResponse: 'Explicarle con amabilidad que esa cuenta específica solo se puede renovar mes a mes porque el proveedor bancario rota los métodos de pago mensualmente; no se pueden vender paquetes largos en cuentas temporales.',
    options: [
      {
        label: 'Explicarle que esa cuenta solo puede renovarse mes a mes (máximo 30 días) porque opera con tarjeta bancaria temporal; está estrictamente prohibido vender paquetes largos en cuentas temporales según la Wiki de Sheerit.',
        isCorrect: true,
        explanation: '¡Excelente! Aplica la regla confidencial de Sheerit: las cuentas con tarjetas temporales no garantizan estabilidad a largo plazo y nunca deben venderse por periodos extendidos.'
      },
      {
        label: 'Aceptar el pago de los 6 meses pero anotar en la columna de observaciones que el cliente asume el riesgo si la tarjeta se cancela antes.',
        isCorrect: false,
        explanation: 'Grave falta operativa. Si la cuenta cae, la empresa asume un reembolso o reposición no presupuestada.'
      },
      {
        label: 'Aceptar el dinero de los 6 meses y cambiar el color de la celda de rojo a verde en Excel para que no salte en los reportes.',
        isCorrect: false,
        explanation: 'Alteración fraudulenta del inventario.'
      }
    ],
    difficulty: 'Difícil'
  },
  {
    id: 'case_lid_whatsapp_protocol',
    category: 'Sistemas Internos Whatbot (Confidencial)',
    clientName: 'Protocolo de Identificadores LID WhatsApp',
    isAudioCase: false,
    clientMessage: 'En el chat de soporte de WhatsApp Web entra un comprobante de pago de un cliente recurrente. Al revisar el remitente, no se observa su número habitual +57... sino una cadena alfanumérica que inicia con "@142270875582521".',
    realContext: 'WhatsApp Web genera identificadores Linked Identity (LID) cuando los usuarios configuran privacidad avanzada o canales. El bot de Sheerit admite el comando @bot confirmar <LID>.',
    idealResponse: 'Reconocer que es un LID de WhatsApp válido, validar el pago en banco y usar @bot confirmar 142270875582521 para procesarlo.',
    options: [
      {
        label: 'Reconocer que es un LID (Linked Identity) legítimo de WhatsApp; verificar el dinero en la app bancaria y ejecutar el comando citando el LID ("@bot confirmar 142270875582521") para asentar la venta en Excel sin trabas.',
        isCorrect: true,
        explanation: '¡Totalmente acertado! Muestra comprensión técnica del sistema de bots y manejo de privacidad en WhatsApp Web.'
      },
      {
        label: 'Asentar la venta manualmente en una fila vacía de Excel inventando un número de teléfono de 10 dígitos para evitar usar el LID.',
        isCorrect: false,
        explanation: 'Descuadra la relación de clientes y duplica registros en el sistema.'
      },
      {
        label: 'Exigirle al cliente que llame por línea telefónica tradicional para validar su número antes de poder procesarle la renovación.',
        isCorrect: false,
        explanation: 'Mala atención y falta de conocimiento técnico del ecosistema WhatsApp.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_fonseca_overdue',
    category: 'Finanzas & Cobranzas (Confidencial)',
    clientName: 'Jorge Fonseca (Renovado en Excel hasta 2027)',
    isAudioCase: false,
    clientMessage: 'Jorge Fonseca escribe furioso: "Oigan, me acaba de llegar un mensaje del bot diciendo que mi cuenta vence hoy y me la van a cortar si no pago ya, pero yo pagué el plan anual hace 2 semanas hasta 2027. ¡Son unos estafadores!"',
    realContext: 'En Excel el cliente ya tiene vencimiento en 2027, pero Columna4 o un trigger viejo tenía fecha anterior.',
    idealResponse: 'Verificar en el panel o Excel que efectivamente tiene pago hasta 2027, pedirle disculpas por el aviso automático desactualizado y asegurarle que su servicio está 100% blindado y activo.',
    options: [
      {
        label: 'Cotejar de inmediato la columna "vencimiento" en Excel; al verificar que está pago hasta 2027, pedirle disculpas explicando que fue un aviso automático desactualizado y darle total tranquilidad de que su servicio está blindado.',
        isCorrect: true,
        explanation: '¡Excelente gestión! Calma al cliente, valida los datos reales y corrige el error con total transparencia.'
      },
      {
        label: 'Decirle que como el bot ya generó el cobro debe pagar el mes corriente y que ese valor se le descontará en el año 2027.',
        isCorrect: false,
        explanation: 'Cobro indebido gravísimo que destruye la reputación de la empresa.'
      },
      {
        label: 'Modificar la fecha de vencimiento en Excel a la fecha de hoy para cuadrarla con lo que le dijo el bot al cliente.',
        isCorrect: false,
        explanation: 'Alteración injustificada de registros contables ya pagados.'
      }
    ],
    difficulty: 'Difícil'
  },
  {
    id: 'case_audio_youtube_family',
    category: 'YouTube Premium & Familias (Nota de Voz WhatsApp)',
    clientName: 'Cliente con Error en YouTube Premium',
    isAudioCase: true,
    audioDuration: '0:14',
    audioTranscript: 'Buenas tardes, me llegó la invitación de YouTube al correo pero cuando le doy unirme a la familia me sale un error que dice: Parece que no estás en el mismo país que el administrador de la familia. ¿Qué tengo que hacer?',
    realContext: 'Google detecta discrepancia de país en el perfil de pagos de Google Pay (payments.google.com).',
    idealResponse: 'Explicar que Google detecta perfiles de pago antiguos; guiarlo a payments.google.com para eliminar perfiles viejos o usar un correo nuevo sin historial de país.',
    options: [
      {
        label: 'Explicarle que Google detecta discrepancia en su perfil de pagos de Google Pay; indicarle cómo eliminar perfiles antiguos en payments.google.com o sugerirle un correo nuevo sin historial de país para unirse en 1 minuto.',
        isCorrect: true,
        explanation: '¡Impecable! Solución técnica definitiva para el error de país en grupos familiares de Google.'
      },
      {
        label: 'Indicarle que instale una VPN en su celular, se conecte a Estados Unidos y vuelva a hacer clic en el enlace.',
        isCorrect: false,
        explanation: 'Grave error. Las VPNs activan alarmas de fraude en Google y provocan baneos del grupo familiar.'
      },
      {
        label: 'Pasarle las credenciales maestras del correo administrador del grupo familiar para que él mismo se apruebe.',
        isCorrect: false,
        explanation: 'Vulneración total de seguridad de la cuenta de la empresa.'
      }
    ],
    difficulty: 'Difícil'
  },
  {
    id: 'case_disney_profile_pin',
    category: 'Soporte Disney+ & Perfiles',
    clientName: 'Cliente Disney+ (sheerstreaming@gmail.com)',
    isAudioCase: false,
    clientMessage: 'Un cliente escribe: "Buenas tardes, ingresé a la cuenta de Disney+ pero todos los perfiles tienen nombres de otras personas y además tienen PIN de bloqueo. ¿En cuál me meto?"',
    realContext: 'En el Excel maestro cada pantalla tiene un número asignado (Pantalla 1 a Pantalla 4). A veces otro cliente pone PIN por error.',
    idealResponse: 'Cotejar en el Excel el número de pantalla asignado al cliente; ingresar a la cuenta para restablecer el PIN o reubicar al cliente ordenadamente sin alterar a los demás.',
    options: [
      {
        label: 'Verificar en el Excel el número exacto de pantalla asignado al cliente; ingresar a la cuenta para retirar el PIN no autorizado o reasignarle un perfil libre garantizado sin sobrecupo.',
        isCorrect: true,
        explanation: '¡Correcto! Mantiene el orden estricto de cupos en el Excel y soluciona el acceso del cliente.'
      },
      {
        label: 'Decirle al cliente que entre a cualquier perfil que no tenga PIN y le cambie el nombre al de él sin consultar el Excel.',
        isCorrect: false,
        explanation: 'Causa caos en el inventario y borra el historial de visualización de otro cliente activo.'
      },
      {
        label: 'Decirle que Disney permite máximo 2 personas por cuenta y que le toca turnarse la pantalla con otro cliente.',
        isCorrect: false,
        explanation: 'Información falsa y pésima atención.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_fake_brev_key',
    category: 'Anti-Fraude Bancario & Bre-V',
    clientName: 'Cliente con Comprobante Bancario Sospechoso',
    isAudioCase: false,
    clientMessage: 'Un cliente envía un comprobante de Bancolombia por $25.000 diciendo que ya pagó, pero al revisar el destinatario dice: "Transferido a la llave Bre-V 0038472910 a nombre de Carlos Pérez".',
    realContext: 'La llave Bre-V oficial de Sheerit es exclusivamente 0087387259 a nombre de Esteban Ávila. El cliente transfirió a otra persona o es comprobante manipulado.',
    idealResponse: 'Informarle respetuosamente que ese número y titular no corresponden a Sheerit y no entregar credenciales hasta que el dinero esté en las cuentas oficiales.',
    options: [
      {
        label: 'Informarle con respeto que la transferencia fue enviada a un número y titular ajeno a Sheerit (la llave oficial es 0087387259); no entregar credenciales hasta que los fondos ingresen a las cuentas oficiales de la empresa.',
        isCorrect: true,
        explanation: '¡Excelente filtro de seguridad! Previene estafas y fugas de inventario.'
      },
      {
        label: 'Entregarle el servicio por 48 horas de cortesía de buena fe mientras el cliente averigua a quién le mandó la plata.',
        isCorrect: false,
        explanation: 'Fuga directa de capital y cuentas de la empresa.'
      },
      {
        label: 'Ejecutar el comando @bot confirmar con el número de transacción del comprobante para que el bot lo resuelva.',
        isCorrect: false,
        explanation: 'Provoca descuadres contables y registro de pagos inexistentes.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_audio_max_expired',
    category: 'Streaming & Proveedores (Nota de Voz WhatsApp)',
    clientName: 'Cliente con Cuenta Max (HBO) Caída',
    isAudioCase: true,
    audioDuration: '0:13',
    audioTranscript: 'Buenas tardes amigos de Sheerit, estoy intentando ver Juego de Tronos en Max pero me sale que mi suscripción ha caducado, y me quedan todavía 15 días del mes que les compré.',
    realContext: 'A veces los proveedores rotan o demoran la renovación de la cuenta madre de Max.',
    idealResponse: 'Verificar la vigencia del cliente en Excel y migrarlo inmediatamente a una cuenta activa en stock para no dejarlo sin servicio, reportando la cuenta caída en el grupo interno.',
    options: [
      {
        label: 'Verificar en Excel que el cliente tiene días vigentes; migrarlo de inmediato a una cuenta activa disponible en stock para que no se quede sin servicio y reportar la cuenta caída en el grupo interno.',
        isCorrect: true,
        explanation: '¡Atención de primer nivel! Prioriza la continuidad del cliente y canaliza la falla técnica internamente.'
      },
      {
        label: 'Decirle al cliente que debe esperar hasta el próximo lunes que el proveedor mayorista abra atención para poder revisarle.',
        isCorrect: false,
        explanation: 'Mala atención. Un cliente con plan vigente nunca debe quedar días sin servicio.'
      },
      {
        label: 'Decirle que Max cambió de plataforma y que debe pagar una recarga de $10.000 para actualizar el perfil.',
        isCorrect: false,
        explanation: 'Cobro indebido y engañoso.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_venta_directa_panel',
    category: 'Operaciones de Panel Web Sheerit',
    clientName: 'Registro de Venta en "Registrar Venta Directa"',
    isAudioCase: false,
    clientMessage: 'Al abrir el modal "Registrar Venta Directa", ingresas el número del cliente y presionas "Verificar". El sistema responde en azul: "ℹ️ No se encontraron servicios activos para este número. Procediendo como Venta Nueva".',
    realContext: 'Mensaje normal para clientes primerizos. El asesor debe completar nombre, elegir servicio, método de pago y monto real recibido.',
    idealResponse: 'Completar el nombre, seleccionar el servicio en el combobox tipeable, registrar el método de pago con el valor real y guardar para que asigne cupo en stock.',
    options: [
      {
        label: 'Completar el nombre, seleccionar la plataforma en el combobox tipeable, registrar método de pago y monto cobrado, y confirmar para que el sistema asigne el cupo disponible en stock.',
        isCorrect: true,
        explanation: '¡Perfecto! Registra el cliente nuevo en la base de datos y asienta el ingreso en caja real.'
      },
      {
        label: 'Cancelar el registro porque el verificador no encontró al cliente en la base histórica.',
        isCorrect: false,
        explanation: 'El mensaje de Venta Nueva es el flujo normal para clientes que compran por primera vez.'
      },
      {
        label: 'Ponerle monto cobrado $0 COP para evitar que el registro afecte la contabilidad del mes.',
        isCorrect: false,
        explanation: 'Provoca descuadre en los reportes de caja e ingresos mensuales.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_solicitud_clave_maestra',
    category: 'Seguridad de la Información & Privacidad',
    clientName: 'Cliente Corporativo Exigiendo Datos Maestros',
    isAudioCase: false,
    clientMessage: 'Un cliente corporativo te escribe: "Hola, necesito que me des el correo y la contraseña maestra de la cuenta para que el contador de mi empresa revise el historial de cobros de Netflix directamente en la plataforma".',
    realContext: 'En planes compartidos o de reventa está terminantemente prohibido entregar credenciales de administración del correo maestro.',
    idealResponse: 'Explicar con amabilidad que por seguridad de cuentas compartidas no se entregan claves maestras, y ofrecerle el recibo/comprobante oficial interno emitido por Sheerit.',
    options: [
      {
        label: 'Explicar con amabilidad que por políticas de seguridad y protección de datos de cuentas compartidas no se suministran claves maestras; ofrecerle emitir el comprobante y recibo oficial de compra expedido por Sheerit.',
        isCorrect: true,
        explanation: '¡Excelente gestión! Protege los activos de la empresa sin descuidar la necesidad contable del cliente.'
      },
      {
        label: 'Entregarle la contraseña del correo maestro de Gmail con la condición de que prometa por chat no cambiarla.',
        isCorrect: false,
        explanation: 'Grave falta de seguridad. El cliente podría cambiar la clave y secuestrar todas las pantallas asociadas.'
      },
      {
        label: 'Decirle que en Sheerit no se manejan comprobantes porque las ventas son 100% anónimas e informales.',
        isCorrect: false,
        explanation: 'Daña la imagen corporativa y la formalidad de la empresa.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_irene_gemini_search',
    category: 'Búsqueda Rápida en Clientes (Base de Datos)',
    clientName: 'Irene Carlona (Consulta Gemini discoveryrelesbiana@gmail.com)',
    isAudioCase: false,
    clientMessage: 'Irene Carlona te escribe preguntando cuándo se le vence su Gemini compartido (correo discoveryrelesbiana@gmail.com). Hay más de 1.000 clientes activos en la base de datos.',
    realContext: 'El panel web cuenta con buscador en tiempo real por cliente, correo o plataforma con bloques de color.',
    idealResponse: 'Tipear "Irene" o "discoveryrelesbiana" en el buscador de la base de datos para ubicar su cuenta y confirmarle su fecha de vencimiento en segundos.',
    options: [
      {
        label: 'Tipear "Irene" o "discoveryrelesbiana" en el buscador de clientes del panel para ubicar su bloque de cuenta de color y responderle con exactitud en menos de 10 segundos.',
        isCorrect: true,
        explanation: '¡Impecable! Utiliza las herramientas de búsqueda instantánea para dar respuesta rápida y certera.'
      },
      {
        label: 'Descargar el archivo Excel completo en un computador personal, buscar con Ctrl+F y volver a subir el archivo modificado.',
        isCorrect: false,
        explanation: 'Procedimiento lento y riesgoso que puede sobreescribir datos concurrentes en OneDrive.'
      },
      {
        label: 'Pedirle a la clienta que busque el comprobante bancario de hace meses porque en el sistema no se puede buscar por nombre.',
        isCorrect: false,
        explanation: 'Mala práctica. El sistema cuenta con buscador en tiempo real optimizado.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_audio_spotify_link',
    category: 'Spotify Familiar & Enlaces (Nota de Voz WhatsApp)',
    clientName: 'Cliente con Invitación Spotify Expirada',
    isAudioCase: true,
    audioDuration: '0:12',
    audioTranscript: 'Hola, mira que me mandaste el link de Spotify pero cuando le doy clic dice que la invitación ya expiró o alcanzó el límite de intentos. ¿Me puedes ayudar?',
    realContext: 'Los enlaces de invitación de Spotify caducan si no se aceptan a tiempo. Se debe generar uno nuevo y confirmar la dirección física del plan.',
    idealResponse: 'Generar un enlace fresco desde la consola de Spotify, recordar la dirección postal de la familia y enviárselo para que ingrese sin error.',
    options: [
      {
        label: 'Generar un nuevo enlace de invitación fresco desde la consola de Spotify Familiar, recordarle la dirección física registrada de la familia y enviárselo de inmediato para que complete el ingreso.',
        isCorrect: true,
        explanation: '¡Perfecto! Soluciona la expiración del enlace y asegura que el cliente coincida con la dirección familiar.'
      },
      {
        label: 'Decirle que si el enlace expiró debe pagar $5.000 COP adicionales por costos administrativos de reactivación.',
        isCorrect: false,
        explanation: 'Cobro abusivo y prohibido en Sheerit.'
      },
      {
        label: 'Indicarle que cambie la región de su cuenta de Spotify a Turquía o Filipinas para que lo deje entrar sin link.',
        isCorrect: false,
        explanation: 'Causa bloqueo permanente de la cuenta de Spotify del cliente.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_dark_mode_ocr_voucher',
    category: 'Validación de Comprobantes & OCR',
    clientName: 'Comprobante Bancario en Modo Oscuro',
    isAudioCase: false,
    clientMessage: 'Un cliente envía una captura de pago por Nequi en modo oscuro con fondos negros. El bot automático no pudo extraer el texto y te transfirió el ticket a revisión humana.',
    realContext: 'Los comprobantes en modo oscuro pueden no ser leídos al 100% por OCR pero son válidos tras revisión manual de número de referencia y extracto.',
    idealResponse: 'Abrir la imagen, verificar fecha, valor transferido, número de referencia y corroborar la entrada del dinero en la app bancaria antes de confirmar.',
    options: [
      {
        label: 'Abrir la imagen, verificar número de referencia, fecha y monto, y corroborar el ingreso efectivo en los movimientos de la app bancaria de Sheerit antes de asentar la renovación.',
        isCorrect: true,
        explanation: '¡Excelente! Manejo riguroso del protocolo de verificación manual para comprobantes no procesados por OCR.'
      },
      {
        label: 'Rechazar el comprobante de inmediato argumentando que si el bot no lo leyó en automático es un comprobante falso.',
        isCorrect: false,
        explanation: 'Falso rechazo. El modo oscuro o tipografías personalizadas requieren verificación humana normal.'
      },
      {
        label: 'Asentar la venta en el bot a ciegas sin cotejar con la app bancaria para que el ticket no quede abierto mucho tiempo.',
        isCorrect: false,
        explanation: 'Grave riesgo de aceptar comprobantes fraudulentos o ya utilizados.'
      }
    ],
    difficulty: 'Medio'
  }
];

// FUNCIÓN DE BARAJE ALEATORIO (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const AdvisorSkillTest: React.FC = () => {
  // Estado de evaluación
  const [step, setStep] = useState<'profile' | 'test' | 'completed'>('profile');
  
  // Datos del postulante y condiciones especiales
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');
  const [hasDyslexia, setHasDyslexia] = useState(false);
  const [hasADHD, setHasADHD] = useState(false);
  const [hasVisualFatigue, setHasVisualFatigue] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  
  // Control Anti-Trampa (Detección de cambio de pestaña / Blur / IA externa)
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);

  // Reproductor de Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1.0);
  const [audioProgressSeconds, setAudioProgressSeconds] = useState(0);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pool dinámico de casos seleccionados para esta sesión (8 casos aleatorios con opciones barajadas)
  const [activeSessionCases, setActiveSessionCases] = useState<RealCase[]>([]);

  // Examen
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answersTimeSpent, setAnswersTimeSpent] = useState<Record<number, number>>({});
  const [caseStartTime, setCaseStartTime] = useState<number>(Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [passedCleanly, setPassedCleanly] = useState(false);

  // Ajuste de tiempo por dislexia/condición cognitiva (45s base vs 65s adaptado)
  const baseSecondsPerQuestion = hasDyslexia ? 65 : 45;

  // DETECCIÓN ANTI-TRAMPA: Escuchar pérdida de visibilidad o cambio de pestaña
  useEffect(() => {
    if (step !== 'test') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchesCount(prev => {
          const next = prev + 1;
          setShowCheatingWarning(true);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchesCount(prev => {
        const next = prev + 1;
        setShowCheatingWarning(true);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [step]);

  // CRONÓMETRO DE PREGUNTAS
  useEffect(() => {
    if (step !== 'test') return;

    // Detener cualquier audio previo al cambiar de caso
    stopSpeechAudio();

    setSecondsRemaining(baseSecondsPerQuestion);
    setCaseStartTime(Date.now());

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Auto avance por tiempo agotado
          handleSelectOption(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSpeechAudio();
    };
  }, [step, currentCaseIndex, baseSecondsPerQuestion]);

  // FUNCIÓN DE REPRODUCCIÓN POR VOZ (Web Speech API)
  const playSpeechAudio = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Tu navegador no soporta síntesis de voz. Por favor usa Google Chrome, Edge o Safari.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO'; // Español Colombia
    utterance.rate = audioPlaybackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioProgressSeconds(0);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        setAudioProgressSeconds(p => p + 1);
      }, 1000);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeechAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setAudioProgressSeconds(0);
  };

  const toggleAudio = (transcript?: string) => {
    if (!transcript) return;
    if (isPlayingAudio) {
      stopSpeechAudio();
    } else {
      playSpeechAudio(transcript);
    }
  };

  // INICIAR PRUEBA: SELECCIÓN Y BARAJE DINÁMICO DE CASOS Y OPCIONES
  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorName.trim() || !advisorPhone.trim()) {
      alert("Por favor completa tu Nombre y WhatsApp/Celular para iniciar.");
      return;
    }

    // 1. Separar casos de audio y texto
    const audioCases = MASTER_CASES_BANK.filter(c => c.isAudioCase);
    const textCases = MASTER_CASES_BANK.filter(c => !c.isAudioCase);

    // 2. Barajar y tomar 3 de audio y 5 de texto (8 casos en total por intento)
    const shuffledAudio = shuffleArray(audioCases).slice(0, 3);
    const shuffledText = shuffleArray(textCases).slice(0, 5);

    // 3. Unir y barajar el orden de los casos
    const combinedSessionCases = shuffleArray([...shuffledAudio, ...shuffledText]).map(c => ({
      ...c,
      // Barajar dinámicamente las opciones de cada pregunta para que la respuesta correcta nunca esté en la misma letra
      options: shuffleArray(c.options)
    }));

    setActiveSessionCases(combinedSessionCases);
    setCurrentCaseIndex(0);
    setSelectedAnswers({});
    setAnswersTimeSpent({});
    setTabSwitchesCount(0);
    setShowCheatingWarning(false);
    setStep('test');
  };

  const handleSelectOption = (optionIndex: number) => {
    stopSpeechAudio();

    const timeSpent = Math.max(1, Math.round((Date.now() - caseStartTime) / 1000));
    const nextAnswers = { ...selectedAnswers, [currentCaseIndex]: optionIndex };
    const nextTimes = { ...answersTimeSpent, [currentCaseIndex]: timeSpent };

    setSelectedAnswers(nextAnswers);
    setAnswersTimeSpent(nextTimes);

    if (currentCaseIndex < activeSessionCases.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      // Finalizar examen y enviar a MySQL
      finishAndSubmitEvaluation(nextAnswers, nextTimes, activeSessionCases);
    }
  };

  const finishAndSubmitEvaluation = async (
    answers: Record<number, number>, 
    times: Record<number, number>,
    casesTaken: RealCase[]
  ) => {
    setIsSubmitting(true);

    let correctCount = 0;
    let audioCorrectCount = 0;
    let totalTime = 0;

    casesTaken.forEach((c, idx) => {
      const selectedIdx = answers[idx];
      const isCorrect = selectedIdx !== undefined && selectedIdx !== -1 && c.options[selectedIdx]?.isCorrect;
      if (isCorrect) {
        correctCount++;
        if (c.isAudioCase) audioCorrectCount++;
      }
      totalTime += (times[idx] || 0);
    });

    const accuracy = Math.round((correctCount / casesTaken.length) * 100);
    const audioScore = Math.round((audioCorrectCount / 3) * 100);
    const avgTime = Math.round(totalTime / casesTaken.length);

    setFinalAccuracy(accuracy);
    setPassedCleanly(accuracy >= 80 && !hasDyslexia && tabSwitchesCount < 3);

    const questionsBreakdown = casesTaken.map((c, idx) => {
      const selectedIdx = answers[idx];
      const isCorrect = selectedIdx !== undefined && selectedIdx !== -1 && c.options[selectedIdx]?.isCorrect;
      const chosenLabel = (selectedIdx !== undefined && selectedIdx !== -1)
        ? c.options[selectedIdx]?.label
        : 'Sin respuesta (Tiempo agotado)';
      const correctOpt = c.options.find(o => o.isCorrect);

      return {
        id: c.id,
        category: c.category,
        clientName: c.clientName,
        isAudio: c.isAudioCase,
        prompt: c.clientMessage || c.audioTranscript || '',
        chosenAnswer: chosenLabel,
        isCorrect: Boolean(isCorrect),
        correctAnswer: correctOpt?.label || '',
        explanation: correctOpt?.explanation || '',
        timeSpentSeconds: times[idx] || 0
      };
    });

    // Preparar payload para la base de datos de contratación
    const payload = {
      candidateName: advisorName,
      candidateEmail: advisorEmail,
      candidatePhone: advisorPhone,
      hasDyslexia,
      hasADHD,
      hasVisualFatigue,
      medicalNotes,
      totalScore: accuracy,
      accuracyRate: accuracy,
      totalTimeTaken: totalTime,
      averageTimePerCase: avgTime,
      tabSwitchesCount,
      audioCasesScore: audioScore,
      casesCount: casesTaken.length,
      answers: {
        raw: answers,
        timesSpent: times,
        cheatingTabSwitches: tabSwitchesCount,
        caseIdsTaken: casesTaken.map(c => c.id),
        detailedBreakdown: questionsBreakdown
      }
    };

    try {
      const apiHost = window.location.hostname.includes('sheerit.co') 
        ? 'https://sheerit.co' 
        : 'http://localhost:3000';

      await fetch(`${apiHost}/api/public/advisor-test/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Error enviando evaluación a servidor:", e);
    } finally {
      setIsSubmitting(false);
      setStep('completed');
    }
  };

  const currentCase = activeSessionCases[currentCaseIndex] || MASTER_CASES_BANK[0];

  return (
    <div 
      className="max-w-4xl mx-auto px-4 py-8 select-none"
      onCopy={(e) => { e.preventDefault(); }}
      onContextMenu={(e) => { e.preventDefault(); }}
    >
      {/* Header Institucional de Selección */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 sm:p-8 rounded-3xl shadow-xl mb-6 border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <Shuffle className="w-3.5 h-3.5" />
            <span>Banco de 16 Casos Dinámicos · Evaluación Anti-Copia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Prueba Técnica de Contratación: Soporte Sheerit
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Casos y opciones alternadas aleatoriamente en cada sesión. Incluye escucha activa de notas de voz de WhatsApp, precisión en credenciales y reglas confidenciales de la Wiki Sheerit.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ALERTA VISUAL ANTI-TRAMPA (Si el postulante cambia de pestaña o consulta IA) */}
      {showCheatingWarning && step === 'test' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-300 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-200">
                ⚠️ Advertencia de Selección: Has cambiado de ventana o pestaña ({tabSwitchesCount} intento/s detectado/s).
              </p>
              <p className="text-[11px] text-rose-300/80">
                Las salidas de la prueba quedan registradas en tu perfil de postulación como sospecha de consulta externa con IA o terceros.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowCheatingWarning(false)}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/40 rounded-lg text-rose-200"
          >
            Entendido
          </button>
        </div>
      )}

      {/* PASO 1: Formulario de Perfil y Declaración Médica */}
      {step === 'profile' && (
        <form onSubmit={handleStartTest} className="bg-white dark:bg-gray-800 p-7 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <span>1. Registro del Postulante</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ingresa tus datos de contacto reales para que el equipo de Selección pueda comunicarse contigo si clasificas a entrevista.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={e => setAdvisorName(e.target.value)}
                placeholder="Ej. Melissa Diagama"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                WhatsApp / Celular *
              </label>
              <input
                type="tel"
                value={advisorPhone}
                onChange={e => setAdvisorPhone(e.target.value)}
                placeholder="Ej. 3123456789"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={advisorEmail}
                onChange={e => setAdvisorEmail(e.target.value)}
                placeholder="postulante@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sección de Declaración de Condiciones Médicas / Cognitivas */}
          <div className="pt-4 border-t border-gray-150 dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Declaración de Idoneidad para Chat en Vivo y Digitación
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El rol requiere digitar contraseñas complejas, correos y llaves bancarias sin inversión de letras ni números bajo alta velocidad de chat.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasDyslexia 
                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Dislexia</span>
                  <input
                    type="checkbox"
                    checked={hasDyslexia}
                    onChange={e => setHasDyslexia(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Dificultad neurobiológica en procesamiento fonológico, reconocimiento preciso de palabras escritas, ortografía y decodificación de números o caracteres.
                </span>
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasADHD 
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                  : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">TDAH / Atención</span>
                  <input
                    type="checkbox"
                    checked={hasADHD}
                    onChange={e => setHasADHD(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Sobrecarga de estímulos en situaciones de múltiples chats simultáneos.
                </span>
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasVisualFatigue 
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                  : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Fatiga Visual</span>
                  <input
                    type="checkbox"
                    checked={hasVisualFatigue}
                    onChange={e => setHasVisualFatigue(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Sensibilidad a pantallas prolongadas o necesidad de alto contraste.
                </span>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Instrucciones de Seguridad de la Prueba:</span>
            </p>
            <p>
              • Se seleccionarán <b>8 casos dinámicos</b> de nuestro banco de 16 situaciones operativas.<br />
              • Cada pregunta tiene un límite estricto de {baseSecondsPerQuestion} segundos.<br />
              • Las opciones y preguntas cambian aleatoriamente en cada intento para evitar memorizaciones o copias.<br />
              • Si cambias de pestaña o sales de la ventana para consultar herramientas externas, la plataforma registrará el evento para el evaluador.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Comenzar Prueba de Selección Dinámica</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASO 2: Examen en Vivo con Notas de Voz y Cronómetro */}
      {step === 'test' && (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg space-y-6">
          {/* Barra Superior: Progreso y Cronómetro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150 dark:border-gray-700">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Caso #{currentCaseIndex + 1} de {activeSessionCases.length} · {currentCase.category}
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {currentCase.clientName}
              </h2>
            </div>

            {/* Cronómetro Visual */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-sm font-black border transition-colors ${
              secondsRemaining <= 10 
                ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</span>
            </div>
          </div>

          {/* CUERPO DEL CASO: REPRODUCTOR DE NOTA DE VOZ WHATSAPP O TEXTO */}
          {currentCase.isAudioCase ? (
            <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    🎧 Nota de Voz Entrante de WhatsApp
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-500 font-mono">
                  Duración: {currentCase.audioDuration}
                </span>
              </div>

              {/* Reproductor de Audio Visual tipo WhatsApp */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 shadow-sm flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleAudio(currentCase.audioTranscript)}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Forma de onda animada */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1 h-8">
                    {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85, 30, 95, 60, 40, 80, 50, 70, 90, 35, 65, 80, 50, 90].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlayingAudio 
                            ? 'bg-emerald-500 animate-pulse' 
                            : 'bg-gray-300 dark:bg-gray-650'
                        }`}
                        style={{ height: `${isPlayingAudio ? Math.min(100, h * 0.9) : Math.max(20, h * 0.4)}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>{isPlayingAudio ? `0:0${audioProgressSeconds}` : '0:00'}</span>
                    <span>{currentCase.audioDuration}</span>
                  </div>
                </div>

                {/* Control de velocidad */}
                <button
                  type="button"
                  onClick={() => {
                    const nextRate = audioPlaybackRate === 1.0 ? 1.5 : 1.0;
                    setAudioPlaybackRate(nextRate);
                    if (isPlayingAudio) {
                      stopSpeechAudio();
                      playSpeechAudio(currentCase.audioTranscript || '');
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                >
                  {audioPlaybackRate}x
                </button>
              </div>

              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 font-medium text-center">
                Presiona <b>Reproducir</b> para escuchar la solicitud hablada del cliente y resolver el caso.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                💬 Situación en Chat de Soporte
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-150 leading-relaxed">
                {currentCase.clientMessage}
              </p>
            </div>
          )}

          {/* PREGUNTA Y OPCIONES BARAJADAS */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>¿Cuál es el procedimiento operativo obligatorio para resolver esta solicitud?</span>
            </h3>

            <div className="space-y-2.5">
              {currentCase.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                      {opt.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {currentCaseIndex === activeSessionCases.length - 1 && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2.5 animate-pulse">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>Último Caso (8 de 8): Al hacer clic en tu respuesta, la prueba se procesará y enviará automáticamente.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: CONFIRMACIÓN DE ENTREGA AL POSTULANTE (100% CONFIDENCIAL / SIN SOLUCIONARIO) */}
      {step === 'completed' && (
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              ¡Evaluación Técnica Registrada con Éxito!
            </h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Candidato: <span className="font-bold text-gray-900 dark:text-white">{advisorName}</span> · Celular: <span className="font-bold text-gray-900 dark:text-white">{advisorPhone}</span>
            </p>
          </div>

          {/* Tarjeta de Aprobación y Enlace de Contacto Inmediato */}
          {passedCleanly ? (
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 max-w-lg mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>¡PUNTAJE DESTACADO: {finalAccuracy}% DE PRECISIÓN!</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                Has superado con éxito todos los casos técnicos y notas de voz. Comunícate directamente con nuestro equipo de Talento Humano para continuar con tu proceso:
              </p>
              <a
                href={`https://wa.me/573118587974?text=${encodeURIComponent(
                  `¡Hola! Acabo de finalizar la prueba técnica de selección en sheerit.co/evaluacion con un puntaje del ${finalAccuracy}%. Mi nombre es ${advisorName} (+57 ${advisorPhone}). Quedo atento a la entrevista técnica.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Contactar a Selección por WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-gray-600 dark:text-gray-300 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Proceso de Selección Sheerit</span>
              </div>
              <p>
                Tus respuestas, tiempo de respuesta por nota de voz y precisión en credenciales han sido transmitidos de forma segura y confidencial a la base de datos del equipo evaluador.
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Por políticas de seguridad y transparencia del proceso de selección, los resultados numéricos y auditoría de casos son de uso exclusivo del comité de contratación. Si tu perfil cumple con los estándares del cargo, te contactaremos directamente a tu WhatsApp.
              </p>
            </div>
          )}

          <div className="pt-2">
            <a
              href="https://sheerit.co"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition-all"
            >
              Volver al Portal Sheerit
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
