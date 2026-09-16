---
name: Luis Felipe Poma Astete
description: Portafolio editorial de ingeniería expresada como materia digital.
colors:
  paper: "#f2efe7"
  ink: "#11110f"
  electric: "#3157ff"
  muted: "#66635c"
  rule: "rgb(17 17 15 / .24)"
  dark-muted: "#b9b6af"
  dark-electric: "#91a4ff"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(64px, min(10.16vw, 18vh), 156px)"
    fontWeight: 800
    lineHeight: 0.81
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(48px, 5.21vw, 80px)"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(32px, 2.86vw, 44px)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Commit Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  action:
    fontFamily: "Archivo, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  square: "0px"
  dot: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "14": "56px"
  "16": "64px"
  "24": "96px"
components:
  action-primary:
    backgroundColor: "{colors.electric}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "14px 24px"
    height: "auto"
  action-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  action-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "12px 0px"
  action-secondary-hover:
    textColor: "{colors.electric}"
  navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "128px"
  project-frame:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    rounded: "{rounded.square}"
    padding: "{spacing.2}"
  project-index:
    textColor: "{colors.electric}"
    typography: "{typography.label}"
    padding: "0px 16px 0px 0px"
  section-title:
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
  tools:
    textColor: "{colors.ink}"
    padding: "24px 0px 0px"
  copy-email:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "12px 0px"
---

# Design System: Luis Felipe Poma Astete

## Overview

**Creative North Star: "Horizonte digital"**

Una composición editorial convierte información compleja en materia digital. El papel cálido, la tinta oscura y el azul eléctrico sostienen títulos grotescos muy grandes, metadatos monoespaciados y separadores finos. La interfaz mantiene una densidad baja y organiza el trabajo en franjas abiertas.

Una sola nube de puntos acompaña todo el recorrido como fondo. Sus formas y posiciones siguen el desplazamiento; el texto, los diagramas y las capturas permanecen completos y legibles por sí mismos. El campo oscuro de extracción documental conserva la misma jerarquía mediante colores invertidos.

**Key Characteristics:**

- Tipografía sólida y de contorno con gran diferencia de escala.
- Superficies planas, esquinas rectas y reglas finas.
- Azul para acciones, índices y pequeños acentos geométricos.
- Materia digital continua y contenido independiente del movimiento.
- El mismo sistema visual en español e inglés.

## Colors

La paleta combina neutrales cálidos con un único acento azul. Los valores del frontmatter son normativos; las rampas del panel son muestras sintéticas y no pertenecen a la interfaz.

### Primary

- **Azul eléctrico — electric:** acciones principales, foco, índices, marcas de esquina y bloques de las iniciales.
- **Azul de campo oscuro — dark-electric:** adaptación del mismo acento para puntos, índices y diagramas sobre tinta.

### Neutral

- **Papel — paper:** fondo general y texto sobre el campo oscuro.
- **Tinta — ink:** texto principal, contorno del título y superficie del caso de extracción documental.
- **Texto secundario — muted:** roles, categorías y pies sobre papel.
- **Texto secundario oscuro — dark-muted:** roles y pies sobre tinta.
- **Regla — rule:** separadores del encabezado, proyectos, herramientas y pie. El campo oscuro usa papel al 24 %.

**The Legibility Rule.** La nube excluye por completo las zonas de lectura y figuras señaladas, con un margen de (16 px); sobre el campo oscuro, los puntos de tinta se convierten en papel.

## Typography

**Display Font:** Archivo, con respaldo sans-serif.  
**Body Font:** Archivo, con respaldo sans-serif.  
**Label/Mono Font:** Commit Mono, con respaldo monospace.

Las fuentes locales son variables: Archivo admite pesos (100–900) y Commit Mono (200–700). Archivo concentra la identidad en títulos compactos; Commit Mono ordena información breve sin espaciado ornamental.

### Hierarchy

- **Display:** título inicial en dos líneas, una sólida y otra de contorno. En móvil usa una escala fluida (40–88 px) e interlínea (0.92); desde el primer breakpoint usa el menor valor entre (10.16vw) y (18vh), y desde el segundo aplica el límite del frontmatter. La referencia a la altura conserva espacio en ventanas cortas. El contorno mide (1 px) en móvil y (1.6 px) desde el primer breakpoint.
- **Headline:** títulos de secciones. En móvil se adapta entre (44–64 px); en escritorio usa la escala normativa.
- **Title:** títulos de proyecto; móvil (36 px), escritorio según el frontmatter.
- **Body:** lectura base; las introducciones crecen entre (20–24 px), los resúmenes entre (18–20 px). La descripción inicial limita su longitud y la biografía llega a (70ch).
- **Label:** metadatos, categorías e índices. Los pies secundarios usan variantes (10–11 px); los índices principales suben a (18 px).
- **Action:** controles y enlaces, con tamaño de escritorio (16 px). La acción principal usa peso (600).

