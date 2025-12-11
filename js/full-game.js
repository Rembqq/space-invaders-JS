export default class Game {
    constructor(canvas) { 
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CANVAS_W; canvas.height = CANVAS_H;
        
        this.hudEl = document.getElementById('hud');
        this.overlay = document.getElementById('overlay');
        this.message = document.getElementById('message');
        
        this.particles = new ParticleEmitter();
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        
        this.lastTime = null;
        this.game = null;
    }
    
        
    start(){
        this.startGame();
        requestAnimationFrame(this.loop.bind(this));
    }
        
        
    startGame(){
    // create game state
        this.player = new Player(this, CANVAS_W/2 - 40/2, CANVAS_H - 60);
        this.playerBullets = this.player.bullets; // link
        this.enemyBullets = [];
        this.invaders = [];
        this.invaderDir = 1;
        this.invaderSpeed = INVADER_BASE_SPEED;
        this.invaderTimer = 0;
        this.invaderFireInterval = 0.6;
        this.score = 0;
        this.fireTimer = 0;
        this.gameOver = false;
        this.spawnPowerupTimer = 6; // seconds until possible powerup spawn
        // create invaders
        for (let r=0;r<INVADER_ROWS;r++){
            for (let c=0;c<INVADER_COLS;c++){
                const x = INVADER_X_MARGIN + c*(INVADER_W+INVADER_H_SPACING);
                const y = INVADER_Y_MARGIN + r*(INVADER_H+INVADER_V_SPACING);
                // add type to diversify behavior
                const type = (r===0) ? 'fast' : (r===INVADER_ROWS-1) ? 'tank' : 'normal';
                const hp = (type==='tank') ? 3 : 1;
                this.invaders.push({x,y,w:INVADER_W,h:INVADER_H,row:r,col:c,alive:true,type,hp});
            }
        }

        // UI
        this.overlay.style.display = 'none';
        this.hudEl.style.display = 'block';
    }


    loop(ts){
        if (!this.lastTime) this.lastTime = ts;
        const dt = Math.min((ts - this.lastTime)/1000, 0.05);
        this.lastTime = ts;

        if (!this.gameOver){
            this.update(dt);
            this.render();
        }
        requestAnimationFrame(this.loop.bind(this));
    }
    update(dt){
        // player updates
        this.player.update(dt, this.keys);
        
        // update bullets
        for (let b of this.enemyBullets) b.y += b.speed*dt;
        this.enemyBullets = this.enemyBullets.filter(b => b.y < CANVAS_H + 20 && !b.hit);
        
        // invaders movement
        const alive = this.invaders.filter(i => i.alive);
        if (alive.length === 0){ this.win(); return; }
        
        let left = Infinity, right = -Infinity;
        for (let inv of alive){ left = Math.min(left, inv.x); right = Math.max(right, inv.x + inv.w); }
        const margin = 6;
        
        if (right + this.invaderDir * this.invaderSpeed * dt > CANVAS_W - margin && this.invaderDir === 1) {
            this.moveInvadersDown();
        } else if (left + this.invaderDir * this.invaderSpeed * dt < margin && this.invaderDir === -1) {
            this.moveInvadersDown();
        } else {
            for (let inv of alive) inv.x += this.invaderDir * this.invaderSpeed * dt * (inv.type==='fast' ? 1.4 : 1);
        }

        // invaders firing
        this.invaderTimer += dt;
        if (this.invaderTimer > this.invaderFireInterval){ this.enemyFire(); this.invaderTimer = 0; }


        // collisions: player bullets -> invaders
        for (let b of this.player.bullets){
            for (let inv of this.invaders){ if (!inv.alive) continue;
                if (rectsOverlap(b, inv)){
                    b.hit = true;
                    inv.hp -= 1;
                    if (inv.hp <= 0){ inv.alive = false; this.score += (inv.type==='tank'?30:10); this.particles.spawn(inv.x + inv.w/2, inv.y + inv.h/2, '#ffb86b', 18);
                        // шанс спавна пауэр-апа
                        if (Math.random() < 0.12) this.spawnPowerup(inv.x + inv.w/2, inv.y + inv.h/2);
                        // ускоряемся
                        this.invaderSpeed += 1.2;
                    } else {
                        // легкий feedback при попадании в живого тэнка
                        this.particles.spawn(inv.x + inv.w/2, inv.y + inv.h/2, '#ffd27f', 6);
                    }
                }
            }}
        this.player.bullets = this.player.bullets.filter(b => !b.hit && b.y + b.h > 0);

        // enemy bullets -> player
        for (let b of this.enemyBullets){ if (rectsOverlap(b, this.player)){ b.hit = true; this.player.hit(); this.particles.spawn(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#f44', 12); }}
        this.enemyBullets = this.enemyBullets.filter(b => !b.hit);

        // powerups update
        if (this.powerups) this.powerups = this.powerups.filter(p => {
            p.y += 60*dt; // fall speed
            if (rectsOverlap(p, this.player)){
                this.applyPowerup(p.type); return false;
            }
            return p.y < CANVAS_H;
        });
        this.particles.update(dt);

        // invaders reach player
        for (let inv of alive){ if (inv.y + inv.h >= this.player.y){ this.lose(); return; }}


        // HUD
        this.hudEl.innerHTML = `Score: ${this.score} &nbsp; Lives: ${this.player.lives}`;
    }


    moveInvadersDown(){
        this.invaderDir *= -1;
        for (let inv of this.invaders) if (inv.alive) inv.y += 22;
    }


    enemyFire(){
    // pick random bottom invader per column like в оригинале
        const cols = {};
        for (let inv of this.invaders) if (inv.alive){ cols[inv.col] = cols[inv.col] || []; cols[inv.col].push(inv); }
        const available = Object.keys(cols);
        if (!available.length) return;
        const col = available[Math.floor(Math.random()*available.length)];
        const bottom = cols[col].sort((a,b)=>b.row-a.row)[0];
        // shot
        this.enemyBullets.push({ x: bottom.x + bottom.w/2 - 3, y: bottom.y + bottom.h, w:6, h:10, speed: 160 });
    }
    spawnPowerup(x,y) {
        this.powerups = this.powerups || [];
        const types = ['triple','shield','slow'];
        const type = types[Math.floor(Math.random()*types.length)];
        this.powerups.push({x: x-10, y: y, w:20, h:20, type});
    }

    applyPowerup(type){
        if (type === 'triple'){
            this.player.activatePower('triple', 8.0);
        } else if (type === 'shield'){
            this.player.activatePower('shield', 7.0);
        } else if (type === 'slow'){
            this.invaderSpeed *= 0.6;
            setTimeout(()=> this.invaderSpeed /= 0.6, 7000);
        }
    }
    win(){ this.gameOver = true; this.message.textContent = `You win! Score: ${this.score}`; this.overlay.style.display = 'block'; }
    lose(){ this.gameOver = true; this.message.textContent = `Game Over — Score: ${this.score}`; this.overlay.style.display = 'block'; }


    render(){
        const ctx = this.ctx;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);


        // draw player
        this.player.render(ctx);


        // player bullets
        for (let b of this.player.bullets) { ctx.fillStyle = '#fffb'; ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)); }


        // enemy bullets
        ctx.fillStyle = '#f44';
        for (let b of this.enemyBullets) ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));


        // invaders
        for (let inv of this.invaders){ if (!inv.alive) continue; const palette = ['#7fff7f','#ffd27f','#ffd27f','#ff7fbf']; const color = palette[Math.min(inv.row, palette.length-1)];
            ctx.fillStyle = color; ctx.fillRect(Math.round(inv.x), Math.round(inv.y), Math.round(inv.w), Math.round(inv.h));
            ctx.fillStyle = '#000'; ctx.fillRect(inv.x + 6, inv.y + 6, 4,4); ctx.fillRect(inv.x + inv.w - 10, inv.y + 6, 4,4);
            // shield indicator for tank
            if (inv.type === 'tank'){
                ctx.strokeStyle = '#fff6'; ctx.strokeRect(inv.x-1, inv.y-1, inv.w+2, inv.h+2);
            }
        }


        // powerups
        if (this.powerups) for (let p of this.powerups){ ctx.fillStyle = (p.type==='triple'? '#2ef' : p.type==='shield' ? '#8ef' : '#ff7f'); ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h); }


        // ground
        ctx.fillStyle = '#333'; ctx.fillRect(0, CANVAS_H - 48, CANVAS_W, 6);

        // particles
        this.particles.render(ctx);
    }
}

// Если загружается напрямую — создаём Game
const canvas = document.getElementById('game');
const restartBtn = document.getElementById('restart');
const gameObj = new Game(canvas);
restartBtn.addEventListener('click', ()=> gameObj.startGame());
window.addEventListener('load', ()=> gameObj.start());
            