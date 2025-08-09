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
        
        // Systém postupné obtížnosti - začínáme velmi pohodově
        this.basePipeSpeed = 1.0;    // Základní rychlost trubek - začínáme pomaleji
        this.baseGapHeight = 250;    // Základní výška průchodu - ještě větší na začátku
        this.basePipeInterval = 3500; // Základní interval mezi trubkami - větší startovní rozestupy
        
        // Aktuální hodnoty (budou se měnit podle obtížnosti)
        this.pipeSpeed = this.basePipeSpeed;
        this.gapHeight = this.baseGapHeight;
        
        this.lastPipeTime = 0;
        this.pipeInterval = this.basePipeInterval; // Začínáme s většími rozestupy
        
        // Bonusové předměty
        this.bonuses = [];
        this.bonusImages = [];
        this.bonusImageNames = ['ring 1.png', 'ceresne 1.png', 'lipstick 1.png', 'flash 1.png'];
        this.extraLives = 0;
        this.pipeCount = 0; // Počítadlo průletů mezi tubusy


        

        
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
        console.log(`Canvas nastaven: ${this.canvas.width}x${this.canvas.height}`);
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
        
        // Reset obtížnosti na základní hodnoty
        this.pipeSpeed = this.basePipeSpeed;
        this.gapHeight = this.baseGapHeight;
        this.pipeInterval = this.basePipeInterval;
        
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

    async updateBird() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Ground collision
        if (this.bird.y + this.bird.size > this.canvas.height) {
            await this.gameOver();
        }
        
        // Ceiling collision
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
    }

    async updatePipes() {
        const currentTime = Date.now();
        

        
        // Create new pipes
        if (currentTime - this.lastPipeTime > this.pipeInterval) {
            // Použijeme gapHeight pro výšku průchodu, ale pipeGap pro pozici bonusů
            const gapY = Math.random() * (this.canvas.height - this.gapHeight - 100) + 50;
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
                    y: gapY + this.gapHeight / 2 - 25,
                    type: bonusType,
                    collected: false
                });
            }
            
            // Přidání flash bonusu každých 10 průletů (samostatně)
            if (this.pipeCount % 10 === 0 && this.pipeCount > 0) {
                this.bonuses.push({
                    x: this.canvas.width + 100,
                    y: gapY + this.gapHeight / 2 - 25,
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
                    await this.gameOver();
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
        const pipeBottom = pipe.gapY + this.gapHeight; // Použijeme gapHeight místo pipeGap
        
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
        
        // Aktualizace obtížnosti podle skóre
        this.updateDifficulty();
    }
    
    updateDifficulty() {
        // Rychlost trubek - každých 5 bodů +0.1px/frame, maximum 4px/frame (častější a jemnější nárůst)
        this.pipeSpeed = Math.min(4, this.basePipeSpeed + (this.score / 5) * 0.1);
        

        
        // Výška průchodu - každých 50 bodů -3px, minimum 120px (plynulejší zmenšování)
        this.gapHeight = Math.max(120, this.baseGapHeight - (this.score / 50) * 3);
        
        // Interval mezi trubkami - každých 15 bodů -10% rozestupu, minimum 800ms pro zachování hratelnosti
        this.pipeInterval = Math.max(800, (3500 * Math.pow(0.90, this.score / 15)) / this.pipeSpeed);
        
        // Debug informace s detailními informacemi o rozestupech
        const actualDistance = this.pipeInterval * this.pipeSpeed;
        console.log(`Skóre: ${this.score}, Rychlost: ${this.pipeSpeed.toFixed(2)}px/frame, Průchod: ${this.gapHeight.toFixed(1)}px, Interval: ${this.pipeInterval.toFixed(0)}ms, Skutečná vzdálenost: ${actualDistance.toFixed(0)}px`);
    }

    async gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        await this.saveScore();
        
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
        // Vykreslení hlavního obrázku oblohy (pozadi_nove.jpg) s zachováním poměru stran
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
                    let cloudImageIndex = 1; // Začínáme s mrak1 1.png
        if (this.score >= 10) cloudImageIndex = 2; // mrak2 1.png
        if (this.score >= 20) cloudImageIndex = 3; // mrak3 1.png
        
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
            this.ctx.fillRect(pipe.x, pipe.gapY + this.gapHeight, this.pipeWidth, this.canvas.height - pipe.gapY - this.gapHeight);
            
            // Pipe caps - tmavší odstín stejné barvy
            this.ctx.fillStyle = '#CC3E61';
            this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x - 5, pipe.gapY + this.gapHeight, this.pipeWidth + 10, 20);
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
                if (bonus.type === 3) { // flash
                    this.ctx.fillStyle = '#FFD700';
                } else {
                    this.ctx.fillStyle = '#FF69B4';
                }
                this.ctx.beginPath();
                this.ctx.arc(bonus.x + 25, bonus.y + 25, 25, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    



    async gameLoop() {
        if (!this.gameRunning) return;
        
        await this.updateBird();
        await this.updatePipes();

        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // Funkce pro odstranění duplikátů ze žebříčku
    removeDuplicates() {
        const seen = new Set();
        const originalLength = this.leaderboard.length;
        const removedEntries = [];
        
        this.leaderboard = this.leaderboard.filter(entry => {
            const key = `${entry.name}-${entry.score}`;
            if (seen.has(key)) {
                removedEntries.push(entry);
                console.log('Odstraňuji duplikát:', entry.name, entry.score, 'klíč:', key);
                return false;
            }
            seen.add(key);
            return true;
        });
        
        console.log('Duplikáty odstraněny, zbývá:', this.leaderboard.length, 'záznamů');
        console.log('Odstraněno:', removedEntries.length, 'duplikátů');
        if (removedEntries.length > 0) {
            console.log('Odstraněné záznamy:', removedEntries);
        }
    }

    async loadLeaderboard() {
        try {
            if (window.db) {
                // Firebase je dostupné - načteme více záznamů pro případ duplikátů
                const snapshot = await window.db.collection('scores')
                    .orderBy('score', 'desc')
                    .limit(20) // Načteme 20 záznamů místo 10
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
                console.log('Žebříček načten z Firebase:', this.leaderboard.length, 'záznamů');
            } else {
                // Firebase není dostupné - načteme pouze z localStorage
                console.log('Firebase není dostupné, používá se lokální žebříček');
                this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
                console.log('Žebříček načten z localStorage:', this.leaderboard.length, 'záznamů');
            }
            
            console.log('Před odstraněním duplikátů:', this.leaderboard.length, 'záznamů');
            
            // Odstraníme duplikáty
            this.removeDuplicates();
            
            console.log('Po odstranění duplikátů:', this.leaderboard.length, 'záznamů');
            
            // Seřadíme a omezíme na top 10
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.leaderboard = this.leaderboard.slice(0, 10);
            
            console.log('Finální žebříček:', this.leaderboard.length, 'záznamů');
            
        } catch (error) {
            console.error('Chyba při načítání žebříčku:', error);
            // Fallback na lokální žebříček
            this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
            console.log('Fallback na localStorage:', this.leaderboard.length, 'záznamů');
            
            // I zde odstraníme duplikáty
            this.removeDuplicates();
            this.leaderboard.sort((a, b) => b.score - a.score);
            this.leaderboard = this.leaderboard.slice(0, 10);
        }
    }

    async saveScore() {
        // Zobrazí vlastní dialog pro zadání jména
        return new Promise((resolve) => {
            this.showNameDialog((playerName) => {
                const name = playerName || 'Anonym';
                
                // Uložení do Firebase
                this.saveToFirebase(name).then(() => {
                    // Po úspěšném uložení do Firebase načteme aktuální žebříček
                    this.loadLeaderboard().then(() => {
                        resolve();
                    });
                }).catch((error) => {
                    console.log('Firebase selhal, ukládám lokálně:', error);
                    // Fallback na lokální úložiště pouze pokud Firebase selže
                    const newScore = {
                        name: name,
                        score: this.score,
                        date: new Date().toLocaleDateString('cs-CZ')
                    };
                    
                    // Načteme aktuální lokální žebříček
                    this.leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard') || '[]');
                    
                    // Přidáme nové skóre
                    this.leaderboard.push(newScore);
                    
                    // Seřadíme a omezíme na top 10
                    this.leaderboard.sort((a, b) => b.score - a.score);
                    this.leaderboard = this.leaderboard.slice(0, 10);
                    
                    // Uložíme do localStorage
                    localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(this.leaderboard));
                    resolve();
                });
            });
        });
    }

    showNameDialog(callback) {
        const nameDialog = document.getElementById('name-dialog');
        const nameInput = document.getElementById('player-name-input');
        const saveBtn = document.getElementById('save-name-btn');
        const cancelBtn = document.getElementById('cancel-name-btn');

        // Zobrazí dialog
        this.showScreen('name-dialog');
        nameInput.focus();
        nameInput.value = '';

        // Event listenery
        const handleSave = () => {
            const name = nameInput.value.trim();
            this.showScreen('game-screen');
            callback(name);
        };

        const handleCancel = () => {
            this.showScreen('game-screen');
            callback('Anonym');
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSave();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Přidá event listenery
        saveBtn.addEventListener('click', handleSave, { once: true });
        cancelBtn.addEventListener('click', handleCancel, { once: true });
        nameInput.addEventListener('keydown', handleKeyPress, { once: true });
    }

    async saveToFirebase(playerName) {
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