**The Scale Rule.** Mantener el contraste entre el título inicial y los metadatos; el título puede superar (6rem), como en la composición aprobada.

## Layout

El contenedor llega a (1440 px) y tiene márgenes laterales de (24 px) en móvil. Desde (47.5rem), el margen fluye con la ventana hasta (64 px) por lado. El segundo breakpoint es (68.75rem). El ritmo principal usa múltiplos de (8 px), con subdivisiones presentes en metadatos y controles.

En escritorio, las franjas de proyecto usan doce columnas: índice (2), texto (5) y visual (5); desde el segundo breakpoint cambian a (2/6/4). En móvil forman una columna y el índice acompaña al título. Las herramientas pasan de una lista vertical a cuatro columnas. La navegación móvil coloca sus enlaces en una segunda fila y mide (128 px) de alto; en escritorio comparte una franja de (74 px). La apertura completa, encabezado incluido, ocupa una pantalla: el hero resta la altura del encabezado a (100vh). Su espacio superior de escritorio fluye entre (24–64 px), con referencia de (6vh). El terreno de respaldo y los metadatos inferiores tienen posición absoluta dentro del hero.

Cada proyecto ocupa una pantalla (100vh) en escritorio y centra su composición verticalmente. En móvil conserva una altura mínima de pantalla y puede crecer para mostrar todo el contenido. La nube ocupa una zona entre el texto y la imagen, en el lado opuesto al visual; mide 192 px en móvil y entre 220 y 390 px en escritorio. El Hero reserva una zona panorámica a la derecha y debajo de la titularidad. «Sobre mí» usa una zona de 224 px en móvil y 288 px en escritorio, con 42 % de ancho a la derecha. «Contacto» usa 288 px en móvil y hasta 440 px de alto en escritorio, con 64 % del ancho a la derecha. Todas las zonas y ajustes responsive se expresan con Tailwind.

## Elevation & Depth

La interfaz no usa sombras. La profundidad procede de la escala, las reglas, el grano de papel y la nube fija. La textura se superpone con opacidad (12 %) y mezcla multiply. Su corrección cromática conserva el papel cálido de la composición.

Las siete escenas tienen SVG propios y variantes móviles en `public/matter-svg/`. Los puntos proceden de píxeles visibles de esas composiciones, convertidos durante la compilación con Sharp a archivos binarios estáticos. El orden espacial reduce cruces y los prefijos mantienen cobertura al bajar la densidad. Una quinta parte de los puntos viaja durante la transición; el resto se disuelve y reconstruye de forma progresiva para conservar las siluetas en los cuadros intermedios. La escena de Contacto usa bandas amplias que parten de un foco azul, en lugar de óvalos pequeños. GSAP ScrollTrigger sigue el scroll nativo con scrub (0.12 s). No hay respiración continua. Los puntos se omiten sobre texto, diagramas y marcos señalados, incluyendo un margen de protección de 16 px.

El campo usa inicialmente 2400 puntos en escritorio y 850 en móvil, con resolución máxima de 1,5 DPR. Canvas solo dibuja al cambiar scroll, puntero, tamaño o estado; el último cuadro queda visible en reposo. En móvil, el SVG punteado permanece como base de la silueta mientras los puntos se transforman. Con movimiento reducido se oculta Canvas y se muestran los siete SVG estáticos. Si falla JavaScript o Canvas, los SVG, capturas y diagramas permanecen completos. Tres tamaños discretos de puntos circulares se preparan una vez por tamaño. Los rectángulos de protección se calculan como máximo una vez por cuadro y solo se comprueban los visibles. Tras 60 dibujos de scroll, un p95 superior a 10 ms baja el presupuesto al quedar en reposo a 1800/600; una segunda muestra superior baja a 1200/400. Los datos binarios miden 100 808 bytes en escritorio y 35 708 en móvil. El JavaScript compilado junto con GSAP mide 120 969 bytes sin comprimir y 47 136 bytes con gzip. Son cifras de compilación: p95 y latencia en navegador aún no tienen medición verificable.

