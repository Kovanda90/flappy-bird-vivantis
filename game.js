class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameRunning = false;
        this.bird = {
            x: 50,
            y: 200,
            velocity: 0,
            gravity: 0.2,    // Ještě více zpomalil jsem gravitaci
            jumpPower: -5,   // Ještě mírnější skoky
            size: 60  // Zvětšil jsem velikost na 60 pixelů
        };
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 200;  // Zvětšil jsem mezeru mezi horní a dolní trubkou
        this.pipeSpeed = 1.5; // Zpomalil jsem pohyb trubek
        this.lastPipeTime = 0;
        this.pipeInterval = 2500; // Zvětšil jsem interval mezi trubkami (ms)
        
        this.birdImage = new Image();
        this.birdImage.src = 'ptacek/Ptacek MR.png';
        this.birdImage.onload = () => {
            console.log('Obrázek ptáčka načten');
        };
        
        // Načtení obrázků oblohy
        this.skyImages = [];
        this.skyImageNames = ['obloha.png', 'obloha1.png', 'obloha2.png'];
        
        this.skyImageNames.forEach((imageName, index) => {
            const img = new Image();
            img.src = `obloha/${imageName}`;
            img.onload = () => {
                console.log(`Obrázek oblohy ${index + 1} načten`);
            };
            this.skyImages.push(img);
        });
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadLeaderboard();
        
        // Hudba
        this.backgroundMusic = document.getElementById('background-music');
        this.musicVolume = 0.3; // Nastavím nižší hlasitost
        this.backgroundMusic.volume = this.musicVolume;
        
        // Zvuk skoku
        this.jumpSound = document.getElementById('jump-sound');
        this.jumpSound.volume = 0.5; // Nastavím hlasitost zvuku skoku
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupEventListeners() {
        // Menu navigation
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showScreen('leaderboard-screen'));
        document.getElementById('about-btn').addEventListener('click', () => this.showScreen('about-screen'));
        
        // Game controls
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('about-back-btn').addEventListener('click', () => this.showScreen('menu'));
        
        // Touch and keyboard controls
        this.canvas.addEventListener('click', () => this.jump());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.jump();
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'leaderboard-screen') {
            this.updateLeaderboard();
        }
    }

    startGame() {
        this.showScreen('game-screen');
        this.resetGame();
        this.gameRunning = true;
        this.gameLoop();
        
        // Spustí hudbu
        this.playBackgroundMusic();
    }

    resetGame() {
        this.score = 0;
        this.bird.y = 200;
        this.bird.velocity = 0;
        this.pipes = [];
        this.lastPipeTime = 0;
        this.updateScore();
        document.getElementById('game-over').classList.add('hidden');
    }

    restartGame() {
        this.resetGame();
        this.gameRunning = true;
        this.gameLoop();
        
        // Hudba pokračuje i při restartu - necháme ji hrát
    }

    jump() {
        if (this.gameRunning) {
            this.bird.velocity = this.bird.jumpPower;
        }
    }

    updateBird() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Ground collision
        if (this.bird.y + this.bird.size > this.canvas.height) {
            this.gameOver();
        }
        
        // Ceiling collision
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
    }

    updatePipes() {
        const currentTime = Date.now();
        
        // Create new pipes
        if (currentTime - this.lastPipeTime > this.pipeInterval) {
            const gapY = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
            this.pipes.push({
                x: this.canvas.width,
                gapY: gapY,
                passed: false
            });
            this.lastPipeTime = currentTime;
        }
        
        // Update existing pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Remove pipes that are off screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver();
                return;
            }
            
            // Check if bird passed the pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.updateScore();
            }
        }
    }

    checkCollision(pipe) {
        const birdRight = this.bird.x + this.bird.size;
        const birdLeft = this.bird.x;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.size;
        
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + this.pipeWidth;
        const pipeTop = pipe.gapY;
        const pipeBottom = pipe.gapY + this.pipeGap;
        
        // Check if bird is within pipe's x-range
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check if bird hits top or bottom pipe
            if (birdTop < pipeTop || birdBottom > pipeBottom) {
                return true;
            }
        }
        
        return false;
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        // Aktualizace úrovně podle pozadí
        let level = 1;
        if (this.score >= 10) level = 2;
        if (this.score >= 20) level = 3;
        
        document.getElementById('level').textContent = `Úroveň ${level}`;
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        this.saveScore();
        
        // Hudba pokračuje i po konci hry - necháme ji hrát
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw pipes
        this.drawPipes();
        
        // Draw bird
        this.drawBird();
    }

    drawBackground() {
        // Výběr obrázku oblohy podle skóre
        let skyImageIndex = 0;
        if (this.score >= 10) skyImageIndex = 1;
        if (this.score >= 20) skyImageIndex = 2;
        
        // Omezení na dostupné obrázky
        skyImageIndex = Math.min(skyImageIndex, this.skyImages.length - 1);
        
        // Vykreslení obrázku oblohy
        if (this.skyImages[skyImageIndex] && this.skyImages[skyImageIndex].complete) {
            this.ctx.drawImage(
                this.skyImages[skyImageIndex],
                0, 0, this.canvas.width, this.canvas.height
            );
        } else {
            // Fallback - pokud se obrázek ještě nenačetl, použijeme gradient
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#4A90E2');  // Modrá obloha
            gradient.addColorStop(0.5, '#87CEEB'); // Světlejší modrá
            gradient.addColorStop(1, '#98FB98');   // Zelená země
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw clouds (volitelně - můžete odstranit, pokud chcete jen obrázky)
        this.drawClouds();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 3; i++) {
            const x = (Date.now() * 0.01 + i * 200) % (this.canvas.width + 100) - 50;
            const y = 50 + i * 30;
            this.drawCloud(x, y, 30 + i * 10);
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPipes() {
        this.ctx.fillStyle = '#FF4D79';
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, this.canvas.height - pipe.gapY - this.pipeGap);
            
            // Pipe caps - tmavší odstín stejné barvy
            this.ctx.fillStyle = '#CC3E61';
            this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x - 5, pipe.gapY + this.pipeGap, this.pipeWidth + 10, 20);
            this.ctx.fillStyle = '#FF4D79';
        });
    }

    drawBird() {
        // Draw bird image
        if (this.birdImage.complete) {
            // Vykreslí obrázek ptáčka
            this.ctx.drawImage(
                this.birdImage, 
                this.bird.x, 
                this.bird.y, 
                this.bird.size, 
                this.bird.size
            );
        } else {
            // Fallback - pokud se obrázek ještě nenačetl, nakreslíme jednoduchý ptáček
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(this.bird.x + this.bird.size/2, this.bird.y + this.bird.size/2, this.bird.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updateBird();
        this.updatePipes();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // Leaderboard functionality
    loadLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
    }

    saveScore() {
        const playerName = prompt('Zadejte své jméno:') || 'Anonym';
        const newScore = {
            name: playerName,
            score: this.score,
            date: new Date().toLocaleDateString('cs-CZ')
        };
        
        this.leaderboard.push(newScore);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // Keep only top 10
        
        localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(this.leaderboard));
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        
        if (this.leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; color: #666;">Zatím žádné skóre</p>';
            return;
        }
        
        this.leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            `;
            leaderboardList.appendChild(item);
        });
    }
    
    // Hudební funkce
    playBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.play().catch(e => {
                console.log('Hudba se nespustila:', e);
            });
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
    
    setMusicVolume(volume) {
        if (this.backgroundMusic) {
            this.musicVolume = volume;
            this.backgroundMusic.volume = volume;
        }
    }
    
    playJumpSound() {
        if (this.jumpSound) {
            // Resetuje zvuk na začátek a přehraje
            this.jumpSound.currentTime = 0;
            this.jumpSound.play().catch(e => {
                console.log('Zvuk skoku se nespustil:', e);
            });
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBirdGame();
}); 