// invaders.js
const INVADER_W = 30, INVADER_H = 18;
const INVADER_H_SPACING = 18, INVADER_V_SPACING = 18;
const INVADER_X_MARGIN = 30, INVADER_Y_MARGIN = 60;

export default class InvaderManager{
  constructor(game, opts = {}){
    this.game = game;

    // базовая скорость (px/s) - можно переопределить через opts.baseSpeed
    this.baseSpeed = opts.baseSpeed ?? 30;

    // Максимальный множитель скорости, когда все fast живы.
    // Пример: 2.0 — в 2 раза быстрее, 1.5 — +50% max.
    this.fastMultiplier = opts.fastMultiplier ?? 2.0;

    this.rows = 0;
    this.cols = 0;
    this.invaders = [];

    // текущее направление и таймер стрельбы
    this.dir = 1;
    this.timer = 0;
    this.fireInterval = opts.fireInterval ?? 0.6;
    this.shots = [];
    this.powerups = [];

    // подсчёт fast-юнитов
    this.totalFastCount = 0;
  }

  /**
   * spawnFormation(rows, cols, invaderTypes = [], opts = {})
   * opts может содержать: spacingH, spacingV, marginX, marginY, baseSpeed, fastMultiplier
   */
  spawnFormation(rows, cols, invaderTypes = [], opts = {}){
    // allow overriding baseSpeed/fastMultiplier per-level
    if (opts.baseSpeed !== undefined) this.baseSpeed = opts.baseSpeed;
    if (opts.fastMultiplier !== undefined) this.fastMultiplier = opts.fastMultiplier;
    if (opts.fireInterval !== undefined) this.fireInterval = opts.fireInterval;

    this.invaders.length = 0;
    this.rows = rows;
    this.cols = cols;

    const spacingH = opts.spacingH ?? INVADER_H_SPACING;
    const spacingV = opts.spacingV ?? INVADER_V_SPACING;
    const marginX  = opts.marginX  ?? INVADER_X_MARGIN;
    const marginY  = opts.marginY  ?? INVADER_Y_MARGIN;

    // helper to pick type for row r
    const pickTypeForRow = (r) => {
      if (Array.isArray(invaderTypes) && invaderTypes.length > 0){
        if (invaderTypes.length >= rows) return invaderTypes[r] ?? 'normal';
        return invaderTypes[r % invaderTypes.length];
      }
      // default behaviour
      if (r === 0) return 'fast';
      if (r === rows - 1) return 'tank';
      return 'normal';
    };

    this.totalFastCount = 0;

    for (let r = 0; r < rows; r++){
      for (let c = 0; c < cols; c++){
        const x = marginX + c*(INVADER_W + spacingH);
        const y = marginY + r*(INVADER_H + spacingV);
        const type = pickTypeForRow(r);
        let hp = 1;
        if (type === 'tank') hp = 3;
        if (type === 'armored') hp = 2;
        if (type === 'fast') this.totalFastCount++;
        this.invaders.push({
          x, y, w: INVADER_W, h: INVADER_H,
          row: r, col: c, alive: true, type, hp
        });
      }
    }

    // очистка временных буферов
    this.shots.length = 0;
    this.powerups = [];
  }

  // вычисляет currentSpeed в зависимости от живых fast-юнитов
  computeCurrentSpeed(){
    if (this.totalFastCount <= 0) return this.baseSpeed;
    // считаем количество живых fast
    let aliveFast = 0;
    for (const inv of this.invaders) if (inv.alive && inv.type === 'fast') aliveFast++;
    // доля живых
    const ratio = aliveFast / this.totalFastCount; // от 0 до 1
    // линейная интерполяция: multiplier = 1 + ratio * (fastMultiplier - 1)
    const multiplier = 1 + ratio * (this.fastMultiplier - 1);
    return this.baseSpeed * multiplier;
  }

