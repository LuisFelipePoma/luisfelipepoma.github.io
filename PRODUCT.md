# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Technical teams and recruiters evaluating Luis Felipe Poma Astete for software engineering and product development opportunities, locally and internationally.

## Product Purpose

A bilingual Spanish/English portfolio that communicates Luis Felipe's specialization, demonstrates four selected projects, and makes contact and CV download straightforward.

## Positioning

Software engineering grounded in backend services, microservices, industrial real-time monitoring and applied AI. An experimental editorial-tech presentation expresses complex information as digital matter.

## Capabilities and Constraints

Astro static output for GitHub Pages. Spanish at `/`, English at `/en/`. Four sections: introduction, selected work, about/tools, contact. No backend or contact form. Native scrolling, keyboard accessibility, reduced motion and static fallbacks. No fictional performance metrics or project claims.

## Brand Commitments

Preserve the editorial-tech identity of `mockup/portfolio_pointcloud_mockup.html`: paper #f2efe7, ink #11110f, blue #3157ff, large grotesque typography, small mono metadata, thin rules, point clouds, voxel-like blocks and dithering. Archivo and Commit Mono are approved fonts. One continuous visual scene transforms between sections within a reserved area. The AI extraction case uses a dark section. Three high-fidelity composition images are approved as a workflow; the user chooses one before interface code is written.

## Evidence on Hand

- `mockup/CV_ES_20260807_091331_0000.pdf`: source CV and downloadable Spanish PDF.
- `mockup/Profile.pdf`: LinkedIn profile export and supporting career evidence.
- GitHub: https://github.com/LuisFelipePoma
- LinkedIn: https://www.linkedin.com/in/luis-felipe-poma-astete-759768272/
- Uribe's School public site: https://uribe-school.vercel.app/
- catmap public repository: https://github.com/LuisFelipePoma/catmap

Selected work, in order: WWL industrial monitoring; WWL scanned-document extraction using LLM; Uribe's School; catmap. WWL cases use explicitly labelled functional diagrams based on the CV. Do not publish private repository links or product screenshots. Public visuals may be sourced from Uribe's School and catmap examples.

## Contact

Approved primary email: lfpasep9@gmail.com. Display it as text and mailto link, with an accessible copy action. Download the original Spanish CV and label its language on both site versions.

## Product Principles

- Curate four projects and keep summaries to two short lines.
- Establish professional identity and a work CTA in the first viewport.
- Keep all factual content readable independently of animation.
- Use one authored digital-matter sequence with restrained supporting feedback.
- Provide complete, equivalent Spanish and English content.

## Accessibility & Inclusion

Support keyboard navigation, visible focus, appropriate text contrast, meaningful alternative text, reduced motion, and visible feedback for clipboard success or failure.

## Corrección del usuario · 2026-09-14

La nube debe permanecer visible en el fondo durante todo el recorrido, cambiar de posición y forma siguiendo el scroll entre secciones, como el mockup. El terreno raster es solo el respaldo sin Canvas/JavaScript. Se eliminan las transiciones de partículas antes de mostrar las imágenes: estas permanecen visibles con marcos editoriales propios. Se usa GSAP ScrollTrigger y Tailwind 4; el CSS escrito a mano se limita al registro de fuentes y tokens. Esta instrucción posterior reemplaza la estrategia de animar únicamente al cambiar de sección y la elección anterior de anime.js.

Cada trabajo ocupa una pantalla en escritorio (`h-screen`), con altura mínima de pantalla y crecimiento natural en móvil para conservar el contenido completo. La nube se sitúa en un espacio reservado a la izquierda, opuesto al visual derecho; en móvil queda entre el texto y la imagen. Se excluyen por completo los puntos sobre texto, diagramas y marcos, también durante las transiciones.

El hero inicial ocupa una pantalla contando el encabezado: header de 128 px en móvil y 74 px en escritorio, y hero de `100vh` menos esa altura. El primer trabajo comienza al terminar ese viewport. La escala del titular considera también la altura de la ventana.
