// FILE: player.js
// Экспорт: default class Player

export default class Player{
    constructor(game, x, y){
      this.game = game;
      this.x = x; this.y = y; this.w = 40; this.h = 12;
      this.speed = 260; this.lives = 3;
      this.bullets = []; // пул примитивный
      this.fireCooldown = 0.32; this.fireTimer = 0;
  
      // power-up state
      this.powers = { triple: {active:false,t:0}, shield: {active:false,t:0} };
    }
  
    update(dt, keys){
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed*dt;
        if (keys['ArrowRight']|| keys['KeyD']) this.x += this.speed*dt;
        this.x = Math.max(6, Math.min(480 - this.w - 6, this.x));
        this.fireTimer -= dt;
        if ((keys['Space'] || keys['KeyW'] || keys['ArrowUp']) && this.fireTimer <= 0){ this.shoot(); this.fireTimer = this.fireCooldown; }
        
        
        // update bullets
        for (let b of this.bullets) {
            b.y -= b.speed*dt;
        }
        this.bullets = this.bullets.filter( b => {
            if (b.hit) return false;
            if (b.y + b.h <= 0) {
                this.game.adjustScore(-1);
                return false;
            }
            return true;
        });
        
        
        // power timers
        for (let k of Object.keys(this.powers)){
            const p = this.powers[k];
            if (p.active){ p.t -= dt; if (p.t <= 0) { p.active = false; } }
        }
    }
  
    shoot(){
        // triple-shot if active
        const centerX = this.x + this.w/2;
        if (this.powers.triple.active){
            this.spawnBullet(centerX - 12, this.y - 12, -6);
            this.spawnBullet(centerX, this.y - 12, 0);
            this.spawnBullet(centerX + 12, this.y - 12, 6);
        } else {
            this.spawnBullet(centerX, this.y - 12, 0);
        }
    }
  
    spawnBullet(x,y,dx){
        this.bullets.push({ x: x - 3, y, w:6, h:10, speed: 420, vx: dx });
    }
        
        
    activatePower(name, duration){
        if (!this.powers[name]) this.powers[name] = {active:false,t:0};
        this.powers[name].active = true; this.powers[name].t = duration;
    }
  
    hit(){
      if (this.powers.shield.active){ this.powers.shield.active = false; return; }
      this.game.adjustScore(-50);
      this.lives -= 1;
      this.bullets = [];
      console.log("Evrything fine");
      this.game.enemyBullets = [];
      this.x = 480/2 - this.w/2;
      if (this.lives <= 0) this.game.lose();
    }
  
    render(ctx){
      // ship body
      ctx.fillStyle = '#2ef'; ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
      // shield
      if (this.powers.shield.active){ ctx.strokeStyle = '#8ef'; ctx.beginPath(); ctx.arc(this.x + this.w/2, this.y + this.h/2, 28, 0, Math.PI*2); ctx.stroke(); }
  
      // simple thruster effect (pulsing)
      const t = Date.now()%600/600;
      const h = 4 + Math.sin(t*Math.PI*2)*1.5;
      ctx.fillStyle = '#ffb86b'; ctx.fillRect(this.x + 10, this.y + this.h, 20, h);
    }
  }
  