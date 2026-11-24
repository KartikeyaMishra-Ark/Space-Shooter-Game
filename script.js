
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width
const HEIGHT = canvas.height;
let audioCtx = null;
let masterGain = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

function initializeAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.55;
        masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playTone(frequency, duration, type = "square", volume = 0.07, slideTo = null) {
    if (!audioCtx || muted) return;

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const now = audioCtx.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(
            slideTo,
            now + duration
        );
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
}

function playNoise(duration, volume = 0.08) {
    if (!audioCtx || muted) return;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
    )

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();

    source.buffer = buffer;

    const now = audioCtx.currentTime;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gain);
    gain.connect(masterGain);

    source.start();
}


function soundRedShot() {
    playTone(240, 0.09, "square", 0.055, 110);
}

function soundLaser() {
    playTone(880, 0.18, "sawtooth", 0.045, 150);
    playTone(440, 0.2, "triangle", 0.035, 100);
}

function soundEnemyHit() {
    playTone(180, 0.07, "square", 0.045, 90);
}

function soundExplosion() {
    playNoise(0.2, 0.1);
    playTone(120, 0.25, "sawtooth", 0.07, 40);
}

function soundPlayerHit() {
    playTone(180, 0.25, "sawtooth", 0.09, 55);
    playTone(90, 0.2, "square", 0.045, 40);
}

function soundPickup() {
    playTone(520, 0.09, "square", 0.06);
    setTimeout(() => playTone(780, 0.12, "square", 0.06), 90);
    setTimeout(() => playTone(1040, 0.15, "square", 0.06), 180);
}

function soundWaveClear() {
    playTone(523, 0.13, "square", 0.06);
    setTimeout(() => playTone(659, 0.13, "square", 0.06), 140);
    setTimeout(() => playTone(784, 0.13, "square", 0.06), 280);
    setTimeout(() => playTone(1046, 0.3, "square", 0.07), 420);
}

function soundGameOver() {
    playTone(440, 0.3, "square", 0.06, 330);
    setTimeout(() => playTone(330, 0.3, "square", 0.06, 220), 300);
    setTimeout(() => playTone(220, 0.6, "square", 0.07, 80), 600);
}


function startMusic() {
    if (musicTimer !== null || muted) return;

    const melody = [
        392, 0, 392, 523,
        587, 0, 523, 392,
        330, 0, 330, 392,
        523, 0, 440, 392
    ]

    const bass = [98, 98, 131, 131, 110, 110, 82, 82];

    musicStep = 0;

    musicTimer = setInterval(() => {
        if (gameState !== "playing" || gameOver || muted) return;

        const note = melody[musicStep % melody.length];

        if (note !== 0) {
            playTone(note, 0.14, "square", 0.035);
        }

        if (musicStep % 2 === 0) {
            const bassNote = bass[Math.floor(musicStep / 2) % bass.length];
            playTone(bassNote, 0.25, "triangle", 0.045);
        }

        musicStep++;
    }, 180)
}

function stopMusic() {
    if (musicTimer !== null) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

function toggleMute() {
    muted = !muted;

    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(
            muted ? 0 : 0.55,
            audioCtx.currentTime,
            0.03
        );
    }

    if (muted) {
        stopMusic();
    } else if (gameState === "playing" && !gameOver) {
        startMusic();
    }

    console.log(muted ? "Audio muted" : "Audio enabled");
}

const stars = [];
let score = 0;
const particles = [];
const laserImpacts = [];
let formationDirection = 1;
let formationSpeed = 3.5;
let formationDrop = 35;
let volleyCooldown = 120;
let volleyActive = false;
let volleyEnemies = [];
let volleyIndex = 0;
let volleyShotDelay = 12;

const ENEMY_TYPES = {

    scout: {
        health: 2,
        attack: "formation",
        bulletSpeed:3.5,
        cooldownMin: 46,
        cooldownMax:75,
        score: 100,
        diveRate: 0.025
    },



    striker: {
        health: 3,
        attack: "targeted",
        bulletSpeed: 4.2,
        cooldownMin: 55,
        cooldownMax: 85,
        score: 150,
        diveRate: 0.022
    },

    bomber: {
        health: 5,
        attack: "spread",
        bulletSpeed:3.3,
        cooldownMin: 80,
        cooldownMax:140,
        score:200,
        diveRate: 0.018
    },
    diver: {
        health: 3,
        attack: "dive",
        bulletSpeed: 0,
        cooldownMin: 150,
        cooldownMax: 250,
        score: 175,
        diveRate:0.018
    }
}
const DIFFICULTIES = {
    easy: {
        enemyHealth: 0.65,
        enemySpeed: 0.65,
        enemyAttackRate: 1.7,
        playerLives: 5
    },

    medium: {
        enemyHealth: 0.8,
        enemySpeed: 0.8,
        enemyAttackRate: 1.3,
        playerLives: 4
    },
    hard: {
        enemyHealth: 0.9,
        enemySpeed: 0.9,
        enemyAttackRate: 1.15,
        playerLives: 3
    },
    extreme: {
        enemyHealth: 1,
        enemySpeed: 1,
        enemyAttackRate: 1,
        playerLives: 3
    }
}
let difficulty = DIFFICULTIES.extreme;
function getEnemyType(row, col) {

    if (currentWave === 1) {
        return "scout";
    }

    if (currentWave === 2) {
        return row === 0 || col % 3 === 0
            ? "striker"
            : "scout";
    }

    if (currentWave <= 4) {
        if (row === 0) return "bomber";

        return col % 4 === 0
            ? "diver"
            : col % 2 === 0
                ? "striker"
                : "scout";
    }

    if (currentWave <= 6) {
        if (row === 0) return "bomber";

        return col % 5 === 0
            ? "diver"
            : col % 2 === 0
                ? "striker"
                : "scout";
    }

    if (row === 0) return "bomber";

    return col % 5 === 0
        ? "diver"
        : col % 2 === 0
            ? "striker"
            : "scout";
}