**The Complete Content Rule.** Las capturas y diagramas permanecen visibles: no se reconstruyen mediante partículas ni dependen de una animación para aparecer.

## Shapes

Acciones, marcos y superficies mantienen esquinas rectas. El punto de marca es circular; las iniciales LFP se construyen con cuadrados. Los diagramas emplean líneas finas y pequeños radios propios de sus símbolos.

Los marcos de capturas tienen borde de tinta al (30 %), espacio interior (8 px), marcas azules cuadradas de (6 px) en esquinas opuestas y una barra monoespaciada con índice, cliente y tecnología. No hay cuadrícula ornamental de tarjetas.

## Components

### Buttons

La acción principal es un bloque azul de texto papel con altura mínima (48 px). Al pasar el puntero se vuelve tinta. Su relleno aumenta a (16 px / 32 px) en escritorio.

La acción secundaria es un enlace abierto con flecha diagonal; al pasar el puntero se vuelve azul y la flecha se desplaza (2 px). Los controles tienen foco azul de (2 px) con separación de (6 px). Las transiciones de color duran (160 ms), y las de la flecha (180 ms); se desactivan con movimiento reducido.

### Navigation

La marca combina nombre completo y punto azul. En móvil su tamaño fluye entre (12–17 px), con referencia de (3.85vw), para conservar las dos filas del encabezado. Los enlaces usan barras como separadores. ES/EN utiliza Commit Mono y destaca el idioma actual en azul con peso semibold. El encabezado mantiene una superficie de papel al (90 %) para conservar contraste.

### Project Features

Cada franja combina índice, título, cliente, tecnología, rol, resumen y visual. Hay cuatro casos, cada uno centrado en una pantalla de escritorio. La nube ocupa el espacio bajo el texto y al lado opuesto del visual; en móvil se intercala entre texto e imagen y la sección puede crecer. El segundo aplica el campo de tinta. Las capturas públicas tienen marco editorial y pie; las representaciones funcionales son SVG con texto y flechas, sin simular una captura de producto.

### Section Titles & Tools

Los títulos de biografía y contacto comparten la misma receta. Las herramientas se agrupan mediante categorías mono discretas y listas de Archivo, separadas por una regla.

### Contact & Copy

El correo es un enlace grande subrayado que puede ajustarse en pantallas estrechas. El botón de copia muestra un estado de carga, bloquea repeticiones mientras está ocupado y comunica éxito o fallo mediante un estado polite localizado. GitHub, LinkedIn y la descarga del CV usan los mismos enlaces abiertos; el CV se identifica como PDF en español en ambos idiomas.

### Digital Matter

Un único Canvas fijo cubre la ventana como fondo decorativo y no intercepta interacción. La preferencia de movimiento dispone de un control visible cuando la escena está disponible; si el sistema solicita reducción, su preferencia permanece activa.

La siguiente iteración se revisa de forma aislada en `/matter-lab/`. `art/portfolio-matter.blend` guarda una topología continua de 44 369 puntos, siete poses finales y siete puentes como shape keys. Los caches WebGL contienen quince estados cuantizados; Three.js conserva dos estados en GPU y solo interpola el progreso que entrega GSAP. La galería muestra escritorio, móvil y cinco momentos de cada transición antes de integrar este sistema al portafolio.

## Do's and Don'ts

### Do:

- **Do** mantener Archivo y Commit Mono locales y las funciones de color del frontmatter.
- **Do** reutilizar el contenedor, las doce columnas y el ritmo de ocho píxeles.
- **Do** conservar contraste, foco visible y contenido completo en ambos idiomas.
- **Do** mantener una sola nube ligada al scroll, ubicarla frente al visual de cada proyecto y excluirla de las zonas de contenido.
- **Do** construir la interfaz con utilidades Tailwind 4 y reservar la hoja de estilo para importación, fuentes y tema.

### Don't:

- **Don't** añadir sombras, brillo, cromados con gradiente o una cuadrícula ornamental de tarjetas redondeadas.
- **Don't** ocultar capturas o diagramas detrás de una transición de partículas.
- **Don't** sustituir la nube en vivo por el terreno raster cuando Canvas está disponible.
- **Don't** añadir selectores CSS de interfaz a la hoja de estilo.
