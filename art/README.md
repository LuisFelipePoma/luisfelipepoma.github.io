# Materia digital diseñada en Blender

`portfolio-matter.blend` es la fuente editable de la prueba completa. El objeto `PORTFOLIO_MATTER_EDITABLE` conserva **44 369 vértices con identidad estable** y quince shape keys absolutas: dispersión, siete poses finales y siete poses puente. Al mover la línea de tiempo de Blender se recorre la misma secuencia que reproduce `/matter-lab/`.

Las poses son:

1. terreno del Hero;
2. sensores y paneles de monitoreo;
3. documento plegado y datos extraídos;
4. planos de interfaz de Uribe’s School;
5. estratos, falla y perforaciones de catmap;
6. monograma LFP;
7. trayectorias abiertas de Contacto.

Las cámaras `CAMERA_DESKTOP` y `CAMERA_MOBILE` documentan los dos encuadres. Edita las shape keys directamente para corregir una silueta o una transición. Todos los estados deben conservar el mismo número y orden de vértices.

## Regeneración

Desde la raíz del proyecto:

```powershell
npm run matter:blender
npm run matter:previews
```

El primer comando reconstruye `portfolio-matter.blend`, `portfolio-matter.json` y los caches binarios cuantizados. Como también reemplaza el archivo Blender, úsalo para reconstruir el diseño definido en `scripts/build-portfolio-matter.py`; si editas manualmente el `.blend`, guarda una copia antes de ejecutarlo.

El segundo comando crea las poses, las siete tiras de transición y la galería de revisión. La galería completa queda en `.impeccable/review/portfolio-matter-gallery.png`.

El navegador carga solo una variante: 5 989 831 bytes y 44 369 puntos en escritorio; 3 240 016 bytes y 24 000 puntos en móvil. Cada cache contiene quince poses. Three.js mantiene dos poses en GPU y GSAP controla únicamente la mezcla mediante el scroll. En reposo no se solicitan cuadros nuevos. El módulo aislado de Matter Lab, incluyendo Three.js, mide 531 861 bytes minificados y 132 182 bytes con gzip; estos valores proceden del build, no de una medición del navegador.

`terrain.blend` y los scripts `build-terrain-blend.py` y `export-terrain-points.py` conservan la prueba original del Hero. Sirven como origen del terreno aprobado; la revisión de las siete escenas se realiza ahora con `portfolio-matter.blend`.

## Dyson Hero · anillos continuos

`dyson-hero.blend` contiene la prueba nueva del estado inicial del Hero. La colección `00_NUCLEUS` conserva el núcleo y las colecciones `01_INNER_CONTINUOUS_RINGS` y `02_OUTER_CONTINUOUS_RINGS` contienen cuatro anillos cada una. Los anillos son mallas cerradas de sección rectangular: no tienen piezas, uniones ni huecos. Sus radios son 1,40 / 2,05 / 2,70 / 3,35 y 4,65 / 5,50 / 6,35 / 7,20.

Cada objeto `INNER_*` y `OUTER_*` tiene keyframes propios en los fotogramas 1, 121 y 241. La ruta `/matter-lab/dyson/` usa 61 muestras evaluadas por Blender y aplica sus cuaterniones a nueve grupos de puntos en Three.js. El scroll y el control manual recorren la misma animación en ambos sentidos.

Para reconstruir el `.blend`, los caches binarios y la lámina de control:

```powershell
npm run matter:dyson
npm run matter:dyson-storyboard
```

El primer comando reemplaza `dyson-hero.blend`; guarda otro archivo si realizas cambios manuales. `dyson-storyboard.png` muestra 0, 25, 50, 75 y 100 % usando los mismos datos que carga el navegador.
