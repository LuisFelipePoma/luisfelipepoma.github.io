import type { ImageMetadata } from 'astro';
import uribeImage from '../assets/uribe-school.png';
import catmapImage from '../assets/catmap.png';

export type Locale = 'es' | 'en';
export type Translation = Record<Locale, string>;
export interface Profile {
  name: string; email: string; github: string; linkedin: string;
  cv: { url: string; language: 'es' }; bio: Translation;
}
export interface CaseStudy {
  id: string; client: string; title: Translation; role: Translation; summary: Translation; stack: string[];
  media: { type: 'monitoring' | 'extraction' | 'screenshot'; image?: ImageMetadata; alt: Translation; caption: Translation };
  links: { url: string; label: Translation }[]; dark?: boolean;
}
export const profile: Profile = {
  name: 'Luis Felipe Poma Astete', email: 'lfpasep9@gmail.com',
  github: 'https://github.com/LuisFelipePoma',
  linkedin: 'https://www.linkedin.com/in/luis-felipe-poma-astete-759768272/',
  cv: { url: '/cv/Luis-Felipe-Poma-CV-ES.pdf', language: 'es' },
  bio: {
    es: 'Soy bachiller en Ciencias de la Computación por la UPC e ingeniero de software en WWL. Trabajo entre arquitectura backend, interfaces web y soluciones de IA aplicada. Me interesa convertir información compleja en productos claros, mantenibles y útiles.',
    en: 'I hold a bachelor’s degree in Computer Science from UPC and work as a software engineer at WWL. My work spans backend architecture, web interfaces and applied AI. I enjoy turning complex information into clear, maintainable and useful products.'
  }
};
export const cases: CaseStudy[] = [
  {
    id: 'monitoreo', client: 'WWL',
    title: { es: 'Monitoreo industrial', en: 'Industrial monitoring' },
    role: { es: 'Ingeniería backend, frontend y móvil', en: 'Backend, frontend & mobile engineering' },
    summary: { es: 'De monolito a microservicios y monitoreo en tiempo real.', en: 'From a monolith to microservices for real-time monitoring.' },
    stack: ['Python', 'FastAPI', 'React'],
    media: {
      type: 'monitoring',
      alt: { es: 'Sensores conectados a servicios FastAPI y a visualizaciones web y móviles.', en: 'Sensors connected to FastAPI services and web and mobile visualizations.' },
      caption: { es: 'Representación del funcionamiento · sensores → servicios → visualización', en: 'Functional representation · sensors → services → visualization' }
    }, links: []
  },
  {
    id: 'documentos', client: 'WWL', dark: true,
    title: { es: 'Extracción documental con IA', en: 'AI document extraction' },
    role: { es: 'Implementación de una solución con LLM', en: 'LLM solution implementation' },
    summary: { es: 'LLM para extraer datos de documentos escaneados.', en: 'LLMs extract data from scanned documents.' },
    stack: ['LLM'],
    media: {
      type: 'extraction',
      alt: { es: 'Un documento escaneado pasa por extracción con LLM y se convierte en datos estructurados.', en: 'A scanned document passes through LLM extraction to become structured data.' },
      caption: { es: 'Representación del funcionamiento · documento → extracción → datos', en: 'Functional representation · document → extraction → data' }
    }, links: []
  },
  {
    id: 'uribe', client: 'Uribe’s School',
    title: { es: 'Uribe’s School', en: 'Uribe’s School' },
    role: { es: 'Requerimientos, diseño, desarrollo y despliegue', en: 'Requirements, design, development & deployment' },
    summary: { es: 'Web educativa: del diseño y los requerimientos al despliegue.', en: 'An education website, from requirements and design to deployment.' },
    stack: ['Astro', 'React', 'CSS'],
    media: {
      type: 'screenshot', image: uribeImage,
      alt: { es: 'Captura de la web pública de Uribe’s School con su navegación y portada.', en: 'Screenshot of the public Uribe’s School website showing its navigation and homepage.' },
      caption: { es: 'Captura de la web pública · uribe-school.vercel.app', en: 'Public website screenshot · uribe-school.vercel.app' }
    },
    links: [{ url: 'https://uribe-school.vercel.app/', label: { es: 'Visitar web', en: 'Visit website' } }]
  },
  {
    id: 'catmap', client: 'Open source',
    title: { es: 'catmap', en: 'catmap' },
    role: { es: 'Desarrollo de una biblioteca TypeScript', en: 'TypeScript library development' },
    summary: { es: 'Biblioteca TypeScript de visualización geotécnica.', en: 'A TypeScript library for geotechnical visualization.' },
    stack: ['TypeScript', 'Canvas', 'WebGL'],
    media: {
      type: 'screenshot', image: catmapImage,
      alt: { es: 'Ejemplos públicos de catmap: niveles de piezómetros y respuesta a la lluvia.', en: 'Public catmap examples: piezometer trigger levels and rainfall response.' },
      caption: { es: 'Captura de los ejemplos públicos · datos de demostración', en: 'Screenshot of public examples · demonstration data' }
    },
    links: [
      { url: 'https://github.com/LuisFelipePoma/catmap', label: { es: 'Repositorio', en: 'Repository' } },
      { url: 'https://luisfelipepoma.github.io/catmap/', label: { es: 'Ver ejemplos', en: 'View examples' } }
    ]
  }
];
export const tools = [
  { title: { es: 'Backend', en: 'Backend' }, items: ['Python', 'FastAPI'] },
  { title: { es: 'Web', en: 'Web' }, items: ['TypeScript', 'React', 'Astro'] },
  { title: { es: 'Datos e IA', en: 'Data & AI' }, items: ['PostgreSQL', 'TensorFlow', 'PyTorch'] },
  { title: { es: 'Infraestructura', en: 'Infrastructure' }, items: ['Docker', 'AWS', 'Git'] }
] satisfies { title: Translation; items: string[] }[];
export const copy = {
  es: {
    metaTitle: 'Luis Felipe Poma Astete — Software, backend e IA aplicada',
    metaDescription: 'Portafolio de Luis Felipe Poma Astete. Ingeniería de software, backend e IA aplicada: monitoreo industrial, extracción documental, productos web y visualización geotécnica.',
    work: 'Trabajo', about: 'Sobre mí', contact: 'Contacto', navigation: 'Navegación principal', language: 'Idioma', skip: 'Saltar al contenido',
    headline: ['Ingeniero de', 'software.'], specialty: 'Backend e IA aplicada.',
    value: 'Construyo servicios escalables y productos en tiempo real que convierten datos complejos en herramientas útiles.',
    seeWork: 'Ver trabajo', talk: 'Hablemos', location: 'Lima, Perú / UTC−5', matter: 'Materia digital',
    selected: 'Trabajo seleccionado', selectedCount: 'Cuatro casos de estudio', role: 'Mi rol',
    aboutHeading: 'Código con criterio.', toolsHeading: 'Herramientas de trabajo', education: 'Ciencias de la Computación · UPC',
    contactHeading: '¿Construimos algo útil?', contactText: 'Para conversar sobre un proyecto o una oportunidad, escríbeme.',
    sendEmail: 'Enviar correo', copyEmail: 'Copiar correo', copying: 'Copiando…', copied: 'Correo copiado',
    copyFailure: 'No se pudo copiar. Selecciona el correo para copiarlo o usa «Enviar correo».',
    cv: 'Descargar CV', cvLanguage: 'PDF · Español', social: 'Enlaces profesionales', backTop: 'Volver arriba',
    newTab: 'se abre en una pestaña nueva', markAlt: 'Iniciales LFP construidas con pequeños bloques azules.'
    ,openSource: 'Código abierto', reduceMotion: 'Reducir movimiento', systemMotion: 'Preferencia del sistema'
  },
  en: {
    metaTitle: 'Luis Felipe Poma Astete — Software, backend & applied AI',
    metaDescription: 'Luis Felipe Poma Astete’s portfolio. Software engineering, backend and applied AI: industrial monitoring, document extraction, web products and geotechnical visualization.',
    work: 'Work', about: 'About', contact: 'Contact', navigation: 'Main navigation', language: 'Language', skip: 'Skip to content',
    headline: ['Software', 'engineer.'], specialty: 'Backend & applied AI.',
    value: 'I build scalable services and real-time products that turn complex data into useful tools.',
    seeWork: 'View work', talk: 'Let’s talk', location: 'Lima, Peru / UTC−5', matter: 'Digital matter',
    selected: 'Selected work', selectedCount: 'Four case studies', role: 'My role',
    aboutHeading: 'Code with purpose.', toolsHeading: 'Tools of the trade', education: 'Computer Science · UPC',
    contactHeading: 'Let’s build something useful.', contactText: 'To discuss a project or an opportunity, drop me a line.',
    sendEmail: 'Send email', copyEmail: 'Copy email', copying: 'Copying…', copied: 'Email copied',
    copyFailure: 'Could not copy. Select the email to copy it, or use “Send email”.',
    cv: 'Download CV', cvLanguage: 'PDF · Spanish', social: 'Professional links', backTop: 'Back to top',
    newTab: 'opens in a new tab', markAlt: 'LFP initials constructed with small blue blocks.'
    ,openSource: 'Open source', reduceMotion: 'Reduce motion', systemMotion: 'System preference'
  }
};
