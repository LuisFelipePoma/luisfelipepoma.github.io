# Luis Felipe Poma · Portafolio

Portafolio editorial-tech bilingüe hecho con Astro: español en `/` e inglés en `/en/`. La composición elegida es **Horizonte digital**, con cuatro casos de estudio y una nube de puntos que cambia con el scroll.

## Desarrollo

Requiere Node.js 22.12 o superior. El servidor de desarrollo se inicia en segundo plano, según `AGENTS.md`.

```sh
npm ci
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

```sh
npm run check
npm run build
npm test
```

La salida estática queda en `dist/` y es compatible con GitHub Pages. Las pruebas verifican las rutas ES/EN, traducciones, enlaces, descarga del CV, respaldo SVG, datos de puntos y copia del correo.

## Diseñar las nubes

Los archivos editables están en `public/matter-svg/`: siete SVG de escritorio y siete variantes `-mobile.svg`. Cada SVG representa la forma **con puntos y áreas punteadas**, sin depender de la animación para entenderse. El terreno es panorámico; monitoreo combina una red de sensores; documentos usa una hoja escaneada sobre tinta oscura; Uribe muestra planos de interfaz; catmap muestra estratos y falla; Sobre mí usa el monograma LFP; Contacto expande varias bandas de materia desde un foco azul.

Para cambiar una forma, edita su SVG y su variante móvil en Figma, Affinity u otro editor de vectores. Conserva el fondo transparente y los colores `#11110f`, `#f2efe7`, `#3157ff` y `#91a4ff`; evita imágenes enlazadas y texto dependiente de una fuente externa. Después ejecuta:

```sh
npm run matter:build
npm run matter:gallery
```

`matter:build` usa Sharp **solo durante la compilación** para leer el SVG y generar `public/matter-data/desktop.bin` y `mobile.bin`. Selecciona posiciones visibles, reserva aproximadamente 3,5 % para el azul y las ordena espacialmente para que los puntos correspondientes viajen con menos cruces entre escenas. Los prefijos siguen repartidos cuando baja el presupuesto. `matter:gallery` genera dos galerías locales: [SVG originales](.impeccable/review/matter-gallery.png) y [puntos procesados](.impeccable/review/matter-points-gallery.png). `check`, `build` y `test` reconstruyen los datos automáticamente.

## Movimiento y rendimiento

GSAP ScrollTrigger enlaza las siete escenas al scroll nativo con `scrub: 0.12`. Durante cada cambio, una quinta parte de los puntos recorre el trayecto y el resto se disuelve y reconstruye en posiciones ordenadas, para conservar siluetas reconocibles a mitad de la transición. El campo se coloca en el espacio reservado de cada sección; los cuatro proyectos sitúan la nube al lado opuesto de su visual. Texto, diagramas e imágenes están protegidos con un margen de 16 px. El Hero y cada proyecto conservan la altura de pantalla acordada. El área de Contacto creció a 64 % del contenedor y hasta 440 px de alto en escritorio.

El presupuesto inicial sigue en **2400 puntos en escritorio y 850 en móvil**, con DPR máximo de 1,5. En móvil el SVG punteado permanece como capa de base para sostener la silueta; el Canvas añade los puntos que se transforman. Al reducir el movimiento se muestra el SVG estático y se oculta Canvas. Sin JavaScript o si falla Canvas, las siete formas SVG, las imágenes y todo el contenido siguen visibles. El lienzo solo dibuja durante scroll, movimiento del puntero y cambios de tamaño o estado; se detiene al quedar en reposo o en una pestaña oculta.

Canvas registra `data-scroll-draw-p95-ms`, `data-budget-tier`, cuadros y tiempos de dibujo, sin interfaz de depuración. Tras al menos 60 dibujos de scroll, un p95 superior a 10 ms baja el presupuesto al quedar en reposo a 1800/600; una segunda muestra superior al límite baja a 1200/400. El JavaScript estático actual mide **120 969 bytes sin comprimir y 47 136 bytes con gzip**. Los datos de puntos ocupan **100 808 bytes en escritorio y 35 708 en móvil**, separados del JavaScript. Estos son tamaños de compilación; el p95 y la latencia en navegador siguen pendientes de medición verificable.

El perfil, proyectos y traducciones viven en `src/data/portfolio.ts`. `PRODUCT.md` registra las fuentes factuales; `DESIGN.md` y `.impeccable/design.json` documentan el sistema visual. Archivo y Commit Mono se sirven localmente con sus licencias. Los diagramas WWL están identificados como representaciones del funcionamiento.

## Animación completa en Blender

La prueba aislada está en `/matter-lab/`. Reúne las siete poses, sus versiones de escritorio y móvil, cinco estados de cada transición, un scrubber manual y un recorrido largo ligado al scroll. Todavía no reemplaza las escenas del portafolio: funciona como galería de aprobación.

`art/portfolio-matter.blend` contiene una única nube de 44 369 puntos, ocho estados y siete puentes mediante shape keys absolutas. El navegador no inventa las formas: carga poses cuantizadas, mantiene dos en GPU e interpola con Three.js según el progreso de GSAP. Los comandos e instrucciones de edición están en [art/README.md](art/README.md).

### Prueba Dyson del Hero

`/matter-lab/dyson/` contiene la primera escena del nuevo proceso de revisión. `art/dyson-hero.blend` define un núcleo y ocho anillos monolíticos, distribuidos en dos capas con separación creciente. Cada anillo tiene una animación independiente de 241 fotogramas. La exportación conserva 61 poses de orientación y geometría local cuantizada; Three.js solo reproduce esas transformaciones mediante el scroll.

```sh
npm run matter:dyson
npm run matter:dyson-storyboard
```

La prueba usa 44 000 puntos en escritorio y 20 000 en móvil. La lámina de cinco estados queda en `public/matter-lab/dyson/dyson-storyboard.png`. Esta ruta sigue aislada y todavía no reemplaza la escena del Hero.
