
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width
const HEIGHT = canvas.height;

const stars = [];
let score = 0;
const particles = [];
let formationDirection = 1;
let formationSpeed = 3.5;
let formationDrop = 35;
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
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.025;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    })
}
function drawParticles() {
    particles.forEach(particle => {
        ctx.save();

        ctx.globalAlpha = particle.life;
        ctx.shadowBlur = 15
        ctx.shadowColor = "#ff245c"
        ctx.fillStyle = "#ff6688"

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    })
}

function drawScore() {
    ctx.save();

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#00eaff";
    ctx.shadowBlur = 10;




    ctx.shadowColor = "#00eaff";
    ctx.textAlign = "left";

    ctx.fillText(`SCORE: ${score}`, 25, 40);
    ctx.textAlign = "right";
    ctx.fillStyle = "#00eaff";
    ctx.fillText(`LIVES: ${player.lives}`, WIDTH - 25, 40);

    ctx.restore();
}

function spawnFormation() {
    const rows = 4;
    const columns = 7;
    const spacingX = 85;
    const spacingY = 75;

    const startX = (WIDTH - (columns - 1) * spacingX) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            enemies.push({
                x: startX + col * spacingX,
                y: -150 - row * spacingY,
                width: 35,
                height: 35,
                health: 3,
                maxHealth: 3,
                row: row,
                col: col,
                speed: 2,
                attackCooldown: Math.random() * 180 + 120
            })
        }
    }
}


setInterval(() => {
    if (enemies.length === 0) {
        spawnFormation();
    }
}, 500);

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
    speed: 10,
    lives: 3,
    invulnerability: 0
};

let gameOver = false;

function updateEnemyBullets() {
    enemyBullets.forEach(bullet => {
        bullet.y += bullet.speed;
    });

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (enemyBullets[i].y > HEIGHT + 20) {
            enemyBullets.splice(i, 1);
        }
    }
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff245c";
        ctx.fillStyle = "#ff245c";

        ctx.fillRect(
            bullet.x - bullet.width / 2,
            bullet.y - bullet.height / 2,
            bullet.width,
            bullet.height
        );

        ctx.restore();
    });
}
function drawPlayer() {
    ctx.save();
    if (player.invulnerability > 0) {
        ctx.globalAlpha = Math.floor(player.invulnerability / 8) % 2 === 0 ? 0.3 : 1;
    }

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

let enemies = []

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
        // Enemy health bar
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#401020";
        ctx.fillRect(-18, 25, 36, 5);

        ctx.fillStyle = "#ff6688";
        ctx.fillRect(
            -18,
            25,
            36 * (enemy.health / enemy.maxHealth),
            5
        );
        ctx.restore();
    })


}
function damagePlayer() {
    if (player.invulnerability > 0 || gameOver) return;

    player.lives--;
    player.invulnerability = 90;

    createExplosion(player.x, player.y);

    if (player.lives <= 0) {
        gameOver = true;
    }
}

function updateEnemies() {
    if (enemies.length === 0) return;

    let leftEdge = Infinity;
    let rightEdge = -Infinity;

    enemies.forEach(enemy => {
        leftEdge = Math.min(leftEdge, enemy.x - enemy.width / 2);
        rightEdge = Math.max(rightEdge, enemy.x + enemy.width / 2);
    });

    if (
        (rightEdge >= WIDTH - 20 && formationDirection === 1) ||
        (leftEdge <= 20 && formationDirection === -1)
    ) {
        formationDirection *= -1;

        enemies.forEach(enemy => {
            enemy.y += formationDrop;
        });
    }

    enemies.forEach(enemy => {
    enemy.x += formationSpeed * formationDirection;
    enemy.y += 0.6;

    enemy.attackCooldown--;

    if (enemy.attackCooldown <= 0) {
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y + 20,
            width: 6,
            height: 12,
            speed: 3.5
        });

        enemy.attackCooldown = Math.random() * 180 + 180;
    }
    });

    enemies = enemies.filter(enemy => enemy.y < HEIGHT + 50);
}

function checkCollisions() {

    for (let b = bullets.length - 1; b >= 0; b--) {

        const bullet = bullets[b];
        let hit = false;

        for (let e = enemies.length - 1; e >= 0; e--) {

            const enemy = enemies[e];

            const collision =
                bullet.x > enemy.x - enemy.width / 2 &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.y > enemy.y - enemy.height / 2 &&
                bullet.y < enemy.y + enemy.height / 2;

            if (collision) {

                enemy.health--;
                bullets.splice(b, 1);
                hit = true;

                if (enemy.health <= 0) {
                    score += 100;
                    createExplosion(enemy.x, enemy.y);
                    enemies.splice(e, 1);
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




document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
})

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
})

function movePlayer() {

    if (gameOver) return;

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

    if (e.key === " ") {
        shoot();
    }
})
const bullets = []
const enemyBullets = [];
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
    updateEnemyBullets();
    drawEnemyBullets();
    updateEnemies();
    checkCollisions();
    drawEnemies();
    drawScore();
    updateParticles();
    drawParticles();

    if (gameOver) {
        ctx.save();

        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.textAlign = "center";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff245c";

        ctx.fillStyle = "#ff245c";
        ctx.font = "bold 48px Arial";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText(`FINAL SCORE: ${score}`, WIDTH / 2, HEIGHT / 2 + 45);

        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}
gameLoop();