for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        radius: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.7 + 0.3
    })


}
                                                                 
function createExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3 + 1,
            life: 1
        })
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.025;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}
function drawParticles() {
    particles.forEach(particle => {
        ctx.save();

        ctx.globalAlpha = particle.life;
        if (particle.color) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = particle.color;
            ctx.fillStyle = particle.color;
        } else {
            const colors = ["#e66b3d", "#e6a94e", "#f4e8cb"];
            ctx.fillStyle = colors[Math.floor(particle.radius) % colors.length]
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    })
}

function drawEnemies() {
    enemies.forEach(enemy => {
        drawEnemyShield(enemy);

        ctx.save();

        const recoil = enemy.hitRecoil > 0
            ? Math.sin(enemy.hitRecoil * 2) * 3
            : 0;

        ctx.translate(enemy.x + recoil, enemy.y);

        if (enemy.hitFlash > 0) {
            ctx.filter = "brightness(0) invert(1)";
        }

        ctx.fillStyle = "#e66b3d";
        ctx.strokeStyle = "#171714";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(-17, 0, 9, 15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(17, 0, 9, 15, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e6a94e";

        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 9, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#f4e8cb";
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#171714";

        ctx.beginPath();
        ctx.arc(-5, 8, 3, 0, Math.PI * 2);
        ctx.arc(5, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f4e8cb";

        ctx.beginPath();
        ctx.arc(-5.5, 7, 1, 0, Math.PI * 2);
        ctx.arc(4.5, 7, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e66b3d";

        ctx.beginPath();
        ctx.moveTo(-5, 16);
        ctx.lineTo(5, 16);
        ctx.lineTo(0, 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f4e8cb";

        ctx.beginPath();
        ctx.arc(-4, -17, 3, 0, Math.PI * 2);
        ctx.arc(0, -19, 3, 0, Math.PI * 2);
        ctx.arc(4, -17, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    })
}

function drawScore() {
    ctx.save();

    const cream = "#f4e8cb";
    const orange = "#e66b3d";
    const mustard = "#e6a94e";
    const dark = "#171714";
    const muted = "#aaa48e";

    function panel(x, y, width, height, color) {
        ctx.fillStyle = dark;
        ctx.fillRect(x + 4, y + 4, width, height);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = cream;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    panel(20, 18, 210, 68, orange);

    ctx.textAlign = "left";
    ctx.fillStyle = dark;
    ctx.font = "bold 11px 'Space Mono', monospace";
    ctx.fillText("HIGH ENERGY POINTS", 32, 37);

    ctx.fillStyle = cream;
    ctx.font = "bold 25px 'Space Mono', monospace";
    ctx.fillText(String(score).padStart(7, "0"), 32, 70);

    panel(WIDTH / 2 - 75, 18, 150, 54, mustard);

    ctx.textAlign = "center";
    ctx.fillStyle = dark;
    ctx.font = "bold 11px 'Space Mono', monospace";
    ctx.fillText("CURRENT WAVE", WIDTH / 2, 38);

    ctx.fillStyle = cream;
    ctx.font = "bold 22px 'Russo One', sans-serif";
    ctx.fillText(String(currentWave).padStart(2, "0"), WIDTH / 2, 61);

    panel(WIDTH - 230, 18, 210, 68, cream);

    ctx.textAlign = "left";
    ctx.fillStyle = dark;
    ctx.font = "bold 11px 'Space Mono', monospace";
    ctx.fillText("REMAINING LIVES", WIDTH - 218, 37);

    for (let i = 0; i < difficulty.playerLives; i++) {
        const x = WIDTH - 215 + i * 35;
        const y = 59;

        ctx.fillStyle = i < player.lives ? orange : "#aaa48e";

        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 10, y + 8);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 10, y + 8);
        ctx.closePath();
        ctx.fill();
    }

    panel(20, HEIGHT - 65, 260, 43, cream);

    ctx.textAlign = "left";
    ctx.fillStyle = dark;
    ctx.font = "bold 11px 'Space Mono', monospace";

    ctx.fillText("EQUIPPED:", 32, HEIGHT - 38);

    const weaponColor = equippedWeapon === "red"
        ? orange
        : mustard;

    ctx.fillStyle = weaponColor;
    ctx.font = "bold 14px 'Russo One', sans-serif";

    ctx.fillText(equippedWeapon.toUpperCase(), 125, HEIGHT - 38);

    ctx.fillStyle = dark;
    ctx.font = "bold 11px 'Space Mono', monospace";
    ctx.textAlign = "right";

    ctx.fillText("POWER", WIDTH - 155, HEIGHT - 38);

    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < weaponLevel ? orange : "#aaa48e";
        ctx.fillRect(WIDTH - 140 + i * 20, HEIGHT - 48, 13, 20);
    }

    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(300, HEIGHT - 42);
    ctx.lineTo(WIDTH - 300, HEIGHT - 42);
    ctx.stroke();

    ctx.restore();
}

function spawnFormation() {

    const rows = 4;
    const columns = 7;

    const spacingX = 85;
    const spacingY = 75;

    const startX = (WIDTH - (columns - 1) * spacingX) / 2;

const healthBonus = Math.floor((currentWave - 1) / 2);
    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < columns; col++) {

            const targetX = startX + col * spacingX;
            const targetY = 100 + row * spacingY;

            const typeName = getEnemyType(row, col);
            const type = ENEMY_TYPES[typeName];

            const health = Math.min(
                Math.max(1, Math.ceil(
                    (type.health + healthBonus) * difficulty.enemyHealth
                )),
                15
            );

            const patterns = ["swoop", "diagonal", "zigzag"];

            const pattern = patterns[col % patterns.length];

            enemies.push({

                type: typeName,

                x: targetX,
                y: -100 - row * 65,

                startX: targetX,
                startY: -100 - row * 65,
                formationX: targetX,
                formationY: targetY,

                targetX: targetX,
                targetY: targetY,

                entrancePattern: pattern,
                entranceProgress: 0,
                entranceDelay: Math.random() * 60,

                width: 35,
                height: 35,
                health: health,
                maxHealth: health,
                hitFlash: 0,
                hitRecoil: 0,
                row: row,
                col: col,
                entered: false,
                invulnerability: 1,
                speed: 2,
                diveRate: type.diveRate,
                attackPattern: type.attack,
                bulletSpeed: type.bulletSpeed,
                attackCooldown: (
                    Math.random() *
                    (type.cooldownMax - type.cooldownMin) +
                    type.cooldownMin
                ) * difficulty.enemyAttackRate,
                scoreValue: type.score,

                
                diveProgress: null,
                diveReturning: false,

                diveStartX: 0,
                diveStartY: 0,
                diveTargetX: 0,
                diveTargetY: 0

            })

        }
    }
}
function startNextWave() {
    currentWave++;

    waveState = "active"

    formationSpeed = Math.min(
        3.5 + (currentWave - 1) * 0.15,
        5.5
    )

    formationDirection = 1;

    volleyCooldown = 150;
    volleyShotDelay = 12;
    volleyEnemies = [];
    volleyActive = false
    volleyIndex = 0;

    
    enemyBullets.length = 0
    spawnFormation();

}
function drawStars() {
    ctx.fillStyle = "#f4e8cb";
    stars.forEach(star => {
        ctx.globalAlpha = star.opacity
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill()

        star.y += star.speed;

        if (star.y > HEIGHT) {
            star.y = 0;
            star.x = Math.random() * WIDTH;
        }
    })

    ctx.globalAlpha = 1;
}

const player = {
    x: WIDTH / 2,
    y: HEIGHT - 100,
    width: 40,
    height: 50,
    speed: 10,
    lives: 100,
    invulnerability: 0
};

let gameOver = false;

let gameState = "menu";
let selectedDifficulty = "extreme";
function updateEnemyBullets() {
    enemyBullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    })

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i]
        if (
            bullet.y > HEIGHT + 20 ||
            bullet.y < -20 ||
            bullet.x < -20 ||
            bullet.x > WIDTH + 20
        ) {
            enemyBullets.splice(i, 1)
        }
    }
}
function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.save();

        ctx.translate(bullet.x, bullet.y);

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ffffff";

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.ellipse(
            0, 0,
            5, 8,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-1.5, -2, 1.2, 0, Math.PI * 2);
        ctx.arc(1.5, 2.5, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.8;

        ctx.beginPath();
        ctx.arc(-1.5, -4, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    })
}
function drawPlayer() {
    ctx.save();
    if (player.invulnerability > 0) {
        ctx.globalAlpha =
            Math.floor(player.invulnerability / 8) % 2 === 0 ? 0.3 : 1;
    }

    ctx.translate(player.x, player.y);

    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(20, 20);
    ctx.lineTo(0, 12);
    ctx.lineTo(-20, 20);
    ctx.closePath();

    ctx.fillStyle = "#f4e8cb";
    ctx.fill();
    ctx.strokeStyle = "#171714";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#e66b3d";

    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.lineTo(-20, 20);
    ctx.lineTo(-3, 14);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(13, 5);
    ctx.lineTo(20, 20);
    ctx.lineTo(3, 14);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#e6a94e";
    ctx.fill();
    ctx.strokeStyle = "#171714";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#aaa48e";
    ctx.fillRect(-4, 17, 8, 4);

    ctx.restore();
}

