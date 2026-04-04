import type { GameState, TowerID, EnemyType } from './types';
import { COLS, ROWS, CELL, GW, GH, PATH, PS, TDEFS, RCOLOR, RBGCOL, EDEFS, st } from './constants';
import { getEnabled, findNearest, pxy } from './logic';

// Preload tower images
const towerImages: Partial<Record<TowerID, HTMLImageElement>> = {};
const enemyImages: Partial<Record<EnemyType, HTMLImageElement>> = {};
let imagesLoaded = false;

const loadImages = () => {
  if (imagesLoaded) return;
  imagesLoaded = true;

  const towerSrcs: Record<TowerID, string> = {
    cord: new URL('@/assets/tower-cord.png', import.meta.url).href,
    kettle: new URL('@/assets/tower-kettle.png', import.meta.url).href,
    fan: new URL('@/assets/tower-fan.png', import.meta.url).href,
    vacuum: new URL('@/assets/tower-vacuum.png', import.meta.url).href,
    router: new URL('@/assets/tower-router.png', import.meta.url).href,
    fridge: new URL('@/assets/tower-fridge.png', import.meta.url).href,
  };
  for (const [id, src] of Object.entries(towerSrcs)) {
    const img = new Image();
    img.src = src;
    towerImages[id as TowerID] = img;
  }

  const enemySrcs: Record<EnemyType, string> = {
    dust: new URL('@/assets/enemy-dust.png', import.meta.url).href,
    slime: new URL('@/assets/enemy-slime.png', import.meta.url).href,
    magnet: new URL('@/assets/enemy-magnet.png', import.meta.url).href,
  };
  for (const [id, src] of Object.entries(enemySrcs)) {
    const img = new Image();
    img.src = src;
    enemyImages[id as EnemyType] = img;
  }
};

const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
};

