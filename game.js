// GTA IX Prototype Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const gameState = {
    player: {
        x: 500,
        y: 350,
        width: 20,
        height: 20,
        speed: 5,
        health: 100,
        maxHealth: 100,
        money: 0,
        level: 1,
        angle: 0
    },
    enemies: [],
    npcs: [],
    bullets: [],
    missions: [],
    currentMission: null,
    keys: {},
    mousePos: { x: 0, y: 0 },
    touch: {
        movement: { x: 0, y: 0 },
        active: false,
        aiming: { x: 0, y: 0 },
        aimingActive: false
    }
};

// Touch Controls Setup
const touchControls = {
    leftJoystick: { x: 100, y: canvas.height - 100, radius: 60 },
    rightJoystick: { x: canvas.width - 100, y: canvas.height - 100, radius: 60 },
    shootButton: { x: canvas.width - 80, y: 80, radius: 40 }
};

// Input Handling - Keyboard
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
    
    if (e.key === 'm' || e.key === 'M') {
        showMissionMenu();
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// Input Handling - Mouse
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mousePos.x = e.clientX - rect.left;
    gameState.mousePos.y = e.clientY - rect.top;
});

window.addEventListener('click', shoot);

// Touch Controls - Joysticks and Buttons
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchmove', handleTouchMove, false);
canvas.addEventListener('touchend', handleTouchEnd, false);

