// Get Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set Canvas Dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
}
resizeCanvas();

// UI Elements
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Game Variables
let score = 0;
let gameOverFlag = false;
let spaceship;
let asteroids = [];
let bullets = [];
let specialAbilityReady = true;

// Handle Keyboard Input
const keys = {
    a: false,
    d: false,
    w: false,
    space: false
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === ' ') keys.space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === ' ') keys.space = false;
});

// Utility Functions
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// --- Enhancement: Background Stars ---

// Star Class
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2;
        this.speed = Math.random() * 0.5;
    }

    draw() {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
}

let stars = [];

function createStars(num) {
    for (let i = 0; i < num; i++) {
        stars.push(new Star());
    }
}

// --- Enhancement: Particle Effects ---

// Particle Class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2 + 1;
        this.speed = Math.random() * 2 - 1;
        this.velocityX = Math.random() * 4 - 2;
        this.velocityY = Math.random() * 4 - 2;
        this.life = 1000; // milliseconds
        this.spawnTime = Date.now();
        this.color = '#ffaaaa';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        // Fade out
        const elapsed = Date.now() - this.spawnTime;
        if (elapsed > this.life) {
            particles = particles.filter(p => p !== this);
        }
    }
}

let particles = [];

// --- End of Enhancements ---

// Spaceship Class
class Spaceship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.angle = 0; // In radians
        this.rotationSpeed = 0.05;
        this.bulletCooldown = 500; // milliseconds
        this.lastBulletTime = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, 12);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, -12);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    update() {
        if (keys.a) {
            this.angle -= this.rotationSpeed;
        }
        if (keys.d) {
            this.angle += this.rotationSpeed;
        }
        if (keys.w) {
            const currentTime = Date.now();
            if (currentTime - this.lastBulletTime > this.bulletCooldown) {
                bullets.push(new Bullet(this.x, this.y, this.angle));
                this.lastBulletTime = currentTime;
            }
        }
        if (keys.space && specialAbilityReady) {
            useSpecialAbility();
            specialAbilityReady = false;
            setTimeout(() => { specialAbilityReady = true; }, 10000); // 10 seconds cooldown
        }
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, angle) {
        this.x = x + Math.cos(angle) * 20;
        this.y = y + Math.sin(angle) * 20;
        this.radius = 3;
        this.speed = 7;
        this.angle = angle;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.life = 1000; // milliseconds
        this.spawnTime = Date.now();
    }

    draw() {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Remove bullet after its life expires or if it goes off-screen
        if (Date.now() - this.spawnTime > this.life ||
            this.x < 0 || this.x > canvas.width ||
            this.y < 0 || this.y > canvas.height) {
            bullets = bullets.filter(b => b !== this);
        }
    }
}

// Asteroid Class
class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size; // 3: large, 2: medium, 1: small
        this.radius = size * 15;
        this.speed = randomRange(1, 3);
        const angle = randomRange(0, Math.PI * 2);
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        this.vertices = Math.floor(randomRange(7, 12));
        this.offsets = [];
        for (let i = 0; i < this.vertices; i++) {
            this.offsets.push(randomRange(0.7, 1.3));
        }
    }

    draw() {
        ctx.save();
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 2;
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        for (let i = 0; i < this.vertices; i++) {
            const angle = (i / this.vertices) * Math.PI * 2;
            const r = this.radius * this.offsets[i];
            const x = this.x + Math.cos(angle) * r;
            const y = this.y + Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Wrap around the screen
        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
    }
}

// Special Ability: Destroy all asteroids on screen
function useSpecialAbility() {
    asteroids = [];
    bullets = [];
    score += 50;
}

// Initialize Game
function init() {
    spaceship = new Spaceship(canvas.width / 2, canvas.height / 2);
    score = 0;
    asteroids = [];
    bullets = [];
    gameOverFlag = false;
    gameOverElement.classList.add('hidden');
    spawnAsteroids();
    asteroidSpawnInterval = 2000; // Reset spawn interval
    lastSpawnTime = Date.now();
    animate();
}

// Spawn Initial Asteroids
function spawnAsteroids() {
    for (let i = 0; i < 5; i++) {
        const edge = Math.floor(randomRange(0, 4));
        let x, y;
        switch (edge) {
            case 0: // Top
                x = randomRange(0, canvas.width);
                y = -30;
                break;
            case 1: // Right
                x = canvas.width + 30;
                y = randomRange(0, canvas.height);
                break;
            case 2: // Bottom
                x = randomRange(0, canvas.width);
                y = canvas.height + 30;
                break;
            case 3: // Left
                x = -30;
                y = randomRange(0, canvas.height);
                break;
        }
        asteroids.push(new Asteroid(x, y, 3));
    }
}

// Animation Loop
let asteroidSpawnInterval = 2000; // milliseconds
let lastSpawnTime = Date.now();

function animate() {
    if (gameOverFlag) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and Draw Stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    // Update and Draw Particles
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Update and Draw Spaceship
    spaceship.update();
    spaceship.draw();

    // Update and Draw Bullets
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();
    });

    // Update and Draw Asteroids
    asteroids.forEach(asteroid => {
        asteroid.update();
        asteroid.draw();
    });

    // Collision Detection: Bullets and Asteroids
    bullets.forEach(bullet => {
        asteroids.forEach(asteroid => {
            if (distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                // Destroy asteroid and bullet
                bullets = bullets.filter(b => b !== bullet);
                destroyAsteroid(asteroid);
            }
        });
    });

    // Collision Detection: Spaceship and Asteroids
    asteroids.forEach(asteroid => {
        if (distance(spaceship.x, spaceship.y, asteroid.x, asteroid.y) < asteroid.radius + spaceship.radius) {
            endGame();
        }
    });

    // Update Score
    scoreElement.textContent = `Score: ${score}`;

    // Spawn More Asteroids Over Time
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime > asteroidSpawnInterval) {
        spawnAsteroids();
        lastSpawnTime = currentTime;
        if (asteroidSpawnInterval > 500) { // Decrease spawn interval to increase difficulty
            asteroidSpawnInterval -= 100;
        }
    }

    requestAnimationFrame(animate);
}

// Destroy Asteroid
function destroyAsteroid(asteroid) {
    score += 10;
    // Create particles
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(asteroid.x, asteroid.y));
    }
    if (asteroid.size > 1) {
        // Split into smaller asteroids
        for (let i = 0; i < 2; i++) {
            asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size - 1));
        }
    }
    asteroids = asteroids.filter(a => a !== asteroid);
}

// End Game
function endGame() {
    gameOverFlag = true;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

// Restart Game
restartButton.addEventListener('click', init);

// Start the Game
createStars(100); // Initialize Stars
init();

// Handle Window Resize
window.addEventListener('resize', () => {
    resizeCanvas();
    spaceship.x = canvas.width / 2;
    spaceship.y = canvas.height / 2;
});
