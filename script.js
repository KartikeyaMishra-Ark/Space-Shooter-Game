
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width
const HEIGHT = canvas.height;

const stars = [];

for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        radius: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.7 + 0.3
    })
}

function drawStars() {
    ctx.fillStyle = "#ffffff";

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
    speed: 10
}

function drawPlayer() {
    ctx.save();

    ctx.translate(player.x, player.y);

   
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00eaff";

    
    ctx.beginPath();
    ctx.moveTo(0, -25)
    ctx.lineTo(20, 20)
    ctx.lineTo(0, 12)
    ctx.lineTo(-20, 20)
    ctx.closePath();

    ctx.fillStyle = "#00c8ff"
    ctx.fill();

    ctx.strokeStyle = "#a5f5ff"
    ctx.lineWidth = 2
    ctx.stroke();

  
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"
    ctx.fill();

    ctx.restore();
}

const enemies = []

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

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();

        ctx.translate(enemy.x, enemy.y);

        ctx.shadowBlur = 18

        ctx.shadowColor = "#ff245c"
        ctx.beginPath();
        ctx.moveTo(0, 22)
        ctx.lineTo(20, -15);
        ctx.lineTo(0, -8)
        ctx.lineTo(-20, -15);
        ctx.closePath();

        ctx.fillStyle = "#ff245c"
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff9ab5"
        ctx.stroke();

        ctx.restore();
    })
}


function updateEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;

        if (enemy.y > HEIGHT + 40) {
            enemies.splice(index, 1);
        }
    })
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {

            const hit =
                bullet.x > enemy.x - enemy.width / 2 &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.y > enemy.y - enemy.height / 2 &&
                bullet.y < enemy.y + enemy.height / 2;

            if (hit) {
                bullets.splice(bIndex, 1)
                enemies.splice(eIndex, 1)
            }
        })
    })
}

const keys = {};




document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
})

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
})

function movePlayer() {

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

    if (e.key === " ") {
        shoot();
    }
})
const bullets = []

function shoot() {
    bullets.push({
        x: player.x,
        y: player.y - 25,
        width: 4,
        height: 18,
        speed: 10
    })
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;

        if (bullet.y < 0) {
            bullets.splice(index, 1)
        }
    })
}


function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();

        ctx.shadowBlur = 15
        ctx.shadowColor = "#ff2020"

        ctx.fillStyle = "#ff3333";
        ctx.fillRect(
            bullet.x - bullet.width / 2,
            bullet.y - bullet.height / 2,
            bullet.width,
            bullet.height
        )

        ctx.restore();
    })
}



function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawStars();
    
    movePlayer();
    drawPlayer();
    updateBullets();
    drawBullets();
    updateEnemies();
    checkCollisions();
    drawEnemies();
    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    spawnEnemy();
}, 1200);


gameLoop();