function handleTouchStart(e) {
    e.preventDefault();
    const touches = e.touches;
    
    for (let touch of touches) {
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Left joystick (movement)
        const distLeft = Math.sqrt(
            Math.pow(x - touchControls.leftJoystick.x, 2) + 
            Math.pow(y - touchControls.leftJoystick.y, 2)
        );
        
        if (distLeft < touchControls.leftJoystick.radius * 2) {
            gameState.touch.movement = { x, y };
            gameState.touch.active = true;
        }
        
        // Right joystick (aiming)
        const distRight = Math.sqrt(
            Math.pow(x - touchControls.rightJoystick.x, 2) + 
            Math.pow(y - touchControls.rightJoystick.y, 2)
        );
        
        if (distRight < touchControls.rightJoystick.radius * 2) {
            gameState.touch.aiming = { x, y };
            gameState.touch.aimingActive = true;
        }
        
        // Shoot button
        const distShoot = Math.sqrt(
            Math.pow(x - touchControls.shootButton.x, 2) + 
            Math.pow(y - touchControls.shootButton.y, 2)
        );
        
        if (distShoot < touchControls.shootButton.radius) {
            shoot();
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touches = e.touches;
    
    for (let touch of touches) {
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Update left joystick
        const distLeft = Math.sqrt(
            Math.pow(x - touchControls.leftJoystick.x, 2) + 
            Math.pow(y - touchControls.leftJoystick.y, 2)
        );
        
        if (distLeft < touchControls.leftJoystick.radius * 2.5) {
            gameState.touch.movement = { x, y };
        }
        
        // Update right joystick
        const distRight = Math.sqrt(
            Math.pow(x - touchControls.rightJoystick.x, 2) + 
            Math.pow(y - touchControls.rightJoystick.y, 2)
        );
        
        if (distRight < touchControls.rightJoystick.radius * 2.5) {
            gameState.touch.aiming = { x, y };
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    gameState.touch.active = false;
    gameState.touch.aimingActive = false;
}

// Player Movement - Touch and Keyboard
function updatePlayer() {
    const keys = gameState.keys;
    
    // Keyboard movement
    if (keys['w'] || keys['arrowup']) {
        gameState.player.y -= gameState.player.speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        gameState.player.y += gameState.player.speed;
    }
    if (keys['a'] || keys['arrowleft']) {
        gameState.player.x -= gameState.player.speed;
    }
    if (keys['d'] || keys['arrowright']) {
        gameState.player.x += gameState.player.speed;
    }
    
    // Touch joystick movement
    if (gameState.touch.active) {
        const dx = gameState.touch.movement.x - touchControls.leftJoystick.x;
        const dy = gameState.touch.movement.y - touchControls.leftJoystick.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = touchControls.leftJoystick.radius;
        
        if (distance > 10) {
            const angle = Math.atan2(dy, dx);
            gameState.player.x += Math.cos(angle) * gameState.player.speed;
            gameState.player.y += Math.sin(angle) * gameState.player.speed;
        }
    }
    
    // Boundary checking
    gameState.player.x = Math.max(0, Math.min(canvas.width - gameState.player.width, gameState.player.x));
    gameState.player.y = Math.max(0, Math.min(canvas.height - gameState.player.height, gameState.player.y));
    
    // Calculate angle to mouse or touch aiming
    let targetX = gameState.mousePos.x;
    let targetY = gameState.mousePos.y;
    
    if (gameState.touch.aimingActive) {
        targetX = gameState.touch.aiming.x;
        targetY = gameState.touch.aiming.y;
    }
    
    const dx = targetX - gameState.player.x;
    const dy = targetY - gameState.player.y;
    gameState.player.angle = Math.atan2(dy, dx);
}

// Shooting
function shoot() {
    const bullet = {
        x: gameState.player.x,
        y: gameState.player.y,
        vx: Math.cos(gameState.player.angle) * 7,
        vy: Math.sin(gameState.player.angle) * 7,
        radius: 4,
        damage: 10
    };
    gameState.bullets.push(bullet);
}

function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        return bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height;
    });
}

// NPCs (Mission Givers)
function createNPCs() {
    gameState.npcs = [
        { x: 150, y: 150, name: 'Tony', mission: 0, color: '#ff0000', radius: 15 },
        { x: 800, y: 600, name: 'Lucia', mission: 1, color: '#0000ff', radius: 15 },
        { x: 500, y: 100, name: 'Marco', mission: 2, color: '#ffff00', radius: 15 }
    ];
}

// Missions
function createMissions() {
    gameState.missions = [
        {
            id: 0,
            name: 'Eliminate Threats',
            description: 'Defeat 5 enemies in the area',
            reward: 500,
            completed: false,
            enemiesKilled: 0,
            targetEnemies: 5
        },
        {
            id: 1,
            name: 'Defend the Base',
            description: 'Survive wave of enemies for 30 seconds',
            reward: 750,
            completed: false,
            timeLimit: 30000,
            startTime: null
        },
        {
            id: 2,
            name: 'Steal the Money Bag',
            description: 'Reach the money bag and return to start',
            reward: 1000,
            completed: false,
            targetX: 800,
            targetY: 100,
            collected: false
        }
    ];
}

function startMission(missionId) {
    gameState.currentMission = gameState.missions[missionId];
    if (gameState.currentMission.id === 1) {
        gameState.currentMission.startTime = Date.now();
        spawnWaveEnemies(5);
    } else if (gameState.currentMission.id === 0) {
        spawnEnemies(5);
    }
    updateHUD();
}

function showMissionMenu() {
    let menu = 'AVAILABLE MISSIONS:\n\n';
    gameState.missions.forEach(mission => {
        const status = mission.completed ? '✓ COMPLETED' : 'AVAILABLE';
        menu += `${mission.id + 1}. ${mission.name} - Reward: $${mission.reward} [${status}]\n`;
    });
    menu += '\nEnter mission number (1-3):';
    
    const choice = prompt(menu);
    if (choice && choice >= 1 && choice <= 3) {
        startMission(parseInt(choice) - 1);
    }
}

// Enemies
function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const distance = 200;
        gameState.enemies.push({
            x: gameState.player.x + Math.cos(angle) * distance,
            y: gameState.player.y + Math.sin(angle) * distance,
            vx: 0,
            vy: 0,
            speed: 2,
            radius: 12,
            health: 30,
            maxHealth: 30,
            angle: 0,
            color: '#ff5555'
        });
    }
}

