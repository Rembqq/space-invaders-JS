// levels.js
export const LEVELS = [
    {
      id: 1,
      rows: 3,
      cols: 6,
      invaderTypes: ['normal','fast','tank'],
      description: 'Easy starter wave',
      // опции для spawnFormation
      opts: {
        baseSpeed: 28,
        fastMultiplier: 1.5, // +50% max если все fast живы
        fireInterval: 0.8
      }
    },
    {
      id: 2,
      rows: 5,
      cols: 10,
      invaderTypes: ['fast','normal','tank','normal','fast'],
      description: 'Mixed threats (bigger)',
      opts: {
        baseSpeed: 26,
        fastMultiplier: 2.0, // в 2 раза быстрее если все fast живы
        fireInterval: 0.55,
        spacingH: 8,   // меньше расстояние между колонками — пример
        spacingV: 16
      }
    },
    // пример уровня с очень быстрым роем
    {
      id: 3,
      rows: 6,
      cols: 12,
      invaderTypes: ['fast'],
      description: 'Fast swarm',
      opts: {
        baseSpeed: 22,
        fastMultiplier: 1.7,
        fireInterval: 0.45,
        spacingH: 4
      }
    }
  ];
  
  export default class LevelManager{
    constructor(game){
      this.game = game;
      this.current = 0;
    }
  
    loadLevel(idx){
      idx = Math.max(0, Math.min(LEVELS.length-1, idx));
      this.current = idx;
      const cfg = LEVELS[idx];
  
      // fallbacks: если opts нет, передаём пустой объект
      const opts = cfg.opts || {};
      // прокидываем invaderTypes и opts в spawnFormation
      this.game.invaderManager.spawnFormation(cfg.rows, cfg.cols, cfg.invaderTypes, opts);
  
      // очистка состояния игры (рекомендуется)
      if (this.game.player) this.game.player.bullets = [];
      this.game.enemyBullets = [];
      this.game.score = 0;
    }
  
    next(){
      if (this.current < LEVELS.length-1) this.loadLevel(this.current+1);
    }
  }
  