let enemies = []
let currentWave = 1;
let waveState = "active"; 

spawnFormation();

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (WIDTH - 60) + 30,
        y: -40,
        width: 35,
        height: 35,
        speed: Math.random() * 2 + 2,
        health: 1
    })
}       



function drawEnemyShield(enemy) {
    if (enemy.invulnerability <= 0) return;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.globalAlpha = Math.min(enemy.invulnerability / 20, 0.8);

    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(230, 169, 78, 0.10)";
    ctx.fill();

    ctx.strokeStyle = "#e6a94e";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "#f4e8cb";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#e66b3d";

    ctx.beginPath();
    ctx.arc(0, -25, 2.5, 0, Math.PI * 2);
    ctx.arc(25, 0, 2.5, 0, Math.PI * 2);
    ctx.arc(0, 25, 2.5, 0, Math.PI * 2);
    ctx.arc(-25, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);

        ctx.fillStyle = "#aaa48e";
        ctx.strokeStyle = "#171714";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f4e8cb"

        ctx.beginPath();
        ctx.arc(-1.5, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    })
}

function damagePlayer() {
    if (player.invulnerability > 0 || gameOver) return;

    player.lives--;
    soundPlayerHit();
    player.invulnerability = 90;
    weaponLevel = Math.max(1, weaponLevel - 2);

    createExplosion(player.x, player.y);

    if (player.lives <= 0) {
        gameOver = true;
        stopMusic();
        soundGameOver();
    }
}
function fireEnemyAttack(enemy) {

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    const angle = Math.atan2(dy, dx);

    const speed = enemy.bulletSpeed;

    function createBullet(angleOffset) {

        const bulletAngle = angle + angleOffset;

        enemyBullets.push({

            x: enemy.x,
            y: enemy.y + 20,

            vx: Math.cos(bulletAngle) * speed,
            vy: Math.sin(bulletAngle) * speed,

            width: 6,
            height: 12

        })
    }
    if (enemy.attackPattern === "formation") {

        enemyBullets.push({

            x: enemy.x,
            y: enemy.y + 20,

            vx: 0,
            vy: speed,

            width: 6,
            height: 12

        })
    }

    else if (enemy.attackPattern === "targeted") {

        createBullet(0);

    }

    else if (enemy.attackPattern === "spread") {

        createBullet(-0.3)
        createBullet(0)
        createBullet(0.3)

    }



}
function startEnemyVolley() {

    if (volleyActive || currentWave < 3) return;

    const readyEnemies = enemies.filter(enemy =>
        enemy.entered &&
        enemy.attackPattern !== "dive" &&
        enemy.diveProgress === null
    );

    if (readyEnemies.length === 0) return;

    const selectedRow = Math.floor(Math.random() * 4);

    volleyEnemies = readyEnemies
        .filter(enemy => enemy.row === selectedRow)
        .sort((a, b) => a.x - b.x);

    if (volleyEnemies.length === 0) return;

    volleyIndex = 0;
    volleyShotDelay = 12;
    volleyActive = true;

}


