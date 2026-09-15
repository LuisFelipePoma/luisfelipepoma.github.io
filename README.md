# Luis Felipe Poma · Portfolio

Portafolio estático bilingüe con Astro: español en `/` e inglés en `/en/`. La dirección aprobada es **Horizonte digital**, con tipografía editorial, terreno de puntos y cuatro casos seleccionados.

## Desarrollo

Requiere Node.js 22.12 o superior.

```sh
npm ci
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

## Validación y salida estática

```sh
npm run check
npm run build
npm test
```

La compilación genera `dist/`, compatible con GitHub Pages. El workflow existente en `.github/workflows/deploy.yml` usa esta salida. `site` en `astro.config.mjs` debe coincidir con el dominio publicado.

## Contenido y diseño

- `src/data/portfolio.ts`: perfil, proyectos y traducciones compartidas.
- `src/components/`: secciones y patrones Astro reutilizables.
- `src/styles/tailwind.css`: fuentes locales y tokens de Tailwind 4.
- `src/styles/patterns.ts`: recetas de utilidades compartidas; el diseño vive en los componentes Astro.
- `src/scripts/portfolio.ts`: partículas, movimiento reducido y copia del correo.
- `public/cv/`: PDF español original; sustituirlo cuando se actualice el CV.
- `PRODUCT.md`: contexto y fuentes factuales. `DESIGN.md` y `.impeccable/design.json`: sistema visual.

Archivo y Commit Mono se sirven localmente con sus licencias. Las imágenes públicas de Uribe’s School y catmap son capturas; los diagramas WWL están identificados como representaciones del funcionamiento.

## Animación

Se eligió [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) para enlazar una nube continua al scroll nativo. Canvas 2D interpola las mismas partículas entre siete formas geométricas, desplaza su posición y añade profundidad al mover el puntero. El progreso tiene un `scrub` de 0,12 s y responde también al scroll inverso y a los saltos por anclas. anime.js y Motion se evaluaron; el requisito final de scroll continuo se implementa con GSAP.

La nube permanece visible en el fondo durante todo el recorrido con 1800 puntos en escritorio, 600 en móvil y DPR máximo 1,5. Se dibuja al cambiar el scroll, el puntero o el tamaño; cuando estos quedan estables, no hay cuadros nuevos ni respiración continua. Las fases de dispersión y los puntos circulares se preparan al iniciar o redimensionar. Los rectángulos de protección se actualizan una vez como máximo por cuadro y las colisiones solo comprueban los visibles. Se pausa con la pestaña oculta y muestra formas estáticas con movimiento reducido. Las imágenes de proyectos están siempre visibles en marcos editoriales y no participan en la animación. Sin JavaScript o Canvas, el terreno de respaldo, diagramas y contenido siguen disponibles.

El Canvas registra sin interfaz visible `data-draw-count`, `data-scroll-draw-count`, `data-idle-draw-count`, `data-last-draw-ms`, `data-max-draw-ms` y `data-draw-p95-ms` (tiempo de emisión de dibujo en CPU; percentil 95 de los últimos 120 dibujos, actualizado cada 30 cuadros). En la compilación estática, el archivo JavaScript de la interfaz y GSAP mide **120 727 bytes**, o **47 106 bytes comprimido con gzip**. El presupuesto inicial sigue en 1800/600; la decisión de reducirlo a 1200/400 exige medir un percentil 95 superior a 10 ms en el navegador y comparar la densidad visual. La latencia y el percentil 95 en navegador aún no tienen una medición verificable.

Header y hero suman `100vh`; cada trabajo usa `md:h-screen`, con mínimo de pantalla y altura extensible en móvil. La nube se proyecta al espacio reservado opuesto al visual, y excluye completamente los puntos sobre textos, diagramas y marcos durante el scroll.

Astro: [i18n](https://docs.astro.build/en/guides/internationalization/), [scripts de cliente](https://docs.astro.build/en/guides/client-side-scripts/) y [estilos](https://docs.astro.build/en/guides/styling/).
