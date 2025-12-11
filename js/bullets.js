// FILE: bullets.js
// Утилиты для создания пуль. Возвращают простые объекты, совместимые с текущим кодом.
export function createPlayerBullet(x,y,vx=0){
    return { x: x - 3, y, w:6, h:10, speed: 420, vx, hit:false };
}
export function createEnemyBullet(x,y){
    return { x: x - 3, y, w:6, h:10, speed: 160, hit:false };
}


export function updateBullets(bullets, dt){
    for (let b of bullets){ b.y -= (b.speed || 0)*dt; if (b.vx) b.x += b.vx*dt; }
    return bullets.filter(b => b.y + b.h > 0 && !b.hit);
}

export function updateEnemyBullets(bullets, dt, canvasH){
    for (let b of bullets) b.y += (b.speed || 0)*dt;
    return bullets.filter(b => b.y < canvasH + 20 && !b.hit);
}