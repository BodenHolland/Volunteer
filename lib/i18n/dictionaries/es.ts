import type { en } from "./en";

export const es: typeof en = {
  nav: {
    howItWorks: "Cómo funciona",
    about: "Acerca de",
    forOrgs: "Para organizaciones",
    signIn: "Iniciar sesión",
    seeTasks: "Ver tareas",
  },
  hero: {
    overline: "Voluntariado en línea",
    title: "Oportunidades de voluntariado en línea que cuentan.",
    subhead:
      "Elige una tarea de una organización patrocinadora y haz voluntariado en línea. Si recibes SNAP (EBT), tus horas revisadas se certifican para tu requisito de trabajo.",
    cta: "Ver oportunidades",
    calfresh: "¿Recibes SNAP (EBT)? Mira cómo se certifican tus horas →",
  },
  orgCta: {
    title: "¿Diriges una organización sin fines de lucro, escuela o agencia?",
    body: "Ofrece tareas y certifica horas de voluntariado para las personas a las que sirves.",
    button: "Conviértete en socio",
  },
  footer: {
    tagline: "Voluntariado en línea que cuenta para tu requisito de trabajo de SNAP (EBT).",
    deliverables: "Entregables públicos",
    privacy: "Privacidad",
    contact: "Contacto",
    disclaimer:
      "Un proyecto de demostración. No afiliado al Estado de California. No hay cuentas reales ni envíos al estado. Las alianzas mostradas son ilustrativas.",
  },
  auth: {
    signInTitle: "Iniciar sesión",
    signInSubtitle: "Bienvenido de nuevo. Inicia sesión para continuar tu trabajo.",
    email: "Correo electrónico",
    password: "Contraseña",
    forgot: "¿Olvidaste?",
    signInBtn: "Iniciar sesión",
    newHere: "¿Eres nuevo?",
    createAccount: "Crear una cuenta",
    badCreds: "Ese correo y contraseña no coinciden.",
    locked: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
    signupTitle: "Crea tu cuenta",
    signupSubtitle: "Comienza a hacer trabajo voluntario que cuenta.",
    yourName: "Tu nombre",
    passwordHint: "Al menos 10 caracteres.",
    here: "Estoy aquí para…",
    roleRecipient: "Hacer trabajo voluntario",
    roleRecipientHint: "— elige tareas y registra horas",
    roleOrg: "Ofrecer tareas para una organización",
    roleOrgHint: "— revisar y certificar el trabajo",
    createBtn: "Crear cuenta",
    legalNote:
      "Al crear una cuenta confirmas que Tended no te paga nada y que solo el Condado decide la elegibilidad.",
    haveAccount: "¿Ya tienes una cuenta?",
  },
  app: {
    nav: {
      dashboard: "Panel",
      tasks: "Tareas",
      projects: "Proyectos",
      calfreshProfile: "Perfil de SNAP",
      settings: "Configuración",
      signOut: "Cerrar sesión",
    },
    dashboard: {
      greeting: "Hola",
      greetingFallback: "qué tal",
      subhead: "Aquí está el estado de tus horas este mes.",
      browseTasks: "Explorar tareas",
      activeProjects: "Proyectos activos",
      emptyTitle: "Aún no te has comprometido con ninguna tarea. Explora el catálogo para encontrar una.",
    },
    tasks: {
      title: "Tareas disponibles",
      subhead: "Tareas reales organizadas por organizaciones sin fines de lucro y agencias públicas.",
      opportunity: "oportunidad",
      opportunities: "oportunidades",
    },
  },
};
