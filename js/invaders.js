const INVADER_W = 30, INVADER_H = 18;
const INVADER_H_SPACING = 18, INVADER_V_SPACING = 18;
const INVADER_X_MARGIN = 30, INVADER_Y_MARGIN = 60;


export default class InvaderManager{
    constructor(game, rows=4, cols=8){
        this.game = game;
        this.rows = rows; this.cols = cols;
        this.invaders = [];
        this.dir = 1; this.speed = 30; this.timer = 0; this.fireInterval = 0.6; this.shots = [];
        this.powerups = [];
        this.spawnFormation(rows, cols);
    }

    spawnFormation(rows, cols){
        this.invaders.length = 0;
        for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
            const x = INVADER_X_MARGIN + c*(INVADER_W + INVADER_H_SPACING);
            const y = INVADER_Y_MARGIN + r*(INVADER_H + INVADER_V_SPACING);
            const type = (r===0) ? 'fast' : (r===rows-1) ? 'tank' : 'normal';
            const hp = (type==='tank') ? 3 : 1;
            this.invaders.push({ x,y,w:INVADER_W,h:INVADER_H,row:r,col:c,alive:true,type,hp });
        }
    }

    update(dt){
        const alive = this.invaders.filter(i=>i.alive);
        if (!alive.length) return;
        let left = Infinity, right = -Infinity;
        for (let inv of alive){ left = Math.min(left, inv.x); right = Math.max(right, inv.x + inv.w); }
        const margin = 6;
        if (right + this.dir * this.speed * dt > this.game.canvas.width - margin && this.dir === 1) this.moveDown();
        else if (left + this.dir * this.speed * dt < margin && this.dir === -1) this.moveDown();
        else for (let inv of alive) inv.x += this.dir * this.speed * dt * (inv.type==='fast' ? 1.35 : 1);
        
        
        this.timer += dt;
        if (this.timer > this.fireInterval){ this.timer = 0; this.fireFromRandomColumn(); }
    }

    moveDown(){ this.dir *= -1; for (let inv of this.invaders) if (inv.alive) inv.y += 22; }


    fireFromRandomColumn(){
        const cols = {};
        for (let inv of this.invaders) if (inv.alive){ cols[inv.col] = cols[inv.col] || []; cols[inv.col].push(inv); }
        const available = Object.keys(cols);
        if (!available.length) return;
        const col = available[Math.floor(Math.random()*available.length)];
        const bottom = cols[col].sort((a,b)=>b.row-a.row)[0];
        this.shots.push({ x: bottom.x + bottom.w/2 - 3, y: bottom.y + bottom.h, w:6, h:10, speed:160 });
    }

    // возвращает массив новых выстрелов и очищает временный буфер
    flushShots(){ const s = this.shots.slice(); this.shots.length = 0; return s; }


    checkHit(bullet){
        for (let inv of this.invaders){ if (!inv.alive) continue; if (bullet.x < inv.x + inv.w && bullet.x + bullet.w > inv.x && bullet.y < inv.y + inv.h && bullet.y + bullet.h > inv.y){ inv.hp -= 1; bullet.hit = true; if (inv.hp <= 0){ inv.alive = false; // шанс пауэр-апа
            if (Math.random() < 0.12) this.spawnPowerup(inv.x + inv.w/2, inv.y + inv.h/2);
            } return inv; } }
        return null;
    }

    spawnPowerup(x,y){ this.powerups = this.powerups || []; const types = ['triple','shield','slow']; const type = types[Math.floor(Math.random()*types.length)]; this.powerups.push({ x: x-10, y, w:20, h:20, type }); }

    render(ctx){
        for (let inv of this.invaders){ if (!inv.alive) continue; const palette = ['#7fff7f','#ffd27f','#ffd27f','#ff7fbf']; const color = palette[Math.min(inv.row, palette.length-1)]; ctx.fillStyle = color; ctx.fillRect(Math.round(inv.x), Math.round(inv.y), Math.round(inv.w), Math.round(inv.h)); ctx.fillStyle = '#000'; ctx.fillRect(inv.x + 6, inv.y + 6, 4,4); ctx.fillRect(inv.x + inv.w - 10, inv.y + 6, 4,4); if (inv.type === 'tank'){ ctx.strokeStyle = '#fff6'; ctx.strokeRect(inv.x-1, inv.y-1, inv.w+2, inv.h+2); } }
    }

    aliveCount(){ return this.invaders.filter(i=>i.alive).length; }
    reachedY(y){ for (let inv of this.invaders) if (inv.alive && inv.y + inv.h >= y) return true; return false; }
}