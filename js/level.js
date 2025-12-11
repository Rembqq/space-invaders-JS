export const LEVELS = [
{
    id: 1,
    rows: 3,
    cols: 6,
    invaderTypes: ['normal','fast','tank'],
    description: 'Easy starter wave'
},
{
    id: 2,
    rows: 4,
    cols: 8,
    invaderTypes: ['fast','normal','tank','normal'],
    description: 'Mixed threats'
}
];
    
export default class LevelManager{
    constructor(game){ this.game = game; this.current = 0; }
    loadLevel(idx){ idx = Math.max(0, Math.min(LEVELS.length-1, idx)); this.current = idx; const cfg = LEVELS[idx]; this.game.invaderManager.spawnFormation(cfg.rows, cfg.cols); // simple
    }
    next(){ if (this.current < LEVELS.length-1) this.loadLevel(this.current+1); }
}