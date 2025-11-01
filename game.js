class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameRunning = false;
        this.waitingForFirstClick = false; // Čekáme na první klik před startem hry
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
        document.getElementById('about-btn').addEventListener('click', () => this.showScreen('about-screen'));
        
        // Game controls
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('about-back-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('avatar-back-btn').addEventListener('click', () => this.showScreen('menu'));
        
        // Poznámka: back-btn pro leaderboard byl odstraněn, protože žebříček už neexistuje
        
        // Touch and keyboard controls
        this.canvas.addEventListener('click', () => this.jump());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        // Zabrání scrollování a zoomování při dotyku na canvas (mobil)
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
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
        
        if (screenId === 'avatar-screen') {
            this.setupAvatarSelection();
        }
    }

    startGame() {
        this.showScreen('game-screen');
        this.resetGame();
        this.waitingForFirstClick = true; // Čekáme na první klik
        this.gameRunning = false; // Hra ještě neběží
        this.gameLoop(); // Spustíme loop, ale hra čeká na klik
        
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
        this.waitingForFirstClick = true; // Čekáme na první klik
        this.gameRunning = false; // Hra ještě neběží
        this.gameLoop();
        
        // Hudba pokračuje i při restartu - necháme ji hrát
    }
    


    jump() {
        // Pokud čekáme na první klik, začni hru
        if (this.waitingForFirstClick) {
            this.waitingForFirstClick = false;
            this.gameRunning = true;
            this.bird.velocity = this.bird.jumpPower; // První skok
            return;
        }
        
        // Normální skok během hry
        if (this.gameRunning) {
            this.bird.velocity = this.bird.jumpPower;
        }
    }

    async updateBird() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Ground collision
        if (this.bird.y + this.bird.size > this.canvas.height) {
            this.playCrashSound();
            await this.gameOver();
        }
        
        // Ceiling collision
        if (this.bird.y < 0) {
            this.playCrashSound();
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
                // Přehráme crash zvuk při kolizi
                this.playCrashSound();
                
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
                
                // Přehráme pop zvuk při sesbírání bonusu
                this.playPopSound();
                
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
        
        // Zobraz zprávu podle skóre
        const message = this.getGameOverMessage(this.score);
        document.getElementById('game-over-message').textContent = message;
        
        document.getElementById('game-over').classList.remove('hidden');
        
        // Hudba pokračuje i po konci hry - necháme ji hrát
    }

    getGameOverMessage(score) {
        const messages = {
            'ultra-loser': [
                "Au. Ptáček dolítal a cestou na zem ho ještě sežrala kočka.",
                "Ups, tohle se nepovedlo. Nevadí, trénuj na příště!",
                "Jsi ze hry. Nevadí, i plameňák má občas špatný den.",
                "Trénink dělá mistra. Tohle není ten případ."
            ],
            'trosku-loser': [
                "Už ti to jde! (Ale stejně po večerech trénuj)",
                "Zlepšuješ se! Pořád máš ale level ptáček v porcelánu ⭐",
                "Ptáček dolítal. Příště se snaž víc!",
                "Zas taková tragédie to nebyla. Fakt."
            ],
            'slusny': [
                "Tohle nebylo vůbec špatné!",
                "Máš to pod kontrolou! Občas. 🎮",
                "Už jsi skoro profík. Skoro!",
                "Máš talent! Snaž se a budeš gamer Vivantisu! ⚡"
            ],
            'dobry': [
                "Yes! Tohle se ti fakt povedlo!",
                "Trénuj a budeš neporazitelný/á! 👏",
                "Už jsi skoro gamer Vivantisu. Skoro! 🏆",
                "Boss level unlocked⭐"
            ],
            'vyborny': [
                "Legendární výkon! 🎉",
                "Skvělé! (Tady měl někdo čas trénovat) 👏",
                "Už jsi lepší než průměrný Flappy Bird! 🐦",
                "Ptáček dolítal. Ale dolítal šťastně! 🎉",
                "Pecka! Trénuj a dotáhneš do daleko👑"
            ],
            'mistr': [
                "Yes! Jsi gamer Vivantisu! 🏆",
                "Jsi oficiálně neporazitelný/ná 🎯",
                "Respekt! Max level unlocked⭐",
                "Master level unlocked 👑",
                "WOW! Zdravíme nového gamera Vivantisu👑",
                "Dosáhl/a jsi levelu mistr a můžeš trénovat ostatní ⚡"
            ],
            'absolut-legend': [
                "Jsi oficiálně prohlášen/a za boha Flappy Bird 👏👏🎉",
                "Nemáme slov! Tohle nebude tvoje první hra, že? 👑",
                "Neuvěřitelné! Jsi lepší než samotný Flappy Bird 😂",
                "Heroic výkon, ze kterého by spadla brada i Herculovi🐦🔥",
                "Získal/a jsi absolutní respekt Flappy Bird! 👑"
            ]
        };

        let category;
        if (score >= 0 && score <= 10) category = 'ultra-loser';
        else if (score >= 11 && score <= 25) category = 'trosku-loser';
        else if (score >= 26 && score <= 50) category = 'slusny';
        else if (score >= 51 && score <= 100) category = 'dobry';
        else if (score >= 101 && score <= 200) category = 'vyborny';
        else if (score >= 201 && score <= 299) category = 'mistr';
        else if (score >= 300) category = 'absolut-legend';
        else category = 'ultra-loser'; // Fallback pro skóre 0

        const categoryMessages = messages[category];
        const randomIndex = Math.floor(Math.random() * categoryMessages.length);
        return categoryMessages[randomIndex];
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
        
        // Pokud čekáme na první klik, zobraz nápovědu
        if (this.waitingForFirstClick) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Klikni pro start', this.canvas.width / 2, this.canvas.height / 2);
        }

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
        // Pokud hra neběží a nečekáme na první klik, zastav loop
        if (!this.gameRunning && !this.waitingForFirstClick) return;
        
        // Pokud hra běží, aktualizuj pozice
        if (this.gameRunning) {
            await this.updateBird();
            await this.updatePipes();
        }
        // Pokud čekáme na první klik, jen kreslíme statický obraz

        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
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

    playCrashSound() {
        const crashSound = document.getElementById('crash-sound');
        if (crashSound) {
            crashSound.currentTime = 0; // Reset na začátek
            crashSound.play().catch(e => {
                console.log('Crash zvuk se nepřehrál:', e);
            });
        }
    }

    playPopSound() {
        const popSound = document.getElementById('pop-sound');
        if (popSound) {
            popSound.currentTime = 0; // Reset na začátek
            popSound.play().catch(e => {
                console.log('Pop zvuk se nepřehrál:', e);
            });
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