function updateEnemyVolley() {
    if (currentWave < 3) return;

    if (!volleyActive) {

        volleyCooldown--

        if (volleyCooldown <= 0) {
            startEnemyVolley();
            volleyCooldown = 150;
        }
        return;
    }
    volleyShotDelay--;

    if (volleyShotDelay <= 0) {

        const enemy = volleyEnemies[volleyIndex];

        if (
            enemy &&
            enemies.includes(enemy) &&
            enemy.diveProgress === null
        ) {

            fireEnemyAttack(enemy);

            enemy.attackCooldown = Math.max(
                enemy.attackCooldown,
                120
            )

        }

        volleyIndex++;
        volleyShotDelay = 8

        if (volleyIndex >= volleyEnemies.length) {
            volleyActive = false;
            volleyCooldown = 150
        }
    }
}

function updateEnemies() {
    if (enemies.length === 0) {
        if (waveState === "active") {
            waveState = "transitioning";
            soundWaveClear();

            setTimeout(() => {
                startNextWave();
            }, 2000);
        }

        return;
    }
    const formationReady = enemies.every(enemy => enemy.entered);
    if (formationReady) {
        enemies.forEach(enemy => {
            enemy.invulnerability = 0;
        })
    }
    let leftEdge = Infinity;
    let rightEdge = -Infinity;

    enemies.forEach(enemy => {
        if (!enemy.entered) return;

        leftEdge = Math.min(leftEdge, enemy.formationX - enemy.width / 2);
        rightEdge = Math.max(rightEdge, enemy.formationX + enemy.width / 2);

    })

    if (formationReady) {
        if (rightEdge >= WIDTH - 20) {
            formationDirection = -1;
        }

        else if (leftEdge <= 20) {
            formationDirection = 1;
        }
    }

    enemies.forEach(enemy => {

        if (enemy.hitFlash > 0) enemy.hitFlash--;
        if (enemy.hitRecoil > 0) enemy.hitRecoil--;

        if (!enemy.entered) {

            if (enemy.entranceDelay > 0) {
                enemy.entranceDelay--;
                return;
            }

            enemy.entranceProgress = Math.min(
                enemy.entranceProgress + 0.012,
                1
            );

            const t = enemy.entranceProgress;
            const eased = 1 - Math.pow(1 - t, 3);

            if (enemy.entrancePattern === "swoop") {

                enemy.x = enemy.startX +
                    (enemy.targetX - enemy.startX) * eased +
                    Math.sin(t * Math.PI * 2) * 20 * (1 - t);

                enemy.y = enemy.startY +
                    (enemy.targetY - enemy.startY) * eased;

            }

            else if (enemy.entrancePattern === "diagonal") {

                enemy.x = enemy.startX +
                    (enemy.targetX - enemy.startX) * eased;

                enemy.y = enemy.startY +
                    (enemy.targetY - enemy.startY) * eased;

            }

            else if (enemy.entrancePattern === "zigzag") {

                enemy.x = enemy.startX +
                    (enemy.targetX - enemy.startX) * eased +
                    Math.sin(t * Math.PI * 5) * 15 * (1 - t);

                enemy.y = enemy.startY +
                    (enemy.targetY - enemy.startY) * eased;

            }

            if (t >= 1) {

                enemy.x = enemy.targetX;
                enemy.y = enemy.targetY;

                enemy.formationX = enemy.targetX;
                enemy.formationY = enemy.targetY;

                enemy.entered = true;

            }

            return;
        }

        if (!formationReady) return;

        enemy.formationX += formationSpeed * formationDirection;

        if (enemy.diveProgress !== null) {

            const t = enemy.diveProgress;

            if (!enemy.diveReturning) {

                enemy.diveProgress = Math.min(
                    t + enemy.diveRate,
                    1
                )

                const progress = enemy.diveProgress;

                const arc = Math.sin(progress * Math.PI) * 45;

                enemy.x = enemy.diveStartX +
                    (enemy.diveTargetX - enemy.diveStartX) * progress +
                    Math.sin(progress * Math.PI) * 35;

                enemy.y = enemy.diveStartY +
                    (enemy.diveTargetY - enemy.diveStartY) *
                    Math.sin(progress * Math.PI / 2) +
                    arc;

                if (progress >= 1) {
                    enemy.diveReturning = true;
                }

            }

            else {

                enemy.diveProgress = Math.max(
                    t - enemy.diveRate * 1.2,
                    0
                )

                const progress = enemy.diveProgress;

                const arc = Math.sin(progress * Math.PI) * 45;

                enemy.x = enemy.formationX +
                    (enemy.diveTargetX - enemy.formationX) * progress +
                    Math.sin(progress * Math.PI) * 35;

                enemy.y = enemy.formationY +
                    (enemy.diveTargetY - enemy.formationY) *
                    Math.sin(progress * Math.PI / 2) +
                    arc;

                if (progress <= 0) {

                    enemy.x = enemy.formationX;
                    enemy.y = enemy.formationY;

                    enemy.diveProgress = null;
                    enemy.diveReturning = false;

                }

            }

        }

        else {

            enemy.x = enemy.formationX;
            enemy.y = enemy.formationY;

        }

        enemy.attackCooldown--;

        if (enemy.attackPattern === "dive") {

            if (
                enemy.attackCooldown <= 0 &&
                enemy.diveProgress === null
            ) {

                enemy.diveStartX = enemy.x;
                enemy.diveStartY = enemy.y;

                enemy.diveTargetX = Math.max(
                    40,
                    Math.min(WIDTH - 40, player.x)
                );

                enemy.diveTargetY = Math.max(
                    enemy.formationY + 80,
                    Math.min(player.y - 55, HEIGHT - 40)
                );

                enemy.diveProgress = 0;
                enemy.diveReturning = false;

                enemy.attackCooldown =
                    Math.random() * 220 + 240;

            }

        }

        else if (enemy.attackCooldown <= 0) {

            fireEnemyAttack(enemy);

            const type = ENEMY_TYPES[enemy.type];

            enemy.attackCooldown = (
                Math.random() *
                (type.cooldownMax - type.cooldownMin) +
                type.cooldownMin
            ) * difficulty.enemyAttackRate;
        }

    })

}

