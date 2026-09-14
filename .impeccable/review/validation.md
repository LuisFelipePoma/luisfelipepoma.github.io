# Final validation — persistent scroll cloud

Current fullscreen refinement evidence and verdict: `fullscreen-validation.md` and `fullscreen-finish-review.md`. Measurements below describe the preceding motion revision.

## Historical implementation before fullscreen refinement

The last user instruction overrides anime.js and image reveal: one always-visible Canvas cloud follows native scroll, changes position and shape per section, and preserves directly visible project images. GSAP ScrollTrigger coordinates progress; Tailwind utilities define interface styles. The stylesheet contains only the Tailwind import, local font faces and theme tokens. The generated hero raster is a no-JavaScript/Canvas-failure fallback; the working hero uses procedural points.

## Automated evidence

- Final Astro check: 23 files, zero errors, warnings or hints.
- Final static build: `/index.html` and `/en/index.html`, optimized local images.
- Eight passing tests: clipboard success, denial and unavailable API; locale routes/translations/anchors/assets/fallback content; original Spanish CV SHA-256; finite deterministic geometry and desktop/mobile counts.
- JavaScript: 119,166 bytes raw / 46,639 gzip. CSS: 26,467 bytes raw / 6,348 gzip. Exact file inventory in `build-size.json`, measured after final source build at 2026-09-14T21:06:31Z.
- Final provenance scan: 15 rasters, zero missing. Source PNG provenance is embedded; native CLI uses adjacent `.webp.json` sidecars for 11 optimized WebP files.

## CUA browser observations

- ES and EN desktop captures start at document top. CSS widths 1440, 1905, 390 and 320 were inspected; no horizontal overflow. Required current captures: `desktop.png`, `mobile.png`, `hero-repro.png`, `english.png`, `user-1905.png`, `user-320.png`, `scroll-work.png`, `scroll-contact.png`.
- The final 320 capture was refreshed from a clean tab at a 320 × 900 CSS viewport, with both lazy public screenshots confirmed loaded. Its full-page raster is 320 × 5190 and includes the accessible skip-link focus state after returning to the hero anchor. Some other captures exclude the 10 px scrollbar. Failed/duplicated intermediate capture bytes were replaced, never used as review evidence.
- All four ES case summaries measure two lines at 320/390 without clipping. Industrial nodes/labels end at y1010.125 in the 1536 × 1024 CSS reference viewport. Desktop lateral indices become inline heading indices on mobile.
- Hero secondary links have underlines; keyboard focus has a visible 2 px outline. Native email copy reports “Correo copiado”. Denied/unavailable clipboard paths are tested.
- One fixed Canvas remains visible across sections. Native anchor navigation observed progress 0 → 2.059 near work → 6 at contact → 2.059 in reverse. Refreshed 1920 × 1024 work/contact captures confirm continued visibility, distinct geometry and color. Images remain opacity 1 without particle reveal.
- Resize switches 1800 desktop / 600 mobile points; DPR capped at 1.5. Draw loop limited to 30 fps. Maximum observed CPU time issuing draw commands ranged from 11.0 to 20.6 ms on desktop; excludes rasterization/GPU and other scripting; not a measured FPS guarantee.
- Manual reduced-motion control gives aria-pressed=true, static per-section geometry, no breathing/parallax or smooth scrolling. Normal motion restored after captures; delivered tab begins at live terrain.
- Root full-page captures use static terrain to avoid animation variance. A fixed Canvas documents its initial viewport state only; separate work/contact viewport captures show continuous visibility and different shapes/colors on scroll. Points are attenuated behind text/figures.

## Composition and review

- Approved reference: Horizonte digital. Layout, type, topology and palette remain binding; procedural live matter and image frames are authorized by the latest user instruction quoted in `portfolio-contract.md`.
- Current comp-diff: overall 0.7363, drift (`diff/final`). Previous procedural build 0.7404. Historical pre-steering raster score 0.7705 (`diff/hero`); intermediate raster correction 0.7816. These historical scores are not current motion verdicts.
- Text detection has incorrect semantic bounds: headline omits “de”; value/talk snap to CTA; some first-case and footer-coordinate crops miss actual content. Independent paired-crop/full-capture adjudication is required.
- PRODUCT.md, DESIGN.md normative YAML and schema-v2 design.json describe the final GSAP/Tailwind world. Fresh independent reviewer receives current captures and approved reference.
- Fresh full review disposition: fix. Ordered corrections: irregular concentrated terrain contours, net texture warmth and actual review closure. Applied in one source batch, tested, documented and recaptured over the same eight paths for a scored verdict. Automatic phases remain unavailable/pending.
- Independent scored verdict: ship for those three fixes only, all eight captures valid and no material batch regressions. Clear-field sample now 241/238/231 versus approved 240/238/230–231. Exact verdict in `motion-finish-verdict.md`; automatic phase gates remain pending.
- Final delivered browser observation: ES, document scroll 0, 1920 CSS px, motion full, 1800 particles, continuous rendering.

## Explicit limits

- OS-level reduced motion and hidden-tab suspension: source-inspected, not browser-emulated. Manual reduced motion exercised directly. No-JavaScript/Canvas-failure completeness checked against built HTML/guards, not runtime toggling.
- Automatic Impeccable font ranking cannot resolve its browser driver/catalog. State remains open/pending without fabricated or forced passes. User-pinned Archivo/Commit Mono remain; CUA evidence and independent review provide manual fidelity evidence.
- No QUALITY BAR card artifact is present; approved composition, direction contract and craft floor are available.
