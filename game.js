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
        
        // Bonusové předměty
        this.bonuses = [];
        this.bonusImages = [];
        this.bonusImageNames = ['ring.png', 'ceresne.png', 'lipstick.png', 'flash.png'];
        this.extraLives = 0;
        this.pipeCount = 0; // Počítadlo průletů mezi tubusy
        
        this.birdImage = new Image();
        this.selectedAvatar = localStorage.getItem('selectedAvatar') || 'plamenak.png'; // Načte uložený avatar nebo výchozí
        this.birdImage.src = `ptacek/${this.selectedAvatar}`;
        this.birdImage.onload = () => {
            console.log('Obrázek ptáčka načten');
        };
        
        // Načtení obrázků oblohy
        this.skyImages = [];
        this.skyImageNames = ['obloha.jpg', 'mrak1.png', 'mrak2.png', 'mrak3.png'];
        
        this.skyImageNames.forEach((imageName, index) => {
            const img = new Image();
            img.src = `obloha/${imageName}`;
            img.onload = () => {
                console.log(`Obrázek oblohy ${index + 1} načten`);
            };
            this.skyImages.push(img);
        });
        
        // Načtení bonusových obrázků
        this.bonusImageNames.forEach((imageName, index) => {
            const img = new Image();
            img.src = `bonusy/${imageName}`;
            img.onload = () => {
                console.log(`Bonusový obrázek ${imageName} načten`);
            };
            this.bonusImages.push(img);
        });
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadLeaderboard();
        
        // Hudba
        this.backgroundMusic = document.getElementById('background-music');
        this.musicVolume = 0.3; // Nastavím nižší hlasitost
        this.backgroundMusic.volume = this.musicVolume;
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupEventListeners() {
        // Menu navigation
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('avatar-btn').addEventListener('click', () => this.showScreen('avatar-screen'));
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showScreen('leaderboard-screen'));
        document.getElementById('about-btn').addEventListener('click', () => this.showScreen('about-screen'));
        
        // Game controls
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('about-back-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('avatar-back-btn').addEventListener('click', () => this.showScreen('menu'));
        
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
        
        if (screenId === 'avatar-screen') {
            this.setupAvatarSelection();
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
        this.bonuses = [];
        this.extraLives = 0;
        this.pipeCount = 0;
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
                passed: false,
                collisionHandled: false
            });
            
            // Přidání bonusu každých 5 průletů (ring, ceresne, lipstick) - ale ne když je flash
            if (this.pipeCount % 5 === 0 && this.pipeCount > 0 && this.pipeCount % 10 !== 0) {
                const bonusType = Math.floor(Math.random() * 3); // 0-2 pro ring, ceresne, lipstick
                this.bonuses.push({
                    x: this.canvas.width + 100,
                    y: gapY + this.pipeGap / 2 - 25,
                    type: bonusType,
                    collected: false
                });
            }
            
            // Přidání flash bonusu každých 10 průletů (samostatně)
            if (this.pipeCount % 10 === 0 && this.pipeCount > 0) {
                this.bonuses.push({
                    x: this.canvas.width + 100,
                    y: gapY + this.pipeGap / 2 - 25,
                    type: 3, // flash
                    collected: false
                });
            }
            
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
            
            // Check collision (pouze pokud ještě nebyla zpracována)
            if (!pipe.collisionHandled && this.checkCollision(pipe)) {
                // Pokud má hráč extra život, spotřebuje ho a pokračuje
                if (this.extraLives > 0) {
                    this.extraLives--;
                    this.updateScore();
                    // Pták proletí tubusem - pokračuje ve hře
                    // Označíme tubus jako již zpracovaný, aby se život nespotřeboval znovu
                    pipe.collisionHandled = true;
                } else {
                    this.gameOver();
                    return;
                }
            }
            
            // Check if bird passed the pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.pipeCount++;
                this.updateScore();
            }
        }
        
        // Update bonuses
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            const bonus = this.bonuses[i];
            bonus.x -= this.pipeSpeed;
            
            // Remove bonuses that are off screen
            if (bonus.x + 50 < 0) {
                this.bonuses.splice(i, 1);
                continue;
            }
            
            // Check collision with bonus
            if (!bonus.collected && this.checkBonusCollision(bonus)) {
                bonus.collected = true;
                if (bonus.type === 3) { // flash
                    this.extraLives++;
                } else { // ring, ceresne, lipstick
                    this.score += 5; // Přidá 5 bodů přímo k hlavnímu skóre
                }
                this.bonuses.splice(i, 1);
                this.updateScore(); // Aktualizuje zobrazení skóre
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
    
    checkBonusCollision(bonus) {
        const birdRight = this.bird.x + this.bird.size;
        const birdLeft = this.bird.x;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.size;
        
        const bonusRight = bonus.x + 50;
        const bonusLeft = bonus.x;
        const bonusTop = bonus.y;
        const bonusBottom = bonus.y + 50;
        
        // Check if bird collides with bonus
        if (birdRight > bonusLeft && birdLeft < bonusRight && 
            birdBottom > bonusTop && birdTop < bonusBottom) {
            return true;
        }
        
        return false;
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        // Zobrazení bonusových životů nebo úrovně
        if (this.extraLives > 0) {
            document.getElementById('level').textContent = `Životy: ${this.extraLives}`;
        } else {
            // Aktualizace úrovně podle pozadí
            let level = 1;
            if (this.score >= 10) level = 2;
            if (this.score >= 20) level = 3;
            document.getElementById('level').textContent = `Úroveň ${level}`;
        }
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
        
        // Draw bonuses
        this.drawBonuses();
        
        // Draw bird
        this.drawBird();
    }

    drawBackground() {
        // Vykreslení hlavního obrázku oblohy (obloha.jpg)
        if (this.skyImages[0] && this.skyImages[0].complete) {
            this.ctx.drawImage(
                this.skyImages[0],
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
        
        // Vykreslení mraků podle skóre
        this.drawClouds();
    }

    drawClouds() {
        // Výběr obrázku mraku podle skóre
        let cloudImageIndex = 1; // Začínáme s mrak1.png
        if (this.score >= 10) cloudImageIndex = 2; // mrak2.png
        if (this.score >= 20) cloudImageIndex = 3; // mrak3.png
        
        // Omezení na dostupné obrázky mraků
        cloudImageIndex = Math.min(cloudImageIndex, this.skyImages.length - 1);
        
        // Vykreslení mraků pomocí obrázků
        for (let i = 0; i < 2; i++) {
            const x = (Date.now() * 0.005 + i * 300) % (this.canvas.width + 150) - 75;
            const y = 30 + i * 40;
            const size = 80 + i * 20;
            
            if (this.skyImages[cloudImageIndex] && this.skyImages[cloudImageIndex].complete) {
                this.ctx.drawImage(
                    this.skyImages[cloudImageIndex],
                    x, y, size, size * 0.6
                );
            }
        }
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
    
    drawBonuses() {
        this.bonuses.forEach(bonus => {
            if (this.bonusImages[bonus.type] && this.bonusImages[bonus.type].complete) {
                this.ctx.drawImage(
                    this.bonusImages[bonus.type],
                    bonus.x, bonus.y, 50, 50
                );
            } else {
                // Fallback - nakreslíme barevný kruh
                this.ctx.fillStyle = bonus.type === 3 ? '#FFD700' : '#FF69B4';
                this.ctx.beginPath();
                this.ctx.arc(bonus.x + 25, bonus.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
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
    
    setupAvatarSelection() {
        // Označí aktuálně vybraný avatar
        document.querySelectorAll('.avatar-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.avatar === this.selectedAvatar) {
                item.classList.add('selected');
            }
        });
        
        // Přidá event listenery pro výběr avataru
        document.querySelectorAll('.avatar-item').forEach(item => {
            item.addEventListener('click', () => this.selectAvatar(item.dataset.avatar));
        });
    }
    
    selectAvatar(avatarName) {
        this.selectedAvatar = avatarName;
        
        // Aktualizuje vizuální výběr
        document.querySelectorAll('.avatar-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.avatar === avatarName) {
                item.classList.add('selected');
            }
        });
        
        // Načte nový obrázek ptáčka
        this.birdImage = new Image();
        this.birdImage.src = `ptacek/${avatarName}`;
        this.birdImage.onload = () => {
            console.log(`Avatar ${avatarName} načten`);
        };
        
        // Uloží výběr do localStorage
        localStorage.setItem('selectedAvatar', avatarName);
    }
    

}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBirdGame();
}); 