  update(dt){
    const alive = this.invaders.filter(i=>i.alive);
    if (!alive.length) return;

    // bounding box текущей формации
    let left = Infinity, right = -Infinity;
    for (let inv of alive){ left = Math.min(left, inv.x); right = Math.max(right, inv.x + inv.w); }

    const margin = 6;
    // вычисляем текущую скорость колонны
    const currentSpeed = this.computeCurrentSpeed();

    // единый сдвиг для всей формации
    const shift = this.dir * currentSpeed * dt;

    // проекция после сдвига
    const projLeft = left + shift;
    const projRight = right + shift;

    // если после сдвига формация выйдет за границу => опускаем и меняем направление
    if (projRight > this.game.canvas.width - margin || projLeft < margin) {
      this.moveDown();
    } else {
      // безопасно сдвинуть всех одинаково
      for (let inv of alive) inv.x += shift;
    }

    // стрельба
    this.timer += dt;
    if (this.timer > this.fireInterval){
      this.timer = 0;
      this.fireFromRandomColumn();
    }
  }

  moveDown(){
    this.dir *= -1;
    for (let inv of this.invaders) if (inv.alive) inv.y += 22;

    // скорректируем X если формация вышла за края (любой overflow)
    const margin = 6;
    let left = Infinity, right = -Infinity;
    for (let inv of this.invaders) if (inv.alive){ left = Math.min(left, inv.x); right = Math.max(right, inv.x + inv.w); }

    if (right > this.game.canvas.width - margin) {
      const overflow = right - (this.game.canvas.width - margin);
      for (let inv of this.invaders) inv.x -= overflow;
    }
    if (left < margin) {
      const under = margin - left;
      for (let inv of this.invaders) inv.x += under;
    }
  }

  fireFromRandomColumn(){
    const cols = {};
    for (let inv of this.invaders) if (inv.alive){ cols[inv.col] = cols[inv.col] || []; cols[inv.col].push(inv); }
    const available = Object.keys(cols);
    if (!available.length) return;
    const col = available[Math.floor(Math.random()*available.length)];
    const bottom = cols[col].sort((a,b)=>b.row-a.row)[0];
    this.shots.push({ x: bottom.x + bottom.w/2 - 3, y: bottom.y + bottom.h, w:6, h:10, speed:160 });
  }

  flushShots(){ const s = this.shots.slice(); this.shots.length = 0; return s; }

  checkHit(bullet){
    for (let inv of this.invaders){
      if (!inv.alive) continue;
      if (bullet.x < inv.x + inv.w && bullet.x + bullet.w > inv.x && bullet.y < inv.y + inv.h && bullet.y + bullet.h > inv.y){
        inv.hp -= 1;
        bullet.hit = true;
        if (inv.hp <= 0){
          inv.alive = false;
          if (Math.random() < 0.12) this.spawnPowerup(inv.x + inv.w/2, inv.y + inv.h/2);
        }
        return inv;
      }
    }
    return null;
  }

  spawnPowerup(x,y){ this.powerups = this.powerups || []; const types = ['triple','shield','slow']; const type = types[Math.floor(Math.random()*types.length)]; this.powerups.push({ x: x-10, y, w:20, h:20, type }); }

  render(ctx){
    for (let inv of this.invaders){
      if (!inv.alive) continue;
      const palette = ['#7fff7f','#ffd27f','#ffd27f','#ff7fbf'];
      const color = palette[Math.min(inv.row, palette.length-1)];
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(inv.x), Math.round(inv.y), Math.round(inv.w), Math.round(inv.h));
      ctx.fillStyle = '#000';
      ctx.fillRect(inv.x + 6, inv.y + 6, 4,4);
      ctx.fillRect(inv.x + inv.w - 10, inv.y + 6, 4,4);
      if (inv.type === 'tank'){ ctx.strokeStyle = '#fff6'; ctx.strokeRect(inv.x-1, inv.y-1, inv.w+2, inv.h+2); }
    }
  }

  aliveCount(){ return this.invaders.filter(i=>i.alive).length; }
  reachedY(y){ for (let inv of this.invaders) if (inv.alive && inv.y + inv.h >= y) return true; return false; }
}