function createWeaponDrop(x, y) {

    const roll = Math.random();

    let type;

    if (roll < 0.02) {
        type = "red";
    }
    else if (roll < 0.04) {
        type = "laser";
    }

    else if (roll < 0.15) {
        type = "power";
    }

    else {
        return;
    }

    weaponDrops.push({
        x: x,
        y: y,
        width: 18,
        height:18,
        speed: 2.5,
        type: type
    })
}
function checkCollisions() {

    for (let b = bullets.length - 1; b >= 0; b--) {

        const bullet = bullets[b];
        let hit = false;

        for (let e = enemies.length - 1; e >= 0; e--) {

            const enemy = enemies[e];
            if (enemy.invulnerability > 0) continue;

            const collision =
                bullet.x > enemy.x - enemy.width / 2 &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.y > enemy.y - enemy.height / 2 &&
                bullet.y < enemy.y + enemy.height / 2;

            if (collision) {

                enemy.health-= bullet.damage || 1;
                soundEnemyHit();
                enemy.hitFlash = 8;
                enemy.hitRecoil = 8;

                bullets.splice(b, 1);
                hit = true;

            if (enemy.health <= 0) {

                score += enemy.scoreValue;

                createExplosion(enemy.x, enemy.y);

                createWeaponDrop(enemy.x, enemy.y);

                enemies.splice(e, 1)
            }

                break;
            }
        }
    }

   
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

        const bullet = enemyBullets[i];

        const hit =
            bullet.x > player.x - player.width / 2 &&
            bullet.x < player.x + player.width / 2 &&
            bullet.y > player.y - player.height / 2 &&
            bullet.y < player.y + player.height / 2;

        if (hit) {
            enemyBullets.splice(i, 1);
            damagePlayer();
        }
    }
    for (let i = weaponDrops.length - 1; i >= 0; i--) {

        const drop = weaponDrops[i]

        const collected =
            Math.abs(player.x - drop.x) <
                (player.width + drop.width) / 2 &&
            Math.abs(player.y - drop.y) <
                (player.height + drop.height) / 2;

        if (collected) {
            soundPickup();

        if (drop.type === "red") {

            equippedWeapon = "red";

        }

        else if (drop.type === "laser") {

            equippedWeapon = "laser";
        }
        else if (drop.type === "power") {
            weaponLevel = Math.min(weaponLevel + 1, 5)
        }
            weaponDrops.splice(i, 1);
        }
    }
   
    enemies.forEach(enemy => {

        const hit =
            Math.abs(player.x - enemy.x) < (player.width + enemy.width) / 2 &&
            Math.abs(player.y - enemy.y) < (player.height + enemy.height) / 2;

        if (hit) {
            damagePlayer();
        }
    });
}

