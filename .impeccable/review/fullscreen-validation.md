# Fullscreen layout correction

Latest user instructions require each project to occupy h-screen, matter opposite its image without overlaps, and the initial hero to include the header within h-screen. These authorized adaptations supersede the original first-case preview and opacity-only protection.

## Automated

- Astro check: 23 files, zero diagnostics. Build: two static ES/EN routes. Eight tests pass, including project coordinates contained in their reserved local plane for 1800/600-point worlds.
- JavaScript/CSS measured in current build-size.json. Raster provenance: four embedded PNGs plus eleven output WebP sidecars, zero missing after final build.

## CUA observations

- Desktop 1440×900 CSS: header74 + hero826 =900; work starts at document y900; all four projects are900px high.
- Mobile390×900 CSS: header128 + hero772 =900; work starts at y900; first three projects900px, catmap953.64px to preserve the complete screenshot. No horizontal overflow.
- Normal desktop catmap capture at scroll3576: scene3.973, cloud below copy on the left, public screenshot/frame on the right, no visible overlap.
- Normal mobile Uribe capture at scroll2684: scene2.982, 600points, image loaded; cloud between copy and screenshot, no visible overlap.
- Required scoped viewport captures: fullscreen-desktop.png (catmap), fullscreen-mobile.png (Uribe), fullscreen-hero-desktop.png and fullscreen-hero-mobile.png (document top). These are viewport captures, not full-page images. All verified valid after normalization.
- Source protection excludes complete particle footprints within16px of quiet rectangles, rather than10% opacity. Projection follows reserved DOM spaces, clamps vertical target position during scroll and interpolates pixels; section targets align with the centered viewport.

## Limits

OS reduced motion/hidden-tab behavior remain source-inspected; their implementation is preserved. Current captures use normal motion. Desktop maximum observed draw-command CPU includes a35.7ms outlier during navigation; mobile5.0ms. These are not FPS measurements. Automatic Impeccable font-ranking/phase gates remain unavailable/pending as previously documented; no forced/fabricated pass.

Design documents refreshed and validated by an independent documenter. Fresh scoped visual-review disposition: ship, no material fixes; record in fullscreen-finish-review.md. Automatic gates remain pending. About initials also carry data-cloud-quiet; final rebuild after that attribute passes without changing the four reviewed hero/project regions.
