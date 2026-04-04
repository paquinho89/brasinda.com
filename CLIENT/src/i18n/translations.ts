type Language = "gl" | "es" | "en";

export const translations: Record<Language, Record<string, string>> = {
  gl: {
    "navbar.homeAria": "Ir á páxina de inicio",
    "navbar.homeTitle": "Ir a inicio",
    "navbar.organizerFallback": "Organizador",
    "navbar.eventsManagement": "Panel de Xestión de Eventos",
    "navbar.accountSettings": "Configuración da Conta",
    "navbar.logout": "Pechar sesión",
    "toggle.organizerLogin": "Iniciar sesión organizador",
    "toggle.organizerCreate": "Crear conta organizador",
    "toggle.reprintTicket": "Volver imprimir a túa entrada",
    "toggle.changeLanguage": "Cambiar idioma",
    "language.modalTitle": "Cambiar idioma",
    "language.gl": "Galego",
    "language.es": "Castellano",
    "language.en": "English"
  },
  es: {
    "navbar.homeAria": "Ir a la página de inicio",
    "navbar.homeTitle": "Ir a inicio",
    "navbar.organizerFallback": "Organizador",
    "navbar.eventsManagement": "Panel de gestión de eventos",
    "navbar.accountSettings": "Configuración de la cuenta",
    "navbar.logout": "Cerrar sesión",
    "toggle.organizerLogin": "Iniciar sesión organizador",
    "toggle.organizerCreate": "Crear cuenta organizador",
    "toggle.reprintTicket": "Volver a imprimir tu entrada",
    "toggle.changeLanguage": "Cambiar idioma",
    "language.modalTitle": "Cambiar idioma",
    "language.gl": "Galego",
    "language.es": "Castellano",
    "language.en": "English"
  },
  en: {
    "navbar.homeAria": "Go to home page",
    "navbar.homeTitle": "Go home",
    "navbar.organizerFallback": "Organizer",
    "navbar.eventsManagement": "Event management panel",
    "navbar.accountSettings": "Account settings",
    "navbar.logout": "Log out",
    "toggle.organizerLogin": "Organizer sign in",
    "toggle.organizerCreate": "Create organizer account",
    "toggle.reprintTicket": "Reprint your ticket",
    "toggle.changeLanguage": "Change language",
    "language.modalTitle": "Change language",
    "language.gl": "Galician",
    "language.es": "Spanish",
    "language.en": "English"
  }
};

export const translateText = (language: Language, key: string): string => {
  const value = translations[language]?.[key];
  if (value) {
    return value;
  }

  return translations.gl[key] ?? key;
};
