document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const scoreElement = document.getElementById('score');
    
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    let score = 0;
    
    // Game objects
    let snake = [
        {x: 10, y: 10}
    ];
    let food = {x: 5, y: 5};
    let dx = 0;
    let dy = 0;
    let gameLoop;
    let gameRunning = false;
    
    // Draw functions
    function drawGame() {
        clearCanvas();
        moveSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        drawFood();
        drawSnake();
        
        if (snake[0].x === food.x && snake[0].y === food.y) {
            score += 10;
            scoreElement.textContent = score;
            confettiBurst(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
            generateFood();
            // Don't remove the tail to make snake grow
        } else {
            // Remove the tail if no food was eaten
            snake.pop();
        }
    }
    
    // Gradually transition background from grey to dark green as food is collected
    function clearCanvas() {
        // Calculate progress (0 to 1)
        let progress = Math.min(score / 200, 1); // 20 food = 200 points
        // Interpolate color from #ecf0f1 (grey) to #013220 (dark green)
        function lerp(a, b, t) { return a + (b - a) * t; }
        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            return [parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16)];
        }
        let grey = hexToRgb('ecf0f1');
        let green = hexToRgb('013220');
        let r = Math.round(lerp(grey[0], green[0], progress));
        let g = Math.round(lerp(grey[1], green[1], progress));
        let b = Math.round(lerp(grey[2], green[2], progress));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawSnake() {
        snake.forEach((segment, index) => {
            if (index === 0) {
                // Draw frog emoji for head
                ctx.font = `${gridSize * 0.9}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🐸', segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2 + 1);
            } else {
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
            }
        });
    }
    
    function drawFood() {
        ctx.font = `${gridSize * 0.9}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪰', food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2 + 1);
    }
    
    // Game logic
    function moveSnake() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        snake.unshift(head);
    }
    
    function checkCollision() {
        const head = snake[0];
        
        // Wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return true;
        }
        
        // Self collision (skip the head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    function generateFood() {
        let newFood;
        let overlapping;
        
        do {
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            overlapping = false;
            for (const segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    overlapping = true;
                    break;
                }
            }
        } while (overlapping);
        
        food = newFood;
    }
    
    function gameOver() {
        clearInterval(gameLoop);
        gameRunning = false;
        startBtn.textContent = 'Play Again';
        alert(`Game Over! Your score: ${score}`);
    }
    
    function resetGame() {
        snake = [{x: 10, y: 10}];
        dx = 1;
        dy = 0;
        score = 0;
        scoreElement.textContent = score;
        generateFood();
    }
    
    // --- Confetti burst effect ---
    let confettiParticles = [];
    function confettiBurst(x, y) {
        const colors = ['#ffec3d', '#ff85c0', '#5cdbd3', '#b7eb8f', '#ffd666'];
        for (let i = 0; i < 18; i++) {
            confettiParticles.push({
                x: x,
                y: y,
                angle: (Math.PI * 2 * i) / 18,
                speed: Math.random() * 2 + 2,
                life: 20 + Math.random() * 10,
                color: colors[i % colors.length],
            });
        }
    }
    function updateConfetti() {
        for (let p of confettiParticles) {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.speed *= 0.92;
            p.life--;
        }
        confettiParticles = confettiParticles.filter(p => p.life > 0);
    }
    function drawConfetti() {
        for (let p of confettiParticles) {
            ctx.save();
            ctx.globalAlpha = Math.max(p.life / 30, 0.3);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }

    // Patch drawGame to update/draw confetti
    const originalDrawGame = drawGame;
    drawGame = function() {
        clearCanvas();
        moveSnake();
        if (checkCollision()) {
            gameOver();
            return;
        }
        drawFood();
        drawSnake();
        updateConfetti();
        drawConfetti();
        if (snake[0].x === food.x && snake[0].y === food.y) {
            score += 10;
            scoreElement.textContent = score;
            confettiBurst(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
            generateFood();
            // Don't remove the tail to make snake grow
        } else {
            // Remove the tail if no food was eaten
            snake.pop();
        }
    }

    // Event listeners
    document.addEventListener('keydown', (e) => {
        // Prevent 180-degree turns
        switch(e.key) {
            case 'ArrowUp':
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case 'ArrowDown':
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case 'ArrowLeft':
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case 'ArrowRight':
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
        }
    });
    
    startBtn.addEventListener('click', () => {
        if (gameRunning) {
            clearInterval(gameLoop);
            resetGame();
        }
        
        gameRunning = true;
        startBtn.textContent = 'Restart Game';
        resetGame();
        gameLoop = setInterval(drawGame, 100);
    });
    
    // Initial setup
    generateFood();
});
