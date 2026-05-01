const canvas = document.getElementById("gameCanvas"); 
const ctx = canvas.getContext("2d");

// Risoluzione interna fissa
const aspectRatio = 3 / 4;
canvas.height = window.innerHeight;
canvas.width = window.innerHeight * aspectRatio;

// Fisica a tempo costante (120 FPS target)
const TARGET_FPS = 120;
const TARGET_DT = 1 / TARGET_FPS;

// Velocità base (a 120 FPS)
const BASE_GRAVITY = 0.15;
const BASE_JUMP = -5;
const BASE_PIPE_SPEED = 2;

// Calcola moltiplicatore basato sul delta time
let lastTime = 0;
function getTimeMultiplier(dt) {
    return dt / TARGET_DT;
}

let birdX = 50; let birdY = 150; let birdVelocity = 0;

let pipes = []; let pipeWidth = 60; let pipeGap = 150;

let score = 0; let gameOver = false;

const getScale = () => 1;

// Input da tastiera
document.addEventListener("keydown", (e) => { 
    e.preventDefault();
    if (!gameOver) birdVelocity = BASE_JUMP; 
    else restartGame(); 
});

// Input da mouse
document.addEventListener("mousedown", (e) => { 
    e.preventDefault();
    if (!gameOver) birdVelocity = BASE_JUMP; 
    else restartGame(); 
});

// Input da touch - supporto mobile
document.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!gameOver) birdVelocity = BASE_JUMP;
    else restartGame();
}, { passive: false });

document.addEventListener("touchmove", (e) => {
    e.preventDefault();
}, { passive: false });

function spawnPipe() { 
    let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50; 
    pipes.push({ x: canvas.width, top: topHeight, bottom: topHeight + pipeGap }); 
}

setInterval(spawnPipe, 2000);

function update(currentTime) {
    if (gameOver) return;

    // Calcola delta time e moltiplicatore
    const dt = lastTime ? (currentTime - lastTime) / 1000 : TARGET_DT;
    lastTime = currentTime;
    const timeScale = Math.min(getTimeMultiplier(dt), 2); // cap a 2x per evitare salti

    const scale = getScale();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Applica fisica con timeScale
    birdVelocity += BASE_GRAVITY * timeScale;
    birdY += birdVelocity * timeScale;

    // Uccello ridimensionato
    const birdSize = 30 * scale;
    ctx.fillStyle = "yellow";
    ctx.fillRect(birdX * scale, birdY, birdSize, birdSize);

    ctx.fillStyle = "green";
    pipes.forEach(pipe => {
        pipe.x -= BASE_PIPE_SPEED * timeScale;

        ctx.fillRect(pipe.x, 0, pipeWidth * scale, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth * scale, canvas.height - pipe.bottom);

        if (birdX * scale < pipe.x + pipeWidth * scale &&
            birdX * scale + birdSize > pipe.x &&
            (birdY < pipe.top || birdY + birdSize > pipe.bottom)) {
            endGame();
        }

        if (pipe.x + pipeWidth * scale <= birdX * scale && pipe.x + pipeWidth * scale + BASE_PIPE_SPEED * timeScale > birdX * scale) {
            score++;
        }
    });

    if (birdY > canvas.height - birdSize || birdY < 0) endGame();

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText(score, 10, 40);

    requestAnimationFrame(update);

}

function endGame() {
    gameOver = true; 
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Tap to restart", canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = "left";
}

function restartGame() {
    birdY = 150;
    birdVelocity = 0;
    pipes = []; score = 0;
    gameOver = false;
    lastTime = 0;
    requestAnimationFrame(update);
}

update(performance.now());