const keys = {};
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y -= bullet.vy;

        if (
            bullet.y < -20 ||
            bullet.x < -20 ||
            bullet.x > WIDTH + 20
        ) {
            bullets.splice(i, 1);
        }
    }
}


document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
})

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
})

function movePlayer() {

    if (gameOver) return;
    if (weaponCooldown > 0) {
        weaponCooldown--;
    }
    if (player.invulnerability > 0) {
        player.invulnerability--;
    }


    if (keys["w"] || keys["arrowup"]) {
        player.y -=player.speed;
    }
    if (keys["s"] || keys["arrowdown"]) {
        player.y += player.speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        player.x-= player.speed;
    }

    if (keys["d"]|| keys["arrowright"]) {
        player.x += player.speed;
    }

    player.x = Math.max(20, Math.min(WIDTH - 20, player.x));
    player.y = Math.max(25, Math.min(HEIGHT - 25, player.y));
}
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.repeat) return;
        if (e.key.toLowerCase() === "m") {
        toggleMute();
    }

    if (e.key === " ") {
        shoot();
    }
})
const bullets = []
const enemyBullets = [];
const laserBeams = [];

const weaponDrops = [];

let weaponLevel = 1;
let equippedWeapon = "red";

let weaponCooldown = 0;

const WEAPON_COOLDOWNS = {
    red: 12,
    laser: 12
}

const weapons = {
    red: {},
    laser: {}
}

function shoot() {
    if (weaponCooldown > 0 || gameOver) return;

    weaponCooldown = WEAPON_COOLDOWNS[equippedWeapon];
    if (equippedWeapon === "red") {
        soundRedShot();
    }
    const level = weaponLevel;

    if (equippedWeapon === "red") {

        const projectileCount = Math.min(level, 4);

        const spread = level >= 4 ? 0.28 :
                       level >= 3 ? 0.18 :
                       level >= 2 ? 0.06 : 0;

        const damage = level >= 5 ? 2 : 1;

        for (let i = 0; i < projectileCount; i++) {

            const angle = projectileCount === 1
                ? 0
                : -spread + (2 * spread * i) /
                  (projectileCount - 1);

            bullets.push({
                x: player.x,
                y: player.y - 25,

                width: 4,
                height: 18,

                vx: Math.sin(angle) * 10,
                vy: Math.cos(angle) * 10,
                damage: damage
            })
        }
    }
  

    else if (equippedWeapon === "laser") {
        fireLaser();
    }
    
}


