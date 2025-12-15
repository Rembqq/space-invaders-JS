// js/ui.js
export default class UI {
    constructor(game) {
      this.game = game;
      this.container = null;
      this.levelButtons = [];
      this.levelCount = (game.levels && game.levels.gameLevelsCount) ? game.levels.gameLevelsCount() : 3;
      // fallback до 3 если LevelManager не имеет метода
      if (!this.levelCount) this.levelCount = 3;
      this.storageKeyPrefix = 'si_high_'; // highscore key prefix (per level index)
      this.init();
    }
  
    init() {

      // create container
      this.container = document.createElement('div');
      this.container.id = 'ui-panel';
      
      this.container.style.position = 'absolute';
      this.container.style.top = '12px';
      this.container.style.right = '12px';
      this.container.style.padding = '8px';
      this.container.style.background = 'rgba(0,0,0,0.45)';
      this.container.style.borderRadius = '8px';
      this.container.style.color = '#fff';
      this.container.style.fontWeight = '700';
      this.container.style.zIndex = '20';
      this.container.style.backdropFilter = 'blur(4px)';
  
      const title = document.createElement('div');
      title.textContent = 'Level';
      title.style.marginBottom = '6px';
      title.style.textAlign = 'center';
      this.container.appendChild(title);
  
      const buttonsRow = document.createElement('div');
      buttonsRow.style.display = 'flex';
      buttonsRow.style.gap = '6px';
      buttonsRow.style.justifyContent = 'center';
      buttonsRow.style.marginBottom = '8px';
  
      for (let i = 0; i < this.levelCount; i++) {
        const btn = document.createElement('button');
        btn.textContent = (i + 1).toString();
        btn.dataset.levelIndex = i;
        btn.style.padding = '6px 10px';
        btn.style.fontWeight = '700';
        btn.style.cursor = 'pointer';
  
        btn.addEventListener('click', () => {
          this.onSelectLevel(i);
        });
  
        this.levelButtons.push(btn);
        buttonsRow.appendChild(btn);
      }
  
      this.container.appendChild(buttonsRow);
  
      // highscore area
      this.hsContainer = document.createElement('div');
      this.hsContainer.style.fontSize = '13px';
      this.hsContainer.style.lineHeight = '1.1';
      this.updateHighscores();
      this.container.appendChild(this.hsContainer);
  
      // add a reset button
      const reset = document.createElement('div');
      reset.style.marginTop = '8px';
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset highs';
      resetBtn.style.fontSize = '12px';
      resetBtn.style.padding = '4px 8px';
      resetBtn.addEventListener('click', () => {
        if (!confirm('Reset all level highs?')) return;
        this.resetHighscores();
      });
      reset.appendChild(resetBtn);
      this.container.appendChild(reset);
      
      // pause button
      this.pauseBtn = document.createElement('button');
      this.pauseBtn.textContent = 'Pause';
      this.pauseBtn.style.marginTop = '6px';
      this.pauseBtn.style.width = '100%';
      this.pauseBtn.style.padding = '6px';
      this.pauseBtn.style.fontWeight = '700';
      this.pauseBtn.style.cursor = 'pointer';

      this.pauseBtn.addEventListener('click', () => {
        if (!this.game) return;
        this.game.togglePause();
        this.updatePauseButton();
      });

      this.container.appendChild(this.pauseBtn);

      document.body.appendChild(this.container);
    }
  
    // called when user clicks level button
    onSelectLevel(levelIndex) {
      // update visual selection
      this.selectButton(levelIndex);
      // call LevelManager to load that level (by index)
      if (this.game && this.game.levels) {
        this.game.levels.loadLevel(levelIndex);
      }
      // restart / start game at this level
      // pass levelIndex to startGame so it won't override selection
      if (this.game && typeof this.game.startGame === 'function') {
        this.game.startGame(levelIndex);
      }
      // refresh highs (no change but safe)
      this.updateHighscores();
    }
  
    // highlight selected button
    selectButton(idx) {
      this.levelButtons.forEach((b, i) => {
        b.style.outline = (i === idx) ? '2px solid #fff6' : 'none';
        b.style.opacity = (i === idx) ? '1' : '0.85';
      });
    }
  
    updatePauseButton() {
      if (!this.pauseBtn || !this.game) return;
      this.pauseBtn.textContent = this.game.paused ? 'Resume' : 'Pause';
    }
    

    // read highs from localStorage and render
    updateHighscores() {
      let html = '';
      for (let i = 0; i < this.levelCount; i++) {
        const key = this.storageKeyPrefix + i;
        const hs = localStorage.getItem(key) || 0;
        html += `L${i+1}: <span style="color:#ffd27f">${hs}</span><br/>`;
      }
      this.hsContainer.innerHTML = html;
    }
  
    // update a single level high (called by game)
    setHighForLevel(levelIndex, score) {
      const key = this.storageKeyPrefix + levelIndex;
      const prev = parseInt(localStorage.getItem(key) || '0', 10);
      if (score > prev) {
        localStorage.setItem(key, String(score));
      }
      this.updateHighscores();
    }
  
    resetHighscores() {
      for (let i = 0; i < this.levelCount; i++) {
        localStorage.removeItem(this.storageKeyPrefix + i);
      }
      this.updateHighscores();
    }
  }
  