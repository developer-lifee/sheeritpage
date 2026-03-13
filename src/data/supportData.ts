export interface SupportIssue {
  id: string;
  title: string;
  image: string;
  whatsappMessage: string;
}

export interface SupportPlatform {
  id: string;
  name: string;
  logo: string;
  issues: SupportIssue[];
}

export const supportData: SupportPlatform[] = [
  {
    id: "netflix",
    name: "Netflix",
    logo: "/img/Netflix_Logo.png",
    issues: [
      {
        id: "codigo_acceso",
        title: "Código de acceso",
        image: "/errores_img/codigo_netflix.png",
        whatsappMessage: "Hola, necesito ayuda con un código de acceso para Netflix."
      },
      {
        id: "actualizacion_hogar",
        title: "Actualización de hogar",
        image: "/errores_img/actualizacion_netflix.png",
        whatsappMessage: "Hola, me aparece el mensaje de actualización de hogar en Netflix."
      },
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_netflix.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con mi cuenta de Netflix."
      },
      {
        id: "sin_premium",
        title: "Sin premium",
        image: "/errores_img/suscripcion_netflix.png",
        whatsappMessage: "Hola, mi cuenta de Netflix aparece sin la suscripción premium activa."
      },
      {
        id: "perfil_faltante",
        title: "No está tu perfil",
        image: "/errores_img/perfiles_netflix.png",
        whatsappMessage: "Hola, no encuentro mi perfil en la cuenta de Netflix."
      }
    ]
  },
  {
    id: "disney",
    name: "Disney+",
    logo: "/img/Disney_Logo.png",
    issues: [
      {
        id: "codigo_acceso",
        title: "Código de acceso",
        image: "/errores_img/codigo_disney.png",
        whatsappMessage: "Hola, necesito ayuda con un código de acceso para Disney+."
      },
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_disney.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Disney+."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_disney.png",
        whatsappMessage: "Hola, mi cuenta de Disney+ aparece sin la suscripción activa."
      },
      {
        id: "perfil_faltante",
        title: "Problemas con perfiles",
        image: "/errores_img/perfiles_disney.png",
        whatsappMessage: "Hola, tengo problemas con los perfiles en Disney+."
      }
    ]
  },
  {
    id: "hbo",
    name: "Max",
    logo: "/img/HBO_Max_Logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_hbo.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Max (HBO)."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_hbo.png",
        whatsappMessage: "Hola, mi cuenta de Max aparece sin la suscripción activa."
      },
      {
        id: "perfil_faltante",
        title: "Problemas con perfiles",
        image: "/errores_img/perfiles_hbo.png",
        whatsappMessage: "Hola, tengo problemas con los perfiles en Max."
      }
    ]
  },
  {
    id: "prime",
    name: "Prime Video",
    logo: "/img/prime_video.png",
    issues: [
      {
        id: "bloqueo",
        title: "Cuenta bloqueada",
        image: "/errores_img/bloqueo_prime.png",
        whatsappMessage: "Hola, mi cuenta de Prime Video aparece como bloqueada."
      },
      {
        id: "codigo_acceso",
        title: "Código de acceso",
        image: "/errores_img/codigo_prime.png",
        whatsappMessage: "Hola, necesito ayuda con un código de acceso para Prime Video."
      },
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_prime.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Prime Video."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_prime.png",
        whatsappMessage: "Hola, mi cuenta de Prime Video aparece sin la suscripción activa."
      },
      {
        id: "perfil_faltante",
        title: "Problemas con perfiles",
        image: "/errores_img/perfiles_prime.png",
        whatsappMessage: "Hola, tengo problemas con los perfiles en Prime Video."
      }
    ]
  },
  {
    id: "spotify",
    name: "Spotify",
    logo: "/img/Spotify_Logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_spotify.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Spotify."
      },
      {
        id: "sin_premium",
        title: "Sin premium",
        image: "/errores_img/suscripcion_spotify.png",
        whatsappMessage: "Hola, mi cuenta de Spotify aparece sin la suscripción premium activa."
      }
    ]
  },
  {
    id: "youtube",
    name: "YouTube",
    logo: "/img/youtube.webp.png",
    issues: [
      {
        id: "sin_premium",
        title: "Sin premium",
        image: "/errores_img/suscripcion_youtube.png",
        whatsappMessage: "Hola, mi cuenta de YouTube aparece sin la suscripción premium activa."
      }
    ]
  },
  {
    id: "paramount",
    name: "Paramount+",
    logo: "/img/Paramount_Logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_paramount.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Paramount+."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_paramount.png",
        whatsappMessage: "Hola, mi cuenta de Paramount+ aparece sin la suscripción activa."
      }
    ]
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    logo: "/img/Crunchyroll_Logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_cruncy.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con Crunchyroll."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_crunchy.png",
        whatsappMessage: "Hola, mi cuenta de Crunchyroll aparece sin la suscripción activa."
      },
      {
        id: "perfil_faltante",
        title: "Problemas con perfiles",
        image: "/errores_img/perfiles_cunchy.png",
        whatsappMessage: "Hola, tengo problemas con los perfiles en Crunchyroll."
      }
    ]
  },
  {
    id: "gamepass",
    name: "Xbox Game Pass",
    logo: "/img/Gamepass_logo.png",
    issues: [
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_game.png",
        whatsappMessage: "Hola, mi cuenta de Xbox Game Pass aparece sin la suscripción activa."
      }
    ]
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "/img/Gemini_Advanced_logo.png",
    issues: [
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscricion_gemini.png",
        whatsappMessage: "Hola, mi cuenta de Gemini aparece sin la suscripción activa."
      }
    ]
  },
  {
    id: "vix",
    name: "ViX",
    logo: "/img/ViX_Logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_vix.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con ViX."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_vix.png",
        whatsappMessage: "Hola, mi cuenta de ViX aparece sin la suscripción activa."
      },
      {
        id: "perfil_faltante",
        title: "Problemas con perfiles",
        image: "/errores_img/perfiles_vix.png",
        whatsappMessage: "Hola, tengo problemas con los perfiles en ViX."
      }
    ]
  },
  {
    id: "gpt",
    name: "ChatGPT",
    logo: "/img/GPT_logo.png",
    issues: [
      {
        id: "contrasena_incorrecta",
        title: "Contraseña incorrecta",
        image: "/errores_img/contraseña_gpt.png",
        whatsappMessage: "Hola, tengo un problema de contraseña incorrecta con ChatGPT."
      },
      {
        id: "sin_premium",
        title: "Sin suscripción",
        image: "/errores_img/suscripcion_gpt.png",
        whatsappMessage: "Hola, mi cuenta de ChatGPT aparece sin la suscripción activa."
      },
      {
        id: "verificacion",
        title: "Código de verificación",
        image: "/errores_img/verificacion_gpt.png",
        whatsappMessage: "Hola, necesito ayuda con la verificación doble factor de ChatGPT."
      }
    ]
  }
];
