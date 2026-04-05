// Sprite loader for pixel art assets
import type { TowerID, EnemyType } from './types';

import towerCord from '@/assets/tower-cord.png';
import towerKettle from '@/assets/tower-kettle.png';
import towerFan from '@/assets/tower-fan.png';
import towerLamp from '@/assets/tower-lamp.png';
import towerVacuum from '@/assets/tower-vacuum.png';
import towerRouter from '@/assets/tower-router.png';
import towerFridge from '@/assets/tower-fridge.png';
import towerAircon from '@/assets/tower-aircon.png';
import towerMicrowave from '@/assets/tower-microwave.png';
import towerWasher from '@/assets/tower-washer.png';
import towerTheater from '@/assets/tower-theater.png';
import towerSuperpc from '@/assets/tower-superpc.png';
import towerPlasma from '@/assets/tower-plasma.png';

import enemyDust from '@/assets/enemy-dust.png';
import enemySlime from '@/assets/enemy-slime.png';
import enemyMagnet from '@/assets/enemy-magnet.png';
import enemyVirus from '@/assets/enemy-virus.png';
import enemyBoss from '@/assets/enemy-boss.png';

const TOWER_SRCS: Record<TowerID, string> = {
  cord: towerCord, kettle: towerKettle, fan: towerFan, lamp: towerLamp,
  vacuum: towerVacuum, router: towerRouter, fridge: towerFridge, aircon: towerAircon,
  microwave: towerMicrowave, washer: towerWasher, theater: towerTheater,
  superpc: towerSuperpc, plasma: towerPlasma,
};

const ENEMY_SRCS: Record<EnemyType, string> = {
  dust: enemyDust, slime: enemySlime, magnet: enemyMagnet,
  virus: enemyVirus, boss: enemyBoss,
};

const imgCache = new Map<string, HTMLImageElement>();

const loadImg = (src: string): HTMLImageElement => {
  if (imgCache.has(src)) return imgCache.get(src)!;
  const img = new Image();
  img.src = src;
  imgCache.set(src, img);
  return img;
};

export const getTowerSprite = (tid: TowerID): HTMLImageElement => loadImg(TOWER_SRCS[tid]);
export const getEnemySprite = (et: EnemyType): HTMLImageElement => loadImg(ENEMY_SRCS[et]);

// Preload all sprites
export const preloadSprites = () => {
  Object.values(TOWER_SRCS).forEach(loadImg);
  Object.values(ENEMY_SRCS).forEach(loadImg);
};
