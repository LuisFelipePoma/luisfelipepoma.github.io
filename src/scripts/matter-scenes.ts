export interface MatterPoint {x:number; y:number; z:number; size:number; alpha:number; accent:boolean}
export const sceneNames = ['terrain', 'monitoreo', 'documentos', 'uribe', 'catmap', 'about', 'contact'] as const;
const random = (seed:number) => {const n = Math.sin(seed * 999.91) * 43758.5453; return n - Math.floor(n);};

/** Geometric worlds, independent of project screenshots and factual diagrams. */
export function buildMatterScenes(count:number, mobile:boolean): MatterPoint[][] {
  const cols = mobile ? 40 : 60;
  const rows = Math.ceil(count / cols);
  return sceneNames.map((_, scene) => Array.from({length:count}, (_, i) => {
    const u = (i % cols) / (cols - 1), v = Math.floor(i / cols) / (rows - 1);
    const r = random(i * 3 + 2), a = random(i * 3 + 1) * Math.PI * 2;
    let x = 0, y = 0, z = 0, size = 1.25, alpha = .72;
    if (scene === 0) {
      // Concentrate the same budget along staggered contours, with irregular
      // stippling and a loose foreground rather than a uniform sampling mesh.
      const foreground = i % 5 === 0;
      const terrainU = random(i * 11 + 7);
      const band = i % 12;
      const terrainV = foreground ? random(i * 13 + 5)
        : .08 + band / 11 * .84 + (random(i * 19 + 4) - .5) * .025;
      z = terrainV * 2 - 1;
      const ridge = .76 * Math.exp(-((terrainU - .83) ** 2 / .018 + (terrainV - .31) ** 2 / .13))
        + .36 * Math.exp(-((terrainU - .43) ** 2 / .034 + (terrainV - .66) ** 2 / .17))
        + .055 * Math.sin(terrainU * 29 + terrainV * 8)
        + .045 * Math.sin(terrainU * 9 - terrainV * 14);
      x = -.06 + terrainU * 1.18 + z * .045;
      y = (mobile ? .76 : .73) + z * .115 - ridge * .36;
      if (!foreground) y += (random(i * 23 + 8) - .5) * .009;
      size = .95 + random(i * 7 + 3) * .65;
      alpha = foreground ? .25 + r * .25 : .60 + ridge * .35;
    } else if (scene === 1) {
      const band = Math.floor(i / cols), angle = u * Math.PI * 2 + band * .22;
      const radius = .04 + band / rows * .26 + Math.sin(angle * 3 + band * .5) * .012;
      x = .77 + Math.cos(angle) * radius * 1.15;
      y = .58 + Math.sin(angle) * radius * .72;
      z = Math.sin(angle * 2 + band * .3);
      size = band % 4 === 0 ? 1.85 : 1.25;
    } else if (scene === 2) {
      const dx = (u - .5) / .47, dy = (v - .5) / .46;
      const alive = dx * dx + dy * dy < 1 && !(u > .62 && v > .25 && v < .54);
      x = .77 + (u - .5) * .42; y = .56 + (v - .5) * .57;
      z = Math.cos(dx * 2.7) * Math.cos(dy * 2.3);
      size = mobile ? 2.1 : 2.8; alpha = alive ? .63 : .04;
    } else if (scene === 3) {
      const layer = i % 3;
      x = .77 + (u - .5) * .40 + layer * .027;
      y = .57 + (v - .5) * .40 - layer * .035;
      z = layer * .5 + Math.sin(u * Math.PI) * .4;
      alpha = .34; size = i % 7 === 0 ? 1.9 : 1.15;
    } else if (scene === 4) {
      x = .36 + u * .68;
      z = Math.sin(u * 12 + v * 4);
      y = .61 + Math.sin(u * 10) * .085 + Math.sin(u * 22) * .025 + (v - .5) * .24;
      alpha = .42 + (1 - Math.abs(v - .5) * 2) * .3;
    } else if (scene === 5) {
      x = .75 + (u - .5) * .39; y = .56 + (v - .5) * .48;
      z = Math.sin(u * 11) + Math.cos(v * 8);
      size = z > .8 ? 2.8 : 1.2; alpha = z > .8 ? .65 : .17;
    } else {
      const radius = Math.pow(r, .42) * .43;
      x = .68 + Math.cos(a) * radius;
      y = .61 + Math.sin(a) * radius * .67;
      z = (random(i * 17 + 6) - .5) * 2;
      alpha = .34; size = i % 19 === 0 ? 2.2 : 1.15;
    }
    // Project worlds use local coordinates inside the reserved space opposite
    // the image. Hero, about and contact retain viewport coordinates.
    if (scene >= 1 && scene <= 4) {
      x = .5 + (x - (scene === 4 ? .70 : .77)) * 1.1;
      y = .5 + (y - .58) * 1.2;
    } else if (mobile && scene > 0) {x = .64 + (x - .75) * 1.55; y = .61 + (y - .58) * .85;}
    return {x,y,z,size,alpha,accent:i % (scene === 5 ? 29 : 139) === 0};
  }));
}
