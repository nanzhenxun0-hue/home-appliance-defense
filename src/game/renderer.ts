import type { GameState, TowerID } from './types';
import { COLS, ROWS, CELL, GW, GH, PATH, PS, TDEFS, RCOLOR, RBGCOL, EDEFS, st } from './constants';
import { getEnabled, findNearest, pxy } from './logic';

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
  const pad = 5, x = c * CELL, y = r * CELL;
  ctx.globalAlpha = alpha * (disabled ? 0.38 : 1);
  ctx.fillStyle = tint ? tint + '22' : RBGCOL[def.r];
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 8); ctx.fill();
  ctx.strokeStyle = selected ? '#ffd700' : disabled ? '#333' : (tint || RCOLOR[def.r]);
  ctx.lineWidth = selected ? 2.5 : alpha < 1 ? 1.5 : 2;
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 8); ctx.stroke();
  ctx.font = `${CELL * 0.42}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(def.em, x + CELL / 2, y + CELL / 2 + 1);
  if (disabled) { ctx.font = '10px serif'; ctx.fillText('💤', x + CELL - pad - 1, y + pad + 2); }
  if (lv > 0 && !disabled) {
    ctx.fillStyle = RCOLOR[def.r];
    ctx.beginPath(); ctx.arc(x + CELL - pad - 3, y + CELL - pad - 3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(lv + 1), x + CELL - pad - 3, y + CELL - pad - 3);
  }
  ctx.globalAlpha = 1;
};

const drawRange = (ctx: CanvasRenderingContext2D, c: number, r: number, rng: number, col: string, alpha = 1) => {
  const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, radius = rng * CELL;
  ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = col + '15'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = col + 'cc'; ctx.lineWidth = 2; ctx.setLineDash([10, 6]); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1;
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D, s: GameState, pm: TowerID | null,
  hc: number, hr: number, pinKey: string | null, time: number
) => {
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

  // Tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const onP = PS.has(`${c},${r}`);
      ctx.fillStyle = onP ? '#7a5228' : ((c + r) % 2 ? '#1c4f17' : '#1f5a1b');
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      if (!onP) {
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }
  PATH.forEach(([c, r]) => {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
  });
  ctx.font = `${CELL * 0.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚪', CELL / 2, 4 * CELL + CELL / 2);
  ctx.fillText('🏠', 15 * CELL + CELL / 2, 3 * CELL + CELL / 2);

  const en = getEnabled(s.grid);

  // Dependency lines with animated electric signal
  for (const [key, cell] of Object.entries(s.grid)) {
    const nk = findNearest(key, s.grid); if (!nk) continue;
    const [c1, r1] = key.split(',').map(Number);
    const [c2, r2] = nk.split(',').map(Number);
    const x1 = c1 * CELL + CELL / 2, y1 = r1 * CELL + CELL / 2;
    const x2 = c2 * CELL + CELL / 2, y2 = r2 * CELL + CELL / 2;
    const active = en.has(key) && en.has(nk);

    ctx.save();
    if (active) {
      // Animated electric line
      ctx.strokeStyle = '#69f0ae'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.6;
      ctx.shadowBlur = 8; ctx.shadowColor = '#69f0ae';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Animated signal dot
      const t = (time * 1.5) % 1;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#b9f6ca'; ctx.globalAlpha = 0.9; ctx.fill();
      ctx.shadowBlur = 12; ctx.shadowColor = '#69f0ae';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#69f0ae44'; ctx.fill();
    } else {
      ctx.strokeStyle = '#f44336'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();

    // Connection dots
    ctx.globalAlpha = active ? 0.7 : 0.3;
    ctx.fillStyle = active ? '#69f0ae' : '#f44336';
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
    if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, valid ? '#69f0ae' : '#f44336');
  }

  // Hover highlight
  if (hc >= 0 && hr >= 0) {
    const key = `${hc},${hr}`; const onP = PS.has(key); const occ = !!s.grid[key];
    if (pm) {
      const valid = !onP && !occ;
      ctx.fillStyle = valid ? 'rgba(105,240,174,0.16)' : 'rgba(244,67,54,0.16)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
      ctx.strokeStyle = valid ? '#69f0ae88' : '#f4433688'; ctx.lineWidth = 2;
      ctx.strokeRect(hc * CELL + 1, hr * CELL + 1, CELL - 2, CELL - 2);
    } else if (!occ && !onP) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
    }
  }

  // Ghost tower
  if (pm && hc >= 0 && hr >= 0) {
    const valid = !PS.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    drawTower(ctx, pm, 0, hc, hr, { alpha: 0.52, tint: valid ? '#69f0ae' : '#f44336' });
  }

  // Towers
  for (const [key, cell] of Object.entries(s.grid)) {
    const [c, r] = key.split(',').map(Number);
    const disabled = !en.has(key);
    const selected = key === pinKey;
    const hov = c === hc && r === hr;
    drawTower(ctx, cell.tid, cell.lv, c, r, { disabled, selected, tint: hov && !pm && !selected ? '#ffffff' : null });
  }

  // Enemies
  for (const e of s.enemies) {
    const { x, y } = pxy(e.pi, e.pr);
    const er = 13;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x, y + 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

    const isFlashing = e.hitFlash > 0;
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

    // HP bar
    const bw = 26, bh = 4, bx = x - bw / 2, by = y - er - 7, hp = Math.max(0, e.hp / e.mhp);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = hp > 0.5 ? '#4caf50' : hp > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(bx, by, bw * hp, bh);
  }

  // Projectiles
  for (const p of s.projs) {
    const t = 1 - p.life / 0.18;
    const px2 = p.sx + (p.ex - p.sx) * t;
    const py2 = p.sy + (p.ey - p.sy) * t;
    const arc = Math.sin(t * Math.PI) * 12;
    ctx.beginPath(); ctx.arc(px2, py2 - arc, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = p.col; ctx.shadowBlur = 9; ctx.shadowColor = p.col; ctx.fill(); ctx.shadowBlur = 0;
  }

  // Particles
  for (const p of s.particles) {
    const a = Math.min(1, p.life / p.ml * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.ml), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Float effects
  for (const ef of s.effs) {
    const rise = (1 - ef.life / ef.ml) * 36;
    const a = Math.min(1, ef.life / ef.ml * 2.5);
    ctx.globalAlpha = a; ctx.fillStyle = ef.col;
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 4; ctx.shadowColor = '#000';
    ctx.fillText(ef.txt, ef.x, ef.y - rise);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Low power overlay
  if (s.power <= 0 && s.waveActive) {
    ctx.fillStyle = 'rgba(255,0,0,0.06)';
    ctx.fillRect(0, 0, GW, GH);
    // Scanlines
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < GH; y += 4) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, y, GW, 1);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
};