function fireLaser() {
    soundLaser();
    const damageByLevel = [0, 3, 4, 5, 6, 8];
    const beamX = player.x;
    const beamStart = player.y - 25;

    let target = null;

    enemies.forEach(enemy => {
        const overlapsBeam =
            Math.abs(enemy.x - beamX) < enemy.width / 2 + 5;

        if (
            overlapsBeam &&
            enemy.y < beamStart &&
            (!target || enemy.y > target.y)
        ) {
            target = enemy;
        }
    })

    const beamEnd = target
        ? target.y + target.height / 2
        : 0;

    laserBeams.push({
        x: beamX,
        startY: beamStart,
        endY: beamEnd,
        life: 5,
        maxLife: 5
    });

    if (target && target.invulnerability <= 0) {
        createLaserImpact(target.x, target.y);
        target.health -= damageByLevel[weaponLevel];
        soundEnemyHit();
        target.hitFlash = 8;
        target.hitRecoil = 8;

        if (target.health <= 0) {
            score += target.scoreValue;
            createExplosion(target.x, target.y);
            soundExplosion();
            createWeaponDrop(target.x, target.y);

            const index = enemies.indexOf(target);
            if (index !== -1) {
                enemies.splice(index, 1);
            }
        }
    }
}
function createLaserImpact(x, y) {
    laserImpacts.push({
        x,
        y,
        life: 12,
        maxLife: 12,
        radius: 5
    })
    for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 1,
            life: 1,
            color: "#ffe45c"
        })
    }
}
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();

        if (bullet.type === "laser") {
            ctx.shadowBlur = 22;
            ctx.shadowColor = "#ffdf32";
            ctx.fillStyle = "#ffdf32";

            ctx.fillRect(
                bullet.x - bullet.width / 2,
                bullet.y - bullet.height / 2,
                bullet.width,
                bullet.height
            );
        }

        else {

            ctx.shadowBlur = 20;
            ctx.shadowColor = "#ff3030";
            ctx.fillStyle = "#ff3030";

            ctx.beginPath();
            ctx.roundRect(
                bullet.x - bullet.width / 2 - 2,
                bullet.y - bullet.height / 2,
                bullet.width + 4,
                bullet.height,
                5
            );
            ctx.fill();

            ctx.shadowBlur = 12;
            ctx.shadowColor = "#ff9a38";
            ctx.fillStyle = "#ff9a38";

            ctx.beginPath();
            ctx.roundRect(
                bullet.x - bullet.width / 2,
                bullet.y - bullet.height / 2 + 2,
                bullet.width,
                bullet.height - 4,
                4
            );
            ctx.fill();

            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ffffff";
            ctx.fillStyle = "#fff3d6";

            ctx.beginPath();
            ctx.roundRect(
                bullet.x - 1,
                bullet.y - bullet.height / 2 + 5,
                2,
                bullet.height - 10,
                2
            );
            ctx.fill();
        }

        ctx.restore();
    })
}
function updateLaserBeams() {
    for (let i = laserBeams.length - 1; i >= 0; i--) {
        laserBeams[i].life--;

        if (laserBeams[i].life <= 0) {
            laserBeams.splice(i, 1);
        }
    }
}