function spawnWaveEnemies(count) {
    // Spawn enemies at edges
    const positions = [
        { x: 50, y: 350 },
        { x: canvas.width - 50, y: 350 },
        { x: 500, y: 50 },
        { x: 500, y: canvas.height - 50 },
        { x: 100, y: 100 }
    ];
    
    for (let i = 0; i < count; i++) {
        const pos = positions[i % positions.length];
        gameState.enemies.push({
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            speed: 1.5,
            radius: 12,
            health: 25,
            maxHealth: 25,
            angle: 0,
            color: '#ff3333'
        });
    }
}

function updateEnemies() {
    gameState.enemies.forEach(enemy => {
        // AI: Move towards player
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.vx = (dx / distance) * enemy.speed;
            enemy.vy = (dy / distance) * enemy.speed;
        }
        
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.angle = Math.atan2(dy, dx);
    });
    
    // Check collisions with player
    gameState.enemies.forEach(enemy => {
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < gameState.player.width / 2 + enemy.radius) {
            gameState.player.health -= 0.5;
        }
    });
}

function updateBulletEnemyCollisions() {
    gameState.bullets.forEach((bullet, bulletIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.radius + enemy.radius) {
                enemy.health -= bullet.damage;
                gameState.bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    gameState.enemies.splice(enemyIndex, 1);
                    gameState.player.money += 50;
                    gameState.player.level = Math.floor(gameState.player.money / 500) + 1;
                    
                    if (gameState.currentMission && gameState.currentMission.id === 0) {
                        gameState.currentMission.enemiesKilled++;
                    }
                }
            }
        });
    });
}

function checkMissionCompletion() {
    if (!gameState.currentMission) return;
    
    const mission = gameState.currentMission;
    
    if (mission.id === 0 && mission.enemiesKilled >= mission.targetEnemies) {
        completeMission();
    } else if (mission.id === 1) {
        const elapsed = (Date.now() - mission.startTime) / 1000;
        if (elapsed >= mission.timeLimit / 1000) {
            completeMission();
        }
    } else if (mission.id === 2) {
        // Check if player reached money bag
        const dx = gameState.player.x - mission.targetX;
        const dy = gameState.player.y - mission.targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30 && !mission.collected) {
            mission.collected = true;
        }
        
        // Check if back at start
        if (mission.collected && gameState.player.x < 100 && gameState.player.y < 100) {
            completeMission();
        }
    }
}

function completeMission() {
    gameState.player.money += gameState.currentMission.reward;
    gameState.currentMission.completed = true;
    alert(`Mission Complete! Earned $${gameState.currentMission.reward}`);
    gameState.currentMission = null;
    gameState.enemies = [];
    updateHUD();
}

// Drawing
function drawPlayer() {
    ctx.save();
    ctx.translate(gameState.player.x, gameState.player.y);
    ctx.rotate(gameState.player.angle);
    
    // Body
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-gameState.player.width / 2, -gameState.player.height / 2, gameState.player.width, gameState.player.height);
    
    // Gun
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gameState.player.width / 2, 0);
    ctx.lineTo(gameState.player.width / 2 + 15, 0);
    ctx.stroke();
    
    ctx.restore();
}

function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2 * healthPercent, 4);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 4);
    });
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    gameState.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawNPCs() {
    gameState.npcs.forEach(npc => {
        ctx.fillStyle = npc.color;
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Outline if mission available
        if (!gameState.missions[npc.mission].completed) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x, npc.y + npc.radius + 15);
    });
}

function drawMissionTarget() {
    if (!gameState.currentMission) return;
    
    const mission = gameState.currentMission;
    
    if (mission.id === 2 && mission.targetX) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mission.targetX, mission.targetY, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        if (mission.collected) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fill();
        }
    }
}

function drawPlayerHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health bar
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Health: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, x + barWidth / 2, y + 15);
}

