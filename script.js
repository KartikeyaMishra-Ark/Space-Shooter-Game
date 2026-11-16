
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


function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawStars();

    requestAnimationFrame(gameLoop);
}

gameLoop();
