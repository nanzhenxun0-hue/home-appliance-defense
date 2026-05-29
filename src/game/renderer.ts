import type { GameState, TowerID, EnemyType } from './types';
import { RARITY_COLOR } from './types';
import { COLS, ROWS, CELL, GW, GH, TDEFS, EDEFS, st } from './constants';
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
  opts: { alpha?: number; tint?: string | null; disabled?: boolean; selected?: boolean; bossDisabled?: boolean } = {}
) => {
  const { alpha = 1, tint = null, disabled = false, selected = false, bossDisabled = false } = opts;
  const def = TDEFS[tid];
  const rColor = RARITY_COLOR[def.r];
  const pad = 3, x = c * CELL, y = r * CELL;
  ctx.globalAlpha = alpha * (disabled ? 0.38 : bossDisabled ? 0.25 : 1);

  const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
  grad.addColorStop(0, (tint || rColor) + '18');
  grad.addColorStop(1, (tint || rColor) + '08');
  ctx.fillStyle = grad;
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();

  ctx.strokeStyle = selected ? '#c084fc' : disabled ? '#333' : bossDisabled ? '#9c27b0' : (tint || rColor);
  ctx.lineWidth = selected ? 2.5 : 1.5;
  if (selected) { ctx.shadowBlur = 10; ctx.shadowColor = '#c084fc'; }
  rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `${CELL * 0.48}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(def.em, x + CELL / 2, y + CELL / 2 + 1);

  if (disabled) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();
    ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💤', x + CELL - pad, y + pad + 5);
  }
  if (bossDisabled) {
    ctx.fillStyle = 'rgba(128,0,128,0.4)';
    rrect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();
    ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', x + CELL - pad, y + pad + 5);
  }
  if (lv > 0 && !disabled) {
    ctx.fillStyle = rColor;
    ctx.shadowBlur = 4; ctx.shadowColor = rColor;
    ctx.beginPath(); ctx.arc(x + CELL - pad - 2, y + CELL - pad - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(lv + 1), x + CELL - pad - 2, y + CELL - pad - 2);
  }
  // Show ability star on Lv3
  if (lv >= 2 && def.ability) {
    ctx.font = '8px serif'; ctx.fillText('★', x + pad + 5, y + pad + 5);
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

  // ── Area-specific background themes ──
  type AreaTheme = { pathFill: string; pathStroke: string; evenTile: string; oddTile: string; gridLine: string; glowCol: string; glowRGB: string };
  const areaThemes: Record<string, AreaTheme> = {
    suburb:   { pathFill:'#1a240e', pathStroke:'rgba(102,187,106,0.22)', evenTile:'#111c0a', oddTile:'#131e0c', gridLine:'rgba(76,175,80,0.07)',   glowCol:'#66bb6a', glowRGB:'102,187,106' },
    factory:  { pathFill:'#1e1612', pathStroke:'rgba(255,152,0,0.22)',   evenTile:'#14100a', oddTile:'#16120c', gridLine:'rgba(255,152,0,0.08)',   glowCol:'#ff9800', glowRGB:'255,152,0'   },
    downtown: { pathFill:'#0e1828', pathStroke:'rgba(33,150,243,0.22)',  evenTile:'#091220', oddTile:'#0b1424', gridLine:'rgba(33,150,243,0.07)',  glowCol:'#2196f3', glowRGB:'33,150,243'  },
    volcano:  { pathFill:'#200a00', pathStroke:'rgba(255,61,0,0.28)',    evenTile:'#150500', oddTile:'#190700', gridLine:'rgba(255,87,34,0.10)',   glowCol:'#ff3d00', glowRGB:'255,87,34'   },
    glacier:  { pathFill:'#091a28', pathStroke:'rgba(0,188,212,0.22)',   evenTile:'#061318', oddTile:'#08161e', gridLine:'rgba(0,188,212,0.07)',   glowCol:'#00bcd4', glowRGB:'0,188,212'   },
    sky:      { pathFill:'#0f0a20', pathStroke:'rgba(179,136,255,0.22)', evenTile:'#08061a', oddTile:'#0a081e', gridLine:'rgba(179,136,255,0.08)', glowCol:'#b388ff', glowRGB:'179,136,255' },
  };
  const th: AreaTheme = areaThemes[s.area] || areaThemes.suburb;

  // Grid tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const onP = s.pathSet.has(`${c},${r}`);
      if (onP) {
        ctx.fillStyle = th.pathFill;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = th.pathStroke;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      } else {
        ctx.fillStyle = (c + r) % 2 ? th.evenTile : th.oddTile;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.strokeStyle = th.gridLine;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Area-specific decorative background overlay
  if (s.area === 'volcano') {
    // Lava glow from bottom
    const lavaGrad = ctx.createLinearGradient(0, GH * 0.6, 0, GH);
    lavaGrad.addColorStop(0, 'rgba(255,87,34,0)');
    lavaGrad.addColorStop(1, `rgba(255,87,34,${0.05 + Math.sin(time * 1.5) * 0.02})`);
    ctx.fillStyle = lavaGrad; ctx.fillRect(0, 0, GW, GH);
    // Lava cracks on non-path tiles
    ctx.strokeStyle = `rgba(255,87,34,${0.08 + Math.sin(time * 2) * 0.03})`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      const cx2 = (i * 47 + 12) % GW, cy2 = (i * 37 + 20) % GH;
      ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + 15, cy2 + 10); ctx.lineTo(cx2 + 8, cy2 + 22); ctx.stroke();
    }
  } else if (s.area === 'glacier') {
    // Ice frost overlay
    ctx.fillStyle = `rgba(128,216,255,${0.015 + Math.sin(time * 0.8) * 0.005})`;
    ctx.fillRect(0, 0, GW, GH);
    // Ice crystal sparkles
    for (let i = 0; i < 6; i++) {
      const sx2 = (i * 61 + 15) % GW, sy2 = (i * 43 + 10) % GH;
      const spark = Math.sin(time * 3 + i * 1.5) * 0.5 + 0.5;
      ctx.globalAlpha = spark * 0.12;
      ctx.fillStyle = '#80d8ff';
      ctx.beginPath(); ctx.moveTo(sx2, sy2 - 4); ctx.lineTo(sx2 + 2, sy2); ctx.lineTo(sx2, sy2 + 4); ctx.lineTo(sx2 - 2, sy2); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (s.area === 'sky') {
    // Stars
    for (let i = 0; i < 12; i++) {
      const sx2 = (i * 53 + 7) % GW, sy2 = (i * 31 + 5) % (GH * 0.5);
      const twinkle = Math.sin(time * 2 + i * 0.8) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.25;
      ctx.fillStyle = '#e8eaf6';
      ctx.beginPath(); ctx.arc(sx2, sy2, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Purple sky gradient top
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GH * 0.3);
    skyGrad.addColorStop(0, 'rgba(103,58,183,0.06)');
    skyGrad.addColorStop(1, 'rgba(103,58,183,0)');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, GW, GH);
  } else if (s.area === 'downtown') {
    // City neon window lights
    for (let i = 0; i < 5; i++) {
      const wx = (i * 71 + 5) % (GW - 10), wy = (i * 43 + 8) % (GH - 10);
      const flicker = Math.sin(time * 4 + i * 2) > 0.3 ? 0.07 : 0.03;
      ctx.fillStyle = `rgba(33,150,243,${flicker})`;
      ctx.fillRect(wx, wy, 6, 4);
    }
  } else if (s.area === 'factory') {
    // Industrial diagonal lines
    ctx.strokeStyle = `rgba(255,152,0,${0.04 + Math.sin(time) * 0.01})`;
    ctx.lineWidth = 0.5;
    for (let i = -GH; i < GW + GH; i += 28) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + GH, GH); ctx.stroke();
    }
  } else if (s.area === 'suburb') {
    // Subtle green ambient
    ctx.fillStyle = `rgba(76,175,80,${0.018 + Math.sin(time * 0.5) * 0.005})`;
    ctx.fillRect(0, 0, GW, GH);
  }

  // Path glow
  s.path.forEach(([c, r], i) => {
    const pulse = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(${th.glowRGB},${0.03 + pulse * 0.05})`;
    ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
    if (i < s.path.length - 1) {
      const [nc, nr] = s.path[i + 1];
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const nx = nc * CELL + CELL / 2, ny = nr * CELL + CELL / 2;
      const t = (time * 0.5 + i * 0.1) % 1;
      const px = cx + (nx - cx) * t, py = cy + (ny - cy) * t;
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${th.glowRGB},${0.28 * (1 - t)})`;
      ctx.fill();
    }
  });

  // Start/End markers
  const [sc, sr] = s.path[0];
  const [ec, er] = s.path[s.path.length - 1];
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
    const valid = !s.pathSet.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    const S = st(pm, 0);
    if (S.rng > 0) drawRange(ctx, hc, hr, S.rng, valid ? '#a855f7' : '#ef4444');
  }

  // Hover highlight
  if (hc >= 0 && hr >= 0) {
    const key = `${hc},${hr}`; const onP = s.pathSet.has(key); const occ = !!s.grid[key];
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
    const valid = !s.pathSet.has(`${hc},${hr}`) && !s.grid[`${hc},${hr}`];
    drawTower(ctx, pm, 0, hc, hr, { alpha: 0.5, tint: valid ? '#a855f7' : '#ef4444' });
  }

  // Fire traps
  for (const trap of s.fireTraps) {
    const pulse = Math.sin(time * 4) * 0.2 + 0.8;
    ctx.globalAlpha = pulse * Math.min(1, trap.life);
    ctx.beginPath(); ctx.arc(trap.x, trap.y, CELL * 0.35, 0, Math.PI * 2);
    const fireGrad = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, CELL * 0.35);
    fireGrad.addColorStop(0, 'rgba(255,87,34,0.6)');
    fireGrad.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = fireGrad; ctx.fill();
    ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🔥', trap.x, trap.y);
    ctx.globalAlpha = 1;
  }

  // Boss wall indicator
  if (s.bossWallActive) {
    ctx.globalAlpha = 0.3 + Math.sin(time * 6) * 0.15;
    ctx.fillStyle = 'rgba(255,61,0,0.08)';
    ctx.fillRect(0, 0, GW, GH);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3d00';
    ctx.fillText(`🛡️ ボスバリア中 ${s.bossWallTimer.toFixed(1)}s`, GW / 2, 15);
  }

  // Towers
  for (const [key, cell] of Object.entries(s.grid)) {
    const [c, r] = key.split(',').map(Number);
    const disabled = !en.has(key);
    const bossDisabled = s.disabledTowers.has(key);
    const selected = key === pinKey;
    const hov = c === hc && r === hr;
    drawTower(ctx, cell.tid, cell.lv, c, r, {
      disabled, selected, bossDisabled,
      tint: hov && !pm && !selected ? '#c084fc' : null,
    });
  }

  // Enemies
  for (const e of s.enemies) {
    const { x, y } = pxy(s.path, e.pi, e.pr);
    const isBoss = e.type.startsWith('boss') || e.type === 'final_boss';
    const eRadius = isBoss ? 16 : e.type === 'tank_slime' ? 14 : 12;

    ctx.fillStyle = 'rgba(168,85,247,0.1)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

    const isFlashing = e.hitFlash > 0;
    const col = isFlashing ? '#ffffff' : e.frozen > 0 ? '#80deea' : e.burning > 0 ? '#ff7043' : EDEFS[e.type].col;
    ctx.beginPath(); ctx.arc(x, y, eRadius, 0, Math.PI * 2);
    const grd = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, eRadius);
    grd.addColorStop(0, isFlashing ? '#ffffff' : '#fff8');
    grd.addColorStop(1, col);
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = isBoss ? '#ffd700' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = isBoss ? 1.5 : 0.8; ctx.stroke();

    if (isBoss) {
      ctx.shadowBlur = 8; ctx.shadowColor = EDEFS[e.type].col;
      ctx.beginPath(); ctx.arc(x, y, eRadius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = EDEFS[e.type].col + '55'; ctx.lineWidth = 1; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (!isFlashing) {
      ctx.font = `${isBoss ? 14 : 11}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.em, x, y + 1);
    }
    if (e.frozen > 0) { ctx.font = '8px serif'; ctx.fillText('❄️', x + eRadius - 1, y - eRadius + 1); }
    else if (e.burning > 0) { ctx.font = '8px serif'; ctx.fillText('🔥', x + eRadius - 1, y - eRadius + 1); }

    // HP bar
    const bw = isBoss ? 30 : 22, bh = isBoss ? 3.5 : 2.5;
    const bx = x - bw / 2, by = y - eRadius - 5, hp = Math.max(0, e.hp / e.mhp);
    ctx.fillStyle = '#0a0a15'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    if (hp > 0.5) { hpGrad.addColorStop(0, '#a855f7'); hpGrad.addColorStop(1, '#6366f1'); }
    else if (hp > 0.25) { hpGrad.addColorStop(0, '#f97316'); hpGrad.addColorStop(1, '#ef4444'); }
    else { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(1, '#dc2626'); }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx, by, bw * hp, bh);

    // Boss name
    if (isBoss && EDEFS[e.type].name) {
      ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(EDEFS[e.type].name!.slice(0, 8), x, by - 4);
    }
  }

  // Projectiles — Neo-Cyber style
  for (const p of s.projs) {
    const t = 1 - p.life / 0.18;
    const px2 = p.sx + (p.ex - p.sx) * t;
    const py2 = p.sy + (p.ey - p.sy) * t;
    const arc = Math.sin(t * Math.PI) * 8;
    const cx2 = px2, cy2 = py2 - arc;

    // Trail gradient line
    const trailFrac = Math.min(t, 0.55);
    const trailT0 = Math.max(0, t - trailFrac);
    const trailX0 = p.sx + (p.ex - p.sx) * trailT0;
    const trailY0 = p.sy + (p.ey - p.sy) * trailT0 - Math.sin(trailT0 * Math.PI) * 8;
    ctx.save();
    const tg = ctx.createLinearGradient(trailX0, trailY0, cx2, cy2);
    tg.addColorStop(0, p.col + '00');
    tg.addColorStop(0.5, p.col + '44');
    tg.addColorStop(1, p.col + 'cc');
    ctx.strokeStyle = tg;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10; ctx.shadowColor = p.col;
    ctx.beginPath(); ctx.moveTo(trailX0, trailY0); ctx.lineTo(cx2, cy2); ctx.stroke();
    ctx.restore();

    // Outer glow ring
    ctx.beginPath(); ctx.arc(cx2, cy2, 10, 0, Math.PI * 2);
    ctx.fillStyle = p.col + '18'; ctx.fill();

    // Mid ring
    ctx.beginPath(); ctx.arc(cx2, cy2, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = p.col + '44'; ctx.fill();

    // Core white dot
    ctx.shadowBlur = 20; ctx.shadowColor = p.col;
    ctx.beginPath(); ctx.arc(cx2, cy2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.shadowBlur = 0;

    // Impact ring when near destination (t > 0.72)
    if (t > 0.72) {
      const prog = (t - 0.72) / 0.28;
      const impR = prog * 18;
      const impA = Math.floor((1 - prog) * 180).toString(16).padStart(2, '0');
      ctx.beginPath(); ctx.arc(cx2, cy2, impR, 0, Math.PI * 2);
      ctx.strokeStyle = p.col + impA;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Second ring slightly delayed
      if (prog > 0.3) {
        const prog2 = (prog - 0.3) / 0.7;
        const impR2 = prog2 * 12;
        const impA2 = Math.floor((1 - prog2) * 120).toString(16).padStart(2, '0');
        ctx.beginPath(); ctx.arc(cx2, cy2, impR2, 0, Math.PI * 2);
        ctx.strokeStyle = p.col + impA2;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
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
  }

  // Ult "All Clean" flash overlay
  if (s.ultActive) {
    const prog = s.ultTimer / 2.5;
    const wave1 = Math.sin(time * 12) * 0.15 + 0.15;
    const alpha = prog * wave1;
    const grad = ctx.createRadialGradient(GW/2, GH/2, 0, GW/2, GH/2, GW * 0.8);
    grad.addColorStop(0, `rgba(0,229,255,${alpha * 0.8})`);
    grad.addColorStop(0.5, `rgba(0,150,200,${alpha * 0.4})`);
    grad.addColorStop(1, `rgba(0,0,100,${alpha * 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GW, GH);

    // Scan line sweep effect
    const scanY = ((1 - prog) * GH * 2) % (GH + 20) - 10;
    const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
    scanGrad.addColorStop(0, 'rgba(0,229,255,0)');
    scanGrad.addColorStop(0.5, `rgba(0,229,255,${0.6 * prog})`);
    scanGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 15, GW, 30);
  }

  // Clogged tower overlay
  for (const [key] of s.cloggedTowers.entries()) {
    const [c, r] = key.split(',').map(Number);
    ctx.globalAlpha = 0.4 + Math.sin(time * 5) * 0.15;
    ctx.fillStyle = '#795548';
    rrect(ctx, c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6, 5);
    ctx.fill();
    ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 1;
    ctx.fillText('🪳', c * CELL + CELL / 2, r * CELL + CELL / 2 - 2);
  }
  ctx.globalAlpha = 1;

  // ── Freeze tile overlay (氷の面 / 氷の念) ──
  if (s.freezeTileMode !== null && s.freezeTileHP > 0) {
    const hp = s.freezeTileHP / s.freezeTileMaxHP;
    const col = s.freezeTileMode === 'wall' ? '#80d8ff' : '#4dd0e1';
    const pulse = 0.55 + Math.sin(time * 4) * 0.12;
    // Draw a crystalline tile in the center of the canvas
    const fx = GW / 2 - 22, fy = GH / 2 - 22, fw = 44, fh = 44;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = col + '33';
    rrect(ctx, fx, fy, fw, fh, 8); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    rrect(ctx, fx, fy, fw, fh, 8); ctx.stroke();
    // HP bar
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#111'; ctx.fillRect(fx, fy - 7, fw, 4);
    ctx.fillStyle = col; ctx.fillRect(fx, fy - 7, fw * hp, 4);
    // Label
    ctx.globalAlpha = 1;
    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.shadowBlur = 4; ctx.shadowColor = col;
    ctx.fillText(s.freezeTileMode === 'wall' ? '❄️氷の面' : '❄️氷の念', GW / 2, fy + fh / 2);
    ctx.fillText(`${s.freezeTileHP}/${s.freezeTileMaxHP}`, GW / 2, fy + fh / 2 + 12);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // ── Absolute Zero overlay ──
  if (s.absoluteZeroTimer > 0) {
    const alpha = 0.12 + Math.sin(time * 6) * 0.04;
    ctx.fillStyle = `rgba(128,216,255,${alpha})`;
    ctx.fillRect(0, 0, GW, GH);
    // Ice crystal border
    ctx.strokeStyle = `rgba(128,216,255,${0.3 + Math.sin(time * 3) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, GW - 4, GH - 4);
    // Countdown text
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#80d8ff';
    ctx.shadowBlur = 8; ctx.shadowColor = '#80d8ff';
    ctx.fillText(`🌨️アブゼロ ${Math.ceil(s.absoluteZeroTimer)}秒`, GW / 2, 6);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
};
