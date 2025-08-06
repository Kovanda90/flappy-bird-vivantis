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
        this.bonusImageNames = ['ring 1.png', 'ceresne 1.png', 'lipstick 1.png', 'flash 1.png'];
        this.extraLives = 0;
        this.pipeCount = 0; // Počítadlo průletů mezi tubusy
        
        // Boss fight
        this.boss = {
            x: 0,
            y: 0,
            isActive: false,
            phase: 'warning', // warning, entering, shooting, leaving
            health: 3,
            size: 70,
            warningTime: 0,
            shootTime: 0,
            bullets: []
        };
        
        this.lastBossPhase = 'none';
        
        this.bossImage = new Image();
        this.bossImage.src = 'alzak/alzak.png';
        this.bossImage.onload = () => {
            console.log('Boss obrázek načten');
        };
        
        this.birdImage = new Image();
        this.selectedAvatar = localStorage.getItem('selectedAvatar') || 'unicorn.png'; // Načte uložený avatar nebo výchozí
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
        
        // Reset boss
        this.boss.isActive = false;
        this.boss.phase = 'warning';
        this.boss.bullets = [];
        this.lastBossPhase = 'none';
        
        this.updateScore();
        document.getElementById('game-over').classList.add('hidden');
    }

    restartGame() {
        this.resetGame();
        this.gameRunning = true;
        this.gameLoop();
        
        // Hudba pokračuje i při restartu - necháme ji hrát
    }
    
    startBossFight() {
        this.boss.isActive = true;
        this.boss.phase = 'warning';
        this.boss.warningTime = Date.now();
        this.boss.x = this.canvas.width + 50; // Blíže k obrazovce
        this.boss.y = 200;
        this.boss.bullets = [];
        console.log('Boss fight začíná!');
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
        
        // Pozastavení generování tubusů během boss fight
        if (this.boss.isActive) {
            return;
        }
        
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
        
        // Update boss fight
        this.updateBoss();
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
    
    updateBoss() {
        if (!this.boss.isActive) return;
        
        try {
            const currentTime = Date.now();
            
            // Debug informace (pouze při změně fáze)
            if (this.boss.phase !== this.lastBossPhase) {
                console.log(`Boss phase: ${this.boss.phase}, x: ${this.boss.x}, y: ${this.boss.y}`);
                this.lastBossPhase = this.boss.phase;
            }
        
        switch (this.boss.phase) {
            case 'warning':
                // 3 sekundy varování
                if (currentTime - this.boss.warningTime > 3000) {
                    this.boss.phase = 'entering';
                }
                break;
                
            case 'entering':
                // Boss vjede zprava
                this.boss.x -= 3;
                if (this.boss.x <= this.canvas.width - 100) {
                    this.boss.phase = 'shooting';
                    this.boss.shootTime = currentTime;
                }
                break;
                
            case 'shooting':
                // Vystřelí 3 střely s 0.5s odstupem
                if (this.boss.bullets.length < 3 && currentTime - this.boss.shootTime > 500) {
                    this.boss.bullets.push({
                        x: this.boss.x,
                        y: this.boss.y + this.boss.size / 2,
                        speed: 4, // Rychlejší než tubusy
                        active: true
                    });
                    this.boss.shootTime = currentTime;
                }
                
                // Po vystřelení všech střel přejde do fáze leaving
                if (this.boss.bullets.length >= 3 && this.boss.bullets.every(bullet => !bullet.active)) {
                    this.boss.phase = 'leaving';
                }
                break;
                
            case 'leaving':
                // Boss odletí nahoru
                this.boss.y -= 2;
                if (this.boss.y < -100) {
                    this.boss.isActive = false;
                    this.boss.bullets = [];
                }
                break;
        }
        
        // Update bullets
        for (let i = this.boss.bullets.length - 1; i >= 0; i--) {
            const bullet = this.boss.bullets[i];
            if (bullet.active) {
                bullet.x -= bullet.speed;
                
                // Remove bullets that are off screen
                if (bullet.x < -20) {
                    bullet.active = false;
                }
                
                // Check collision with bird
                if (this.checkBossBulletCollision(bullet)) {
                    bullet.active = false;
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Check collision with boss
        if (this.checkBossCollision()) {
            this.gameOver();
            return;
        }
        } catch (error) {
            console.error('Chyba v updateBoss:', error);
            // V případě chyby deaktivujeme boss
            this.boss.isActive = false;
        }
    }
    
    checkBossCollision() {
        const birdRight = this.bird.x + this.bird.size;
        const birdLeft = this.bird.x;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.size;
        
        const bossRight = this.boss.x + this.boss.size;
        const bossLeft = this.boss.x;
        const bossTop = this.boss.y;
        const bossBottom = this.boss.y + this.boss.size;
        
        // Check if bird collides with boss
        if (birdRight > bossLeft && birdLeft < bossRight && 
            birdBottom > bossTop && birdTop < bossBottom) {
            return true;
        }
        
        return false;
    }
    
    checkBossBulletCollision(bullet) {
        const birdRight = this.bird.x + this.bird.size;
        const birdLeft = this.bird.x;
        const birdTop = this.bird.y;
        const birdBottom = this.bird.y + this.bird.size;
        
        const bulletRight = bullet.x + 10;
        const bulletLeft = bullet.x;
        const bulletTop = bullet.y;
        const bulletBottom = bullet.y + 10;
        
        // Check if bird collides with bullet
        if (birdRight > bulletLeft && birdLeft < bulletRight && 
            birdBottom > bulletTop && birdTop < bulletBottom) {
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
        
        // Spouštění boss fight každých 5 bodů
        if (this.score > 0 && this.score % 5 === 0 && !this.boss.isActive) {
            this.startBossFight();
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
        
        // Draw boss fight
        this.drawBoss();
        
        // Draw bird
        this.drawBird();
    }

    drawBackground() {
        // Vykreslení hlavního obrázku oblohy (obloha.jpg) s zachováním poměru stran
        if (this.skyImages[0] && this.skyImages[0].complete) {
            const img = this.skyImages[0];
            const imgAspect = img.width / img.height;
            const canvasAspect = this.canvas.width / this.canvas.height;
            
            if (imgAspect > canvasAspect) {
                // Obrázek je širší - použijeme výšku canvasu
                const newWidth = this.canvas.height * imgAspect;
                const x = (this.canvas.width - newWidth) / 2;
                this.ctx.drawImage(img, x, 0, newWidth, this.canvas.height);
            } else {
                // Obrázek je vyšší - použijeme šířku canvasu
                const newHeight = this.canvas.width / imgAspect;
                const y = (this.canvas.height - newHeight) / 2;
                this.ctx.drawImage(img, 0, y, this.canvas.width, newHeight);
            }
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
        
        // Vykreslení mraků pomocí obrázků s zachováním poměru stran
        for (let i = 0; i < 2; i++) {
            const x = (Date.now() * 0.005 + i * 300) % (this.canvas.width + 150) - 75;
            const y = 30 + i * 40;
            const baseSize = 80 + i * 20;
            
            if (this.skyImages[cloudImageIndex] && this.skyImages[cloudImageIndex].complete) {
                const img = this.skyImages[cloudImageIndex];
                const imgAspect = img.width / img.height;
                const newWidth = baseSize;
                const newHeight = baseSize / imgAspect;
                const adjustedY = y + (baseSize - newHeight) / 2;
                
                this.ctx.drawImage(
                    img,
                    x, adjustedY, newWidth, newHeight
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
            // Vykreslí obrázek ptáčka s zachováním poměru stran
            const img = this.birdImage;
            const size = this.bird.size;
            const imgAspect = img.width / img.height;
            const newWidth = size;
            const newHeight = size / imgAspect;
            const y = this.bird.y + (size - newHeight) / 2;
            this.ctx.drawImage(
                img, 
                this.bird.x, 
                y, 
                newWidth, 
                newHeight
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
                const img = this.bonusImages[bonus.type];
                const size = 50;
                const imgAspect = img.width / img.height;
                const newWidth = size;
                const newHeight = size / imgAspect;
                const y = bonus.y + (size - newHeight) / 2;
                this.ctx.drawImage(img, bonus.x, y, newWidth, newHeight);
            } else {
                // Fallback - nakreslíme barevný kruh
                this.ctx.fillStyle = bonus.type === 3 ? '#FFD700' : '#FF69B4';
                this.ctx.beginPath();
                this.ctx.arc(bonus.x + 25, bonus.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawBoss() {
        if (!this.boss.isActive) return;
        
        try {
        
        // Draw warning light (malá zelená siréna)
        if (this.boss.phase === 'warning') {
            const warningAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            
            // Malá blikající siréna v pravém horním rohu
            this.ctx.fillStyle = `rgba(0, 255, 0, ${warningAlpha})`;
            this.ctx.fillRect(this.canvas.width - 60, 20, 40, 40);
            
            // Černý střed sirény
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(this.canvas.width - 50, 30, 20, 20);
            
            // Warning text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 2rem Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BOSS FIGHT!', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // Draw boss
        if (this.boss.phase !== 'warning' && this.bossImage.complete) {
            this.ctx.drawImage(
                this.bossImage,
                this.boss.x, this.boss.y, this.boss.size, this.boss.size
            );
        }
        
        // Draw bullets
        this.boss.bullets.forEach(bullet => {
            if (bullet.active) {
                // Zelené střely
                this.ctx.fillStyle = '#00FF00';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x + 5, bullet.y + 5, 5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Particle efekty za střelami
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x + 10 + i * 3, bullet.y + 5, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
        } catch (error) {
            console.error('Chyba v drawBoss:', error);
        }
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.updateBird();
        this.updatePipes();
        this.updateBoss(); // Přidáno volání updateBoss
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // Firebase Leaderboard functionality
    async loadLeaderboard() {
        try {
            if (window.db) {
                const snapshot = await window.db.collection('scores')
                    .orderBy('score', 'desc')
                    .limit(10)
                    .get();
                
                this.leaderboard = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.leaderboard.push({
                        name: data.playerName,
                        score: data.score,
                        date: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('cs-CZ') : 'Dnes'
                    });
                });
            } else {
                console.log('Firebase není dostupné, používá se lokální žebříček');
                this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
            }
        } catch (error) {
            console.error('Chyba při načítání žebříčku:', error);
            // Fallback na lokální žebříček
            this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
        }
    }

    async saveScore() {
        const playerName = prompt('Zadejte své jméno:') || 'Anonym';
        const newScore = {
            name: playerName,
            score: this.score,
            date: new Date().toLocaleDateString('cs-CZ')
        };
        
        // Uložení do Firebase
        try {
            if (window.db) {
                await window.db.collection('scores').add({
                    playerName: playerName,
                    score: this.score,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Skóre uloženo do Firebase');
            }
        } catch (error) {
            console.error('Chyba při ukládání do Firebase:', error);
        }
        
        // Fallback na lokální úložiště
        this.leaderboard.push(newScore);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(this.leaderboard));
    }

    async updateLeaderboard() {
        // Načte aktuální žebříček z Firebase
        await this.loadLeaderboard();
        
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