function drawMissionInfo() {
    if (!gameState.currentMission) return;
    
    const mission = gameState.currentMission;
    const x = canvas.width - 300;
    const y = 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 280, 120);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 280, 120);
    
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(mission.name, x + 10, y + 25);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.fillText(mission.description, x + 10, y + 45);
    
    if (mission.id === 0) {
        ctx.fillText(`Enemies Eliminated: ${mission.enemiesKilled}/${mission.targetEnemies}`, x + 10, y + 65);
    } else if (mission.id === 1) {
        const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
        ctx.fillText(`Time Survived: ${elapsed}/${mission.timeLimit / 1000}s`, x + 10, y + 65);
    } else if (mission.id === 2) {
        ctx.fillText(`Collected: ${mission.collected ? 'Yes' : 'No'}`, x + 10, y + 65);
    }
    
    ctx.fillText(`Reward: $${mission.reward}`, x + 10, y + 85);
}

// Draw Touch Controls
function drawTouchControls() {
    // Left Joystick (Movement)
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(touchControls.leftJoystick.x, touchControls.leftJoystick.y, touchControls.leftJoystick.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Joystick stick
    if (gameState.touch.active) {
        const dx = gameState.touch.movement.x - touchControls.leftJoystick.x;
        const dy = gameState.touch.movement.y - touchControls.leftJoystick.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = touchControls.leftJoystick.radius * 0.6;
        
        const actualDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        const stickX = touchControls.leftJoystick.x + Math.cos(angle) * actualDistance;
        const stickY = touchControls.leftJoystick.y + Math.sin(angle) * actualDistance;
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(stickX, stickY, 20, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(touchControls.leftJoystick.x, touchControls.leftJoystick.y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MOVE', touchControls.leftJoystick.x, touchControls.leftJoystick.y + touchControls.leftJoystick.radius + 20);
    
    // Right Joystick (Aiming)
    ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(touchControls.rightJoystick.x, touchControls.rightJoystick.y, touchControls.rightJoystick.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Joystick stick
    if (gameState.touch.aimingActive) {
        const dx = gameState.touch.aiming.x - touchControls.rightJoystick.x;
        const dy = gameState.touch.aiming.y - touchControls.rightJoystick.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = touchControls.rightJoystick.radius * 0.6;
        
        const actualDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        const stickX = touchControls.rightJoystick.x + Math.cos(angle) * actualDistance;
        const stickY = touchControls.rightJoystick.y + Math.sin(angle) * actualDistance;
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(stickX, stickY, 20, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(touchControls.rightJoystick.x, touchControls.rightJoystick.y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AIM', touchControls.rightJoystick.x, touchControls.rightJoystick.y + touchControls.rightJoystick.radius + 20);
    
    // Shoot Button
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(touchControls.shootButton.x, touchControls.shootButton.y, touchControls.shootButton.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOOT', touchControls.shootButton.x, touchControls.shootButton.y);
}

function updateHUD() {
    document.getElementById('health').textContent = Math.ceil(gameState.player.health);
    document.getElementById('money').textContent = gameState.player.money;
    document.getElementById('level').textContent = gameState.player.level;
    
    if (gameState.currentMission) {
        document.getElementById('missionText').textContent = `Mission: ${gameState.currentMission.name}`;
    } else {
        document.getElementById('missionText').textContent = 'No active mission (Press M)';
    }
}

// Main Game Loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 58, 82, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update
    updatePlayer();
    updateEnemies();
    updateBullets();
    updateBulletEnemyCollisions();
    checkMissionCompletion();
    
    // Game Over check
    if (gameState.player.health <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Reload the page to restart', canvas.width / 2, canvas.height / 2 + 50);
        return;
    }
    
    // Draw
    drawMissionTarget();
    drawEnemies();
    drawBullets();
    drawNPCs();
    drawPlayer();
    drawPlayerHealthBar();
    drawMissionInfo();
    drawTouchControls();
    
    updateHUD();
    requestAnimationFrame(gameLoop);
}

// Initialize and Start
createMissions();
createNPCs();
gameLoop();