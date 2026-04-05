import type { GameState, TowerID, EnemyType } from './types';
import { RARITY_COLOR } from './types';
import { COLS, ROWS, CELL, GW, GH, PATH, PS, TDEFS, EDEFS, st } from './constants';
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
  const rColor = RARITY_COLOR[def.r];
  const pad = 3, x = c * CELL, y = r * CELL;
  ctx.globalAlpha = alpha * (disabled ? 0.38 : 1);

  // Base plate with rarity gradient
  const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
  grad.addColorStop(0, (tint || rColor) + '18');
  grad.addColorStop(1, (tint || rColor) + '08');
  ctx.fillStyle = grad;
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();

  // Border
  ctx.strokeStyle = selected ? '#c084fc' : disabled ? '#333' : (tint || rColor);
  ctx.lineWidth = selected ? 2.5 : 1.5;
  if (selected) { ctx.shadowBlur = 10; ctx.shadowColor = '#c084fc'; }
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.stroke();
  ctx.shadowBlur = 0;

  // Emoji
  ctx.font = `${CELL * 0.48}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(def.em, x + CELL / 2, y + CELL / 2 + 1);

  if (disabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();
    ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💤', x + CELL - pad, y + pad + 5);
  }
  if (lv > 0 && !disabled) {
    ctx.fillStyle = rColor;
    ctx.shadowBlur = 4; ctx.shadowColor = rColor;
    ctx.beginPath(); ctx.arc(x + CELL - pad - 2, y + CELL - pad - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(lv + 1), x + CELL - pad - 2, y + CELL - pad - 2);
  }
  ctx.globalAlpha = 1;
};

const drawRange = (ctx: CanvasRenderingContext2D, c: number, r: number, rng: number, col: string, alpha = 1) => {
  const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, radius = rng * CELL;
  ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = col + '12'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 1;
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D, s: GameState, pm: TowerID | null,
  hc: number, hr: number, pinKey: string | null, time: number
) => {
  ctx.save();

  if (s.screenShake > 0) {
    const intensity = s.screenShake * 6;
    ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
  }

  ctx.clearRect(-10, -10, GW + 20, GH + 20);

  // Grid tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const onP = PS.has(`${c},${r}`);
      if (onP) {
        ctx.fillStyle = '#1a1225';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(168,85,247,0.12)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      } else {
        const shade = (c + r) % 2 ? '#0f1118' : '#111520';
        ctx.fillStyle = shade;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(99,102,241,0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Path glow
  PATH.forEach(([c, r], i) => {
    const pulse = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(168,85,247,${0.02 + pulse * 0.03})`;
    ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    if (i < PATH.length - 1) {
      const [nc, nr] = PATH[i + 1];
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const nx = nc * CELL + CELL / 2, ny = nr * CELL + CELL / 2;
      const t = (time * 0.5 + i * 0.1) % 1;
      const px = cx + (nx - cx) * t, py = cy + (ny - cy) * t;
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,85,247,${0.25 * (1 - t)})`;
      ctx.fill();
    }
  });

  // Start/End markers
  const [sc, sr] = PATH[0];
  const [ec, er] = PATH[PATH.length - 1];
  ctx.font = `${CELL * 0.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚪', sc * CELL + CELL / 2, sr * CELL + CELL / 2);
  ctx.fillText('🏠', ec * CELL + CELL / 2, er * CELL + CELL / 2);

  const en = getEnabled(s.grid);

  // Dependency lines
  for (const [key] of Object.entries(s.grid)) {
    const nk = findNearest(key, s.grid); if (!nk) continue;
    const [c1, r1] = key.split(',').map(Number);
    const [c2, r2] = nk.split(',').map(Number);
    const x1 = c1 * CELL + CELL / 2, y1 = r1 * CELL + CELL / 2;
    const x2 = c2 * CELL + CELL / 2, y2 = r2 * CELL + CELL / 2;
    const active = en.has(key) && en.has(nk);

    ctx.save();
    if (active) {
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, '#c084fc'); grad.addColorStop(0.5, '#60a5fa'); grad.addColorStop(1, '#c084fc');
      ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
      ctx.shadowBlur = 6; ctx.shadowColor = '#a855f7';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const t = (time * 1.5) % 1;
      const sx = x1 + (x2 - x1) * t, sy = y1 + (y2 - y1) * t;
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#e9d5ff'; ctx.globalAlpha = 0.8; ctx.fill();
    } else {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = active ? 0.6 : 0.25;
    ctx.fillStyle = active ? '#c084fc' : '#ef4444';
    ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill();
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
      if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, TDEFS[s.grid[key].tid].rc, 0.4);
    }
  }
  if (pm && hc >= 0 && hr >= 0) {
    const valid = !PS.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    const S = st(pm, 0);
    if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, valid ? '#a855f7' : '#ef4444');
  }

  // Hover highlight
  if (hc >= 0 && hr >= 0) {
    const key = `${hc},${hr}`; const onP = PS.has(key); const occ = !!s.grid[key];
    if (pm) {
      const valid = !onP && !occ;
      ctx.fillStyle = valid ? 'rgba(168,85,247,0.1)' : 'rgba(239,68,68,0.1)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
      ctx.strokeStyle = valid ? '#a855f788' : '#ef444488'; ctx.lineWidth = 1.5;
      ctx.strokeRect(hc * CELL + 1, hr * CELL + 1, CELL - 2, CELL - 2);
    } else if (!occ && !onP) {
      ctx.fillStyle = 'rgba(99,102,241,0.04)';
      ctx.fillRect(hc * CELL, hr * CELL, CELL, CELL);
    }
  }

  // Ghost
  if (pm && hc >= 0 && hr >= 0) {
    const valid = !PS.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    drawTower(ctx, pm, 0, hc, hr, { alpha: 0.5, tint: valid ? '#a855f7' : '#ef4444' });
  }

  // Towers
  for (const [key, cell] of Object.entries(s.grid)) {
    const [c, r] = key.split(',').map(Number);
    const disabled = !en.has(key);
    const selected = key === pinKey;
    const hov = c === hc && r === hr;
    drawTower(ctx, cell.tid, cell.lv, c, r, { disabled, selected, tint: hov && !pm && !selected ? '#c084fc' : null });
  }

  // Enemies
  for (const e of s.enemies) {
    const { x, y } = pxy(e.pi, e.pr);
    const eRadius = 12;
    ctx.fillStyle = 'rgba(168,85,247,0.1)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

    const isFlashing = e.hitFlash > 0;
    const col = isFlashing ? '#ffffff' : e.frozen > 0 ? '#80deea' : e.burning > 0 ? '#ff7043' : EDEFS[e.type].col;
    ctx.beginPath(); ctx.arc(x, y, eRadius, 0, Math.PI * 2);
    const grd = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, eRadius);
    grd.addColorStop(0, isFlashing ? '#ffffff' : '#fff8');
    grd.addColorStop(1, col);
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (!isFlashing) {
      ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.em, x, y + 1);
    }
    if (e.frozen > 0) { ctx.font = '8px serif'; ctx.fillText('❄️', x + 11, y - 9); }
    else if (e.burning > 0) { ctx.font = '8px serif'; ctx.fillText('🔥', x + 11, y - 9); }

    // HP bar
    const bw = 22, bh = 2.5, bx = x - bw / 2, by = y - eRadius - 5, hp = Math.max(0, e.hp / e.mhp);
    ctx.fillStyle = '#0a0a15'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    if (hp > 0.5) { hpGrad.addColorStop(0, '#a855f7'); hpGrad.addColorStop(1, '#6366f1'); }
    else if (hp > 0.25) { hpGrad.addColorStop(0, '#f97316'); hpGrad.addColorStop(1, '#ef4444'); }
    else { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(1, '#dc2626'); }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx, by, bw * hp, bh);
  }

  // Projectiles
  for (const p of s.projs) {
    const t = 1 - p.life / 0.18;
    const px2 = p.sx + (p.ex - p.sx) * t;
    const py2 = p.sy + (p.ey - p.sy) * t;
    const arc = Math.sin(t * Math.PI) * 8;
    ctx.beginPath(); ctx.arc(px2, py2 - arc, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = p.col;
    ctx.shadowBlur = 10; ctx.shadowColor = p.col;
    ctx.fill();
    ctx.beginPath(); ctx.arc(px2, py2 - arc, 6, 0, Math.PI * 2);
    ctx.fillStyle = p.col + '22'; ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Particles
  for (const p of s.particles) {
    const a = Math.min(1, p.life / p.ml * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    ctx.shadowBlur = 3; ctx.shadowColor = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.ml), 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  // Float effects
  for (const ef of s.effs) {
    const rise = (1 - ef.life / ef.ml) * 30;
    const a = Math.min(1, ef.life / ef.ml * 2.5);
    ctx.globalAlpha = a; ctx.fillStyle = ef.col;
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 4; ctx.shadowColor = ef.col;
    ctx.fillText(ef.txt, ef.x, ef.y - rise);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Low power overlay
  if (s.power <= 0 && s.waveActive) {
    ctx.fillStyle = 'rgba(239,68,68,0.03)';
    ctx.fillRect(0, 0, GW, GH);
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < GH; y += 3) {
      ctx.fillStyle = y % 6 < 3 ? '#ef4444' : '#a855f7';
      ctx.fillRect(0, y, GW, 1);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
};
