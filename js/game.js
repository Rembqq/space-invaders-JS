import Player from './player.js';
import InvaderManager from './invaders.js';
import LevelManager from './levels.js';


const CANVAS_W = 480, CANVAS_H = 640;


function rectsOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }


class ParticleEmitter{
    constructor(){ this.pool = []; }
    spawn(x,y,color,count=12){ for(let i=0;i<count;i++) this.pool.push({ x,y, vx:(Math.random()*160-80), vy:(Math.random()*-120-20), life:0.6 + Math.random()*0.6, t:0, color }); }
    update(dt){ for (let p of this.pool) p.t += dt; this.pool = this.pool.filter(p=>p.t < p.life); for (let p of this.pool){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 220*dt; } }
    render(ctx){ for (let p of this.pool){ ctx.globalAlpha = 1 - p.t/p.life; ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2,2); } ctx.globalAlpha = 1; }
}
export default class Game {
    constructor(canvas){
        this.canvas = canvas; this.ctx = canvas.getContext('2d'); canvas.width = CANVAS_W; canvas.height = CANVAS_H;
        this.hudEl = document.getElementById('hud'); this.overlay = document.getElementById('overlay'); this.message = document.getElementById('message');
        this.particles = new ParticleEmitter();
        this.keys = {};
        this.levels = new LevelManager(this);
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.lastTime = null; this.gameOver = false;
    }
    start(){ this.startGame(); requestAnimationFrame(this.loop.bind(this)); }


    startGame(){
        this.player = new Player(this, CANVAS_W/2 - 40/2, CANVAS_H - 60);
        this.enemyBullets = [];
        this.invaderManager = new InvaderManager(this);//, 4, 8);
        this.levels.loadLevel(2);
        this.score = 0; this.gameOver = false; this.powers = [];
        this.hudEl.style.display = 'block'; this.overlay.style.display = 'none';
    }

    loop(ts){ if (!this.lastTime) this.lastTime = ts; const dt = Math.min((ts - this.lastTime)/1000, 0.05); this.lastTime = ts; if (!this.gameOver){ this.update(dt); this.render(); } requestAnimationFrame(this.loop.bind(this)); }


    update(dt){
        this.player.update(dt, this.keys);
        // invaders update
        this.invaderManager.update(dt);

        // propagate invader-fired bullets
        const newShots = this.invaderManager.flushShots();
        if (newShots && newShots.length) this.enemyBullets.push(...newShots);

        // update enemy bullets
        for (let b of this.enemyBullets) b.y += b.speed*dt;
        this.enemyBullets = this.enemyBullets.filter(b => b.y < CANVAS_H + 20 && !b.hit);

        // check collisions player bullets -> invaders via manager
        for (let b of this.player.bullets){
            const hit = this.invaderManager.checkHit(b);
            if (hit){ b.hit = true; this.particles.spawn(hit.x + hit.w/2, hit.y + hit.h/2, '#ffb86b', 16); if (!hit.alive) this.score += (hit.type==='tank'?30:10); }
        }
        this.player.bullets = this.player.bullets.filter(b => !b.hit);

        // enemy bullets -> player
        for (let b of this.enemyBullets){ if (rectsOverlap(b, this.player)) { b.hit = true; this.player.hit(); this.particles.spawn(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#f44', 12); } }
        this.enemyBullets = this.enemyBullets.filter(b => !b.hit);
        // powerups
        if (this.invaderManager.powerups) this.invaderManager.powerups = this.invaderManager.powerups.filter(p => {
            p.y += 60*dt; if (rectsOverlap(p, this.player)){ this.applyPowerup(p.type); return false; } return p.y < CANVAS_H; });
        
            this.particles.update(dt);
        // invaders reach player
        if (this.invaderManager.reachedY(this.player.y)) { this.lose(); return; }

        // win check
        if (this.invaderManager.aliveCount() === 0){ this.win(); return; }
        
        this.hudEl.innerHTML = `Score: ${this.score} &nbsp; Lives: ${this.player.lives}`;
    }
    applyPowerup(type){ if (type==='triple') this.player.activatePower('triple', 8.0); else if (type==='shield') this.player.activatePower('shield', 7.0); else if (type==='slow') { this.invaderManager.speed *= 0.6; setTimeout(()=> this.invaderManager.speed /= 0.6, 7000); } }

    win(){ this.gameOver = true; this.message.textContent = `You win! Score: ${this.score}`; this.overlay.style.display = 'block'; }
    lose(){ this.gameOver = true; this.message.textContent = `Game Over — Score: ${this.score}`; this.overlay.style.display = 'block'; }

    render(){ const ctx = this.ctx; ctx.fillStyle = '#000'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
        this.player.render(ctx);
        for (let b of this.player.bullets){ ctx.fillStyle = '#fffb'; ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)); }
        ctx.fillStyle = '#f44'; for (let b of this.enemyBullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));
        this.invaderManager.render(ctx);
        // render powerups
        if (this.invaderManager.powerups) for (let p of this.invaderManager.powerups){ ctx.fillStyle = (p.type==='triple'? '#2ef' : p.type==='shield' ? '#8ef' : '#ff7f'); ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h); }
        ctx.fillStyle = '#333'; ctx.fillRect(0, CANVAS_H - 48, CANVAS_W, 6);
        this.particles.render(ctx);
    }
}

// auto-start if loaded directly
const canvas = document.getElementById('game');
const restartBtn = document.getElementById('restart');
const gameObj = new Game(canvas);
restartBtn.addEventListener('click', ()=> gameObj.startGame());
window.addEventListener('load', ()=> gameObj.start());