function drawLaserBeams() {
    laserBeams.forEach(beam => {
        ctx.save();

        const alpha = beam.life / beam.maxLife;
        const length = beam.startY - beam.endY;

        ctx.globalAlpha = alpha;

        ctx.shadowBlur = 30;
        ctx.shadowColor = "#ffbd32";
        ctx.strokeStyle = "#ffbd32";
        ctx.lineWidth = 22;

        ctx.beginPath();
        ctx.moveTo(beam.x, beam.startY)
        ctx.lineTo(beam.x, beam.endY);
        ctx.stroke();

        ctx.shadowBlur = 15
        ctx.strokeStyle = "#fff000";
        ctx.lineWidth = 10;

        ctx.beginPath();
        ctx.moveTo(beam.x, beam.startY);
        ctx.lineTo(beam.x, beam.endY);
        ctx.stroke();

        ctx.shadowBlur = 12
        ctx.shadowColor = "#ffffff"
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 3

        ctx.beginPath();
        ctx.moveTo(beam.x, beam.startY)
        ctx.lineTo(beam.x, beam.endY)
        ctx.stroke();
        if (beam.endY > 0) {
            ctx.shadowBlur = 25;
            ctx.fillStyle = "#ffffff"

            ctx.beginPath();
            ctx.arc(
                beam.x,
                beam.endY,
                9 * alpha,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    })
}
function updateWeaponDrops() {

    for (let i = weaponDrops.length - 1; i >= 0; i--) {

        const drop = weaponDrops[i];

        drop.y += drop.speed;

        if (drop.y > HEIGHT + 20) {
            weaponDrops.splice(i, 1);
        }
    }
}


function drawWeaponDrops() {
    weaponDrops.forEach(drop => {
        ctx.save();

        if (drop.type === "power") {
            ctx.fillStyle = "#e6a94e";
            ctx.strokeStyle = "#171714";
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = "#171714";
            ctx.lineWidth = 2.5

            ctx.beginPath();
            ctx.moveTo(drop.x - 6, drop.y);
            ctx.lineTo(drop.x + 6, drop.y);
            ctx.moveTo(drop.x, drop.y - 6);
            ctx.lineTo(drop.x, drop.y + 6);
            ctx.stroke();
        } else {
            const color = drop.type === "red"
                ? "#ff3333"
                : "#ffdf32";

            ctx.fillStyle = color;
            ctx.strokeStyle = "#171714";
            ctx.lineWidth = 2;

            ctx.fillRect(
                drop.x - drop.width / 2,
                drop.y - drop.height / 2,
                drop.width,
                drop.height
            )

            ctx.strokeRect(
                drop.x - drop.width / 2,
                drop.y - drop.height / 2,
                drop.width,
                drop.height
            )
        }

        ctx.restore();
    })
}
function updateLaserImpacts() {
    for (let i = laserImpacts.length - 1; i >= 0; i--) {
        const impact = laserImpacts[i];

        impact.life--;
        impact.radius += 2.5;

        if (impact.life <= 0) {
            laserImpacts.splice(i, 1);
        }
    }
}

function drawLaserImpacts() {
    laserImpacts.forEach(impact => {
        const alpha = impact.life / impact.maxLife;

        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ffdf32";
        ctx.strokeStyle = "#fff4a3";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
            impact.x,
            impact.y,
            impact.radius,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 30

        ctx.beginPath();
        ctx.arc(
            impact.x,
            impact.y,
            7 * alpha,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    })
}

function startGame() {
    initializeAudio();
    startMusic();
    difficulty = DIFFICULTIES[selectedDifficulty];

    gameState = "playing";
    gameOver = false;

    score = 0;
    currentWave = 1;
    waveState = "active";

    player.lives = difficulty.playerLives;
    player.x = WIDTH / 2;
    player.y = HEIGHT - 100;
    player.invulnerability = 0;

    weaponLevel = 1;
    equippedWeapon = "red";
    weaponCooldown = 0;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    weaponDrops.length = 0;
    laserBeams.length = 0;
    laserImpacts.length = 0;
    particles.length = 0;

    formationSpeed = 3.5;
    formationDirection = 1;

    volleyCooldown = 120;
    volleyActive = false;
    volleyEnemies = [];
    volleyIndex = 0;

    spawnFormation();
}
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

difficultyButtons.forEach(button => {
    button.addEventListener("click", () => {

        selectedDifficulty = button.dataset.difficulty;

        difficultyButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        button.classList.add("selected");
    })
})

document.getElementById("startButton").addEventListener("click", () => {
    startGame();

    document.getElementById("mainMenu").classList.add("hidden");
})
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawStars();

    if (gameState !== "playing") {
        requestAnimationFrame(gameLoop);
        return;
    }

    movePlayer();
    drawPlayer();
    updateBullets();
    drawBullets();
    updateLaserBeams();
    drawLaserBeams();
    updateLaserImpacts();
    drawLaserImpacts();
    updateEnemyBullets();
    drawEnemyBullets();
    updateWeaponDrops();
    drawWeaponDrops();
    updateEnemies();
    updateEnemyVolley();
    checkCollisions();
    drawEnemies();
    drawScore();


    if (waveState === "transitioning") {
        ctx.save();

        ctx.textAlign = "center";
        ctx.font = "bold 36px 'Russo One', sans-serif";
        ctx.fillStyle = "#e6a94e";
        ctx.strokeStyle = "#171714";
        ctx.lineWidth = 3;
        ctx.strokeText(
            `WAVE ${currentWave} CLEARED`,
            WIDTH / 2,
            HEIGHT / 2
        )
        ctx.fillText(
            `WAVE ${currentWave} CLEARED`,
            WIDTH / 2,
            HEIGHT / 2
        )

        ctx.restore();




    }

    updateParticles(); 
    drawParticles();

    if (gameOver) {
        ctx.save();

        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

       ctx.textAlign = "center";

        ctx.fillStyle = "#171714";
        ctx.fillRect(
            WIDTH / 2 - 220,
            HEIGHT / 2 - 75,
            440,
            150
        )

        ctx.strokeStyle = "#e66b3d";
        ctx.lineWidth = 3;
        ctx.strokeRect(
            WIDTH / 2 - 220,
            HEIGHT / 2 - 75,
            440,
            150
        )

        ctx.fillStyle = "#e66b3d";
        ctx.font = "bold 48px 'Russo One', sans-serif";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 10);

        ctx.fillStyle = "#f4e8cb";
        ctx.font = "16px 'Space Mono', monospace";
        ctx.fillText(
            `FINAL SCORE: ${score}`,
            WIDTH / 2,
            HEIGHT / 2 + 35
        )
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}
gameLoop();
