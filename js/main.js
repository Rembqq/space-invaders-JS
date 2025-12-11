// FILE: main.js
// Использование: подключи в index.html как <script type="module" src="/js/main.js"></script>
// main.js — точка входа, содержит Game класс, рендер, волны врагов, простая система пауэр-апов и частицы.


import Player from './player.js';


// ====== Константы ======
const CANVAS_W = 480, CANVAS_H = 640;
const INVADER_ROWS = 4, INVADER_COLS = 8;
const INVADER_W = 30, INVADER_H = 18;
const INVADER_H_SPACING = 18, INVADER_V_SPACING = 18;
const INVADER_X_MARGIN = 30, INVADER_Y_MARGIN = 60;
const INVADER_BASE_SPEED = 30;


// ====== Хелперы ======
function randRange(a,b){ return a + Math.random()*(b-a); }
function rectsOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }


// ====== Простейшая система частиц (для взрывов) ======
class ParticleEmitter{
    constructor() {
        this.pool = [];
    }
    spawn(x,y,color,count=12){
        for(let i=0;i<count;i++){
            this.pool.push({
                x, y,
                vx: randRange(-80,80), vy: randRange(-140, -20),
                life: randRange(0.4,0.9), color, t:0
            });
        }
    }
    update(dt){
        for (let p of this.pool) p.t += dt;
        this.pool = this.pool.filter(p => p.t < p.life);
        for (let p of this.pool){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 200*dt; }
    }
    render(ctx){
        for (let p of this.pool){
            const a = 1 - p.t/p.life;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = a;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), 2,2);
        }
        ctx.globalAlpha = 1;
    }
}