const drawTower = (
  ctx: CanvasRenderingContext2D, tid: TowerID, lv: number, c: number, r: number,
  opts: { alpha?: number; tint?: string | null; disabled?: boolean; selected?: boolean } = {}
) => {
  const { alpha = 1, tint = null, disabled = false, selected = false } = opts;
  const def = TDEFS[tid];
  const pad = 4, x = c * CELL, y = r * CELL;
  ctx.globalAlpha = alpha * (disabled ? 0.38 : 1);

  // SF-style base plate
  ctx.fillStyle = tint ? tint + '18' : RBGCOL[def.r];
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 6); ctx.fill();

  // Neon border glow
  ctx.strokeStyle = selected ? '#c084fc' : disabled ? '#333' : (tint || RCOLOR[def.r]);
  ctx.lineWidth = selected ? 2.5 : alpha < 1 ? 1.5 : 1.8;
  if (selected) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#c084fc';
  }
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 6); ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw tower image
  const img = towerImages[tid];
  if (img && img.complete && img.naturalWidth > 0) {
    const imgSize = CELL - pad * 2 - 4;
    ctx.drawImage(img, x + pad + 2, y + pad + 2, imgSize, imgSize);
  } else {
    ctx.font = `${CELL * 0.42}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(def.em, x + CELL / 2, y + CELL / 2 + 1);
  }

  if (disabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 6); ctx.fill();
    ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💤', x + CELL - pad - 1, y + pad + 6);
  }
  if (lv > 0 && !disabled) {
    ctx.fillStyle = RCOLOR[def.r];
    ctx.shadowBlur = 6; ctx.shadowColor = RCOLOR[def.r];
    ctx.beginPath(); ctx.arc(x + CELL - pad - 3, y + CELL - pad - 3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(lv + 1), x + CELL - pad - 3, y + CELL - pad - 3);
  }
  ctx.globalAlpha = 1;
};

const drawRange = (ctx: CanvasRenderingContext2D, c: number, r: number, rng: number, col: string, alpha = 1) => {
  const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, radius = rng * CELL;
  ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = col + '12'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1.5; ctx.setLineDash([8, 5]); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1;
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D, s: GameState, pm: TowerID | null,
  hc: number, hr: number, pinKey: string | null, time: number
) => {
  loadImages();
  ctx.save();

  // Screen shake
  if (s.screenShake > 0) {
    const intensity = s.screenShake * 8;
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  ctx.clearRect(-10, -10, GW + 20, GH + 20);

  // SF dark metallic tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const onP = PS.has(`${c},${r}`);
      if (onP) {
        // Path: dark with subtle purple energy lines
        ctx.fillStyle = '#1a1225';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(168,85,247,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      } else {
        // Ground: dark hex grid feel
        const shade = (c + r) % 2 ? '#0f1118' : '#111520';
        ctx.fillStyle = shade;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(99,102,241,0.06)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Path glow effect
  PATH.forEach(([c, r], i) => {
    const pulse = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(168,85,247,${0.03 + pulse * 0.04})`;
    ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    // Direction indicators
    if (i < PATH.length - 1) {
      const [nc, nr] = PATH[i + 1];
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const nx = nc * CELL + CELL / 2, ny = nr * CELL + CELL / 2;
      const t = (time * 0.5 + i * 0.1) % 1;
      const px = cx + (nx - cx) * t, py = cy + (ny - cy) * t;
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,85,247,${0.3 * (1 - t)})`;
      ctx.fill();
    }
  });

  ctx.font = `${CELL * 0.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚪', CELL / 2, 4 * CELL + CELL / 2);
  ctx.fillText('🏠', 15 * CELL + CELL / 2, 3 * CELL + CELL / 2);

  const en = getEnabled(s.grid);

  // Dependency lines with SF electric signal
  for (const [key] of Object.entries(s.grid)) {
    const nk = findNearest(key, s.grid); if (!nk) continue;
    const [c1, r1] = key.split(',').map(Number);
    const [c2, r2] = nk.split(',').map(Number);
    const x1 = c1 * CELL + CELL / 2, y1 = r1 * CELL + CELL / 2;
    const x2 = c2 * CELL + CELL / 2, y2 = r2 * CELL + CELL / 2;
    const active = en.has(key) && en.has(nk);

    ctx.save();
    if (active) {
      // Neon purple-blue electric line
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(0.5, '#60a5fa');
      grad.addColorStop(1, '#c084fc');
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
      ctx.shadowBlur = 10; ctx.shadowColor = '#a855f7';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Animated signal dot
      const t = (time * 1.5) % 1;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e9d5ff'; ctx.globalAlpha = 0.9; ctx.fill();
      ctx.shadowBlur = 16; ctx.shadowColor = '#c084fc';
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192,132,252,0.3)'; ctx.fill();
    } else {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();

    // Connection dots
    ctx.globalAlpha = active ? 0.7 : 0.3;
    ctx.fillStyle = active ? '#c084fc' : '#ef4444';
    ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Range rings
  if (pinKey && s.grid[pinKey]) {
    const [c, r] = pinKey.split(',').map(Number);
    const S = st(s.grid[pinKey].tid, s.grid[pinKey].lv);
    if (S.rng > 0) drawRange(ctx, c, r, S.rng, TDEFS[s.grid[pinKey].tid].rc);
  }
  if (hc >= 0 && hr >= 0 && !pm) {
    const key = `${hc},${hr}`;
    if (key !== pinKey && s.grid[key]) {
      const S = st(s.grid[key].tid, s.grid[key].lv);
      if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, TDEFS[s.grid[key].tid].rc, 0.5);
    }
  }
  if (pm && hc >= 0 && hr >= 0) {
    const valid = !PS.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    const S = st(pm, 0);
    if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, valid ? '#a855f7' : '#ef4444');
  }

  // Hover highlight - SF style
  if (hc >= 0 && hr >= 0) {
    const key = `${hc},${hr}`; const onP = PS.has(key); const occ = !!s.grid[key];
    if (pm) {
      const valid = !onP && !occ;
      ctx.fillStyle = valid ? 'rgba(168,85,247,0.12)' : 'rgba(239,68,68,0.12)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
      ctx.strokeStyle = valid ? '#a855f788' : '#ef444488'; ctx.lineWidth = 2;
      ctx.strokeRect(hc * CELL + 1, hr * CELL + 1, CELL - 2, CELL - 2);
    } else if (!occ && !onP) {
      ctx.fillStyle = 'rgba(99,102,241,0.06)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
    }
  }

  // Ghost tower
  if (pm && hc >= 0 && hr >= 0) {
    const valid = !PS.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    drawTower(ctx, pm, 0, hc, hr, { alpha: 0.52, tint: valid ? '#a855f7' : '#ef4444' });
  }

  // Towers
  for (const [key, cell] of Object.entries(s.grid)) {
    const [c, r] = key.split(',').map(Number);
    const disabled = !en.has(key);
    const selected = key === pinKey;
    const hov = c === hc && r === hr;
    drawTower(ctx, cell.tid, cell.lv, c, r, { disabled, selected, tint: hov && !pm && !selected ? '#c084fc' : null });
  }

  // Enemies - draw with images
  for (const e of s.enemies) {
    const { x, y } = pxy(e.pi, e.pr);
    const er = 14;

    // Shadow
    ctx.fillStyle = 'rgba(168,85,247,0.15)';
    ctx.beginPath(); ctx.ellipse(x, y + 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

    const isFlashing = e.hitFlash > 0;

    // Draw enemy image
    const eImg = enemyImages[e.type];
    if (eImg && eImg.complete && eImg.naturalWidth > 0 && !isFlashing) {
      ctx.save();
      if (e.frozen > 0) { ctx.globalAlpha = 0.7; }
      ctx.drawImage(eImg, x - er, y - er, er * 2, er * 2);
      ctx.restore();
      if (e.frozen > 0) {
        ctx.font = '9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('❄️', x + 13, y - 11);
      } else if (e.burning > 0) {
        ctx.font = '9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🔥', x + 13, y - 11);
      }
    } else {
      // Fallback emoji rendering
      const col = isFlashing ? '#ffffff' : e.frozen > 0 ? '#80deea' : e.burning > 0 ? '#ff7043' : EDEFS[e.type].col;
      ctx.beginPath(); ctx.arc(x, y, er, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, er);
      grd.addColorStop(0, isFlashing ? '#ffffff' : '#fff8');
      grd.addColorStop(1, col);
      ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
      if (!isFlashing) {
        ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.em, x, y + 1);
      }
      if (e.frozen > 0) { ctx.font = '9px serif'; ctx.fillText('❄️', x + 13, y - 11); }
      else if (e.burning > 0) { ctx.font = '9px serif'; ctx.fillText('🔥', x + 13, y - 11); }
    }

    // HP bar - SF style
    const bw = 26, bh = 3, bx = x - bw / 2, by = y - er - 7, hp = Math.max(0, e.hp / e.mhp);
    ctx.fillStyle = '#0a0a15'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    if (hp > 0.5) { hpGrad.addColorStop(0, '#a855f7'); hpGrad.addColorStop(1, '#6366f1'); }
    else if (hp > 0.25) { hpGrad.addColorStop(0, '#f97316'); hpGrad.addColorStop(1, '#ef4444'); }
    else { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(1, '#dc2626'); }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx, by, bw * hp, bh);
  }

  // Projectiles - SF neon
  for (const p of s.projs) {
    const t = 1 - p.life / 0.18;
    const px2 = p.sx + (p.ex - p.sx) * t;
    const py2 = p.sy + (p.ey - p.sy) * t;
    const arc = Math.sin(t * Math.PI) * 12;
    ctx.beginPath(); ctx.arc(px2, py2 - arc, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = p.col;
    ctx.shadowBlur = 14; ctx.shadowColor = p.col;
    ctx.fill();
    // Trail
    ctx.beginPath(); ctx.arc(px2, py2 - arc, 7, 0, Math.PI * 2);
    ctx.fillStyle = p.col + '33'; ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Particles - SF colors
  for (const p of s.particles) {
    const a = Math.min(1, p.life / p.ml * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    ctx.shadowBlur = 4; ctx.shadowColor = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.ml), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Float effects
  for (const ef of s.effs) {
    const rise = (1 - ef.life / ef.ml) * 36;
    const a = Math.min(1, ef.life / ef.ml * 2.5);
    ctx.globalAlpha = a; ctx.fillStyle = ef.col;
    ctx.font = 'bold 11px "Rajdhani", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 6; ctx.shadowColor = ef.col;
    ctx.fillText(ef.txt, ef.x, ef.y - rise);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Low power overlay - SF red/purple warning
  if (s.power <= 0 && s.waveActive) {
    ctx.fillStyle = 'rgba(239,68,68,0.04)';
    ctx.fillRect(0, 0, GW, GH);
    // Scanlines
    ctx.globalAlpha = 0.04;
    for (let y = 0; y < GH; y += 3) {
      ctx.fillStyle = y % 6 < 3 ? '#ef4444' : '#a855f7';
      ctx.fillRect(0, y, GW, 1);
    }
    ctx.globalAlpha = 1;
    // Corner vignette
    const vigGrad = ctx.createRadialGradient(GW / 2, GH / 2, GW * 0.2, GW / 2, GH / 2, GW * 0.7);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(239,68,68,0.08)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, GW, GH);
  }

  ctx.restore();
};
