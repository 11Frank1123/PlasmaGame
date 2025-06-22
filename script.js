// =================================
// DOM ELEMENTS
// =================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('mainMenu');
const shopMenu = document.getElementById('shopMenu');
const missionsMenu = document.getElementById('missionsMenu'); // <-- Added
const startButton = document.getElementById('startButton');
const shopButton = document.getElementById('shopButton');
const missionsButton = document.getElementById('missionsButton'); // <-- Added
const backToMenuButton = document.getElementById('backToMenuButton');
const backToMenuFromMissionsButton = document.getElementById('backToMenuFromMissionsButton'); // <-- Added
const skinShopSelector = document.getElementById('skinShopSelector');
const musicToggleButton = document.getElementById('musicToggleButton');
const bgMusic = document.getElementById('bgMusic');
const totalPointsDisplay = document.getElementById('totalPointsDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay'); // <-- Added

// =================================
// GAME RESOURCES AND DATA
// =================================

// -- Images --
const playerImg = new Image();
const obstacleImg = new Image();
obstacleImg.src = 'obstacle.png';
const coinImg = new Image();
coinImg.src = 'coin.png';
const magnetImg = new Image(); 
magnetImg.src = 'magnet.png'; 
const shieldPowerupImg = new Image(); 
shieldPowerupImg.src = 'shield_powerup.png'; 
const scoreDoublerImg = new Image(); 
scoreDoublerImg.src = 'score_doubler.png'; 
const shieldEffectImg = new Image(); 
shieldEffectImg.src = 'shield_effect.png'; 

// -- Audio --
const jumpSound = new Audio('jump.mp3');
const deathSound = new Audio('death.mp3');
const coinSound = new Audio('coin.mp3');
const purchaseSound = new Audio('purchase.mp3'); // <-- Added
const newRecordSound = new Audio('new_record.mp3'); // <-- Added
const startSound = new Audio('start.mp3'); // <-- Added
const claimSound = new Audio('claim.mp3'); // <-- Added
let musicEnabled;

// -- Skins & Economy --
const skins = [
    { id: 'player1', src: 'player1.png', price: 0, magnetSrc: 'player1_magnet.png' },
    { id: 'player2', src: 'player2.png', price: 1000, magnetSrc: 'player2_magnet.png' },
    { id: 'player3', src: 'player3.png', price: 2000, magnetSrc: 'player3_magnet.png' }
];
let totalPoints = 0;
let unlockedSkins = ['player1'];
let selectedSkinId = 'player1';
let highScore = 0; // <-- Added

// -- Game State Variables --
let score, gameOver, gameFrame, newHighScoreReached; // <-- Changed
let gameSpeed, gravity, jumpStrength;
const initialGameSpeed = 3.5; // Slightly increased for a longer jump
const gameSpeedIncrease = 0.0005;

// -- Power-ups --
let powerups = []; // <-- Added
let shieldActive = false; // <-- Added
let magnetActive = false; // <-- Added
let scoreDoublerActive = false; // <-- Added
let powerupTimers = { // <-- Added
    shield: 0,
    magnet: 0,
    scoreDoubler: 0
};
let upgrades = { // <-- Added
    doubleJump: { purchased: false, cost: 2000 }, // <-- Added
    shieldDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 },
    magnetDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 },
    scoreDoublerDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 }
};

// -- New variables for random spawning --
let nextObstacleFrame;
let nextCoinFrame;
let nextPowerupFrame; // <-- Added

// -- Player --
const player = {
    x: 75,
    y: canvas.height - 115,
    width: 115,
    height: 115,
    velocityY: 0,
    isJumping: false,
    jumpsLeft: 1
};

// -- Object Arrays --
let obstacles = [];
let coins = [];
let coinParticles = []; // <-- Added: array for coin particles
let scoreDoublerParticles = []; // <-- Added

// -- Missions --
let missions = {
    runDistance: {
        description: 'Run %goal% meters',
        progress: 0,
        currentLevel: 0,
        levels: [
            { goal: 5000, reward: 250 },
            { goal: 10000, reward: 500 },
            { goal: 25000, reward: 1000 },
            { goal: 50000, reward: 2000 },
            { goal: 75000, reward: 3500 },
            { goal: 100000, reward: 5000 }
        ]
    },
    collectCoins: {
        description: 'Collect %goal% coins',
        progress: 0,
        currentLevel: 0,
        levels: [
            { goal: 250, reward: 250 },
            { goal: 750, reward: 500 },
            { goal: 1500, reward: 1000 },
            { goal: 3000, reward: 2000 },
            { goal: 5000, reward: 3500 },
            { goal: 10000, reward: 5000 }
        ]
    },
    jumpObstacles: {
        description: 'Jump over %goal% obstacles',
        progress: 0,
        currentLevel: 0,
        levels: [
            { goal: 50, reward: 250 },
            { goal: 150, reward: 500 },
            { goal: 400, reward: 1000 },
            { goal: 1000, reward: 2000 },
            { goal: 2000, reward: 3500 },
            { goal: 5000, reward: 5000 }
        ]
    }
};

// =================================
// SCREEN AND MUSIC MANAGEMENT
// =================================

function showScreen(screen) {
    mainMenu.classList.add('hidden');
    shopMenu.classList.add('hidden');
    missionsMenu.classList.add('hidden'); // <-- Added
    canvas.classList.add('hidden');
    document.body.className = '';

    if (screen === 'main') {
        mainMenu.classList.remove('hidden');
        highScoreDisplay.textContent = highScore; // <-- Added
        document.body.classList.add('menu-bg');
    } else if (screen === 'shop') {
        populateShop();
        populateUpgrades(); 
        shopMenu.classList.remove('hidden');
        document.body.classList.add('shop-bg');
    } else if (screen === 'missions') { // <-- Added
        populateMissions();
        missionsMenu.classList.remove('hidden');
        document.body.classList.add('menu-bg'); // Can be a different background
    } else if (screen === 'game') {
        canvas.classList.remove('hidden');
        document.body.classList.add('game-page-bg'); // Apply background for the page
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        bgMusic.play();
        musicToggleButton.textContent = '🎵';
    } else {
        bgMusic.pause();
        musicToggleButton.textContent = '🔇';
    }
    localStorage.setItem('plasmaRunnerMusicEnabled', musicEnabled);
}

function playSound(sound) {
    if (musicEnabled) {
        sound.currentTime = 0;
        sound.play().catch(e => {});
    }
}

// =================================
// PROGRESS SAVING (points and skins)
// =================================

function loadProgress() {
    totalPoints = parseInt(localStorage.getItem('plasmaRunnerTotalPoints') || '0', 10);
    unlockedSkins = JSON.parse(localStorage.getItem('plasmaRunnerUnlockedSkins') || '["player1"]');
    selectedSkinId = localStorage.getItem('plasmaRunnerSelectedSkin') || 'player1';
    highScore = parseInt(localStorage.getItem('plasmaRunnerHighScore') || '0', 10); // <-- Added
    
    const savedMissions = JSON.parse(localStorage.getItem('plasmaRunnerMissions'));
    if (savedMissions) {
        for (const key in savedMissions) {
            if (missions[key]) {
                missions[key].progress = savedMissions[key].progress || 0;
                missions[key].currentLevel = savedMissions[key].currentLevel || 0;
            }
        }
    }
    const savedUpgrades = JSON.parse(localStorage.getItem('plasmaRunnerUpgrades'));
    if (savedUpgrades) {
        for(const key in savedUpgrades) {
            if (upgrades[key]) {
                upgrades[key] = { ...upgrades[key], ...savedUpgrades[key] };
            }
        }
    }

    const musicEnabledSaved = localStorage.getItem('plasmaRunnerMusicEnabled');
    musicEnabled = musicEnabledSaved === null ? true : JSON.parse(musicEnabledSaved);
    musicToggleButton.textContent = musicEnabled ? '🎵' : '🔇';

    if (!unlockedSkins.includes(selectedSkinId)) {
        selectedSkinId = 'player1';
    }
    playerImg.src = skins.find(s => s.id === selectedSkinId).src;
}

function saveProgress() {
    localStorage.setItem('plasmaRunnerTotalPoints', totalPoints);
    localStorage.setItem('plasmaRunnerUnlockedSkins', JSON.stringify(unlockedSkins));
    localStorage.setItem('plasmaRunnerSelectedSkin', selectedSkinId);
    localStorage.setItem('plasmaRunnerHighScore', highScore); // <-- Added
    localStorage.setItem('plasmaRunnerMissions', JSON.stringify(missions)); // <-- Added
    localStorage.setItem('plasmaRunnerUpgrades', JSON.stringify(upgrades)); // <-- Added
}

// =================================
// SHOP LOGIC
// =================================

function populateShop() {
    skinShopSelector.innerHTML = '';
    totalPointsDisplay.textContent = totalPoints;

    skins.forEach(skin => {
        const skinElement = document.createElement('div');
        skinElement.className = 'skin-shop-option';
        skinElement.dataset.skinId = skin.id;

        // Add rarity classes
        if (skin.price === 0) {
            skinElement.classList.add('rarity-common');
        } else if (skin.price === 1000) {
            skinElement.classList.add('rarity-rare');
        } else if (skin.price === 2000) {
            skinElement.classList.add('rarity-legendary');
        }

        if (skin.id === selectedSkinId) skinElement.classList.add('selected');

        const img = document.createElement('img');
        img.src = skin.src;
        skinElement.appendChild(img);

        if (!unlockedSkins.includes(skin.id)) {
            const priceTag = document.createElement('div');
            priceTag.className = 'price';
            priceTag.textContent = `${skin.price} ✨`; // ✨ instead of a coin
            skinElement.appendChild(priceTag);
        }
        skinShopSelector.appendChild(skinElement);
    });
}

function populateUpgrades() { // <-- Added
    const upgradesContent = document.getElementById('upgradesContent');
    upgradesContent.innerHTML = '';

    // Display Double Jump upgrade
    const djUpgrade = upgrades.doubleJump;
    if (!djUpgrade.purchased) {
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        const info = document.createElement('div');
        info.innerHTML = `<p>Double Jump</p><p>Allows jumping a second time in mid-air.</p>`;
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = `Buy (${djUpgrade.cost} ✨)`;
        button.dataset.key = 'doubleJump';
        if (totalPoints < djUpgrade.cost) {
            button.disabled = true;
        }
        item.appendChild(info);
        item.appendChild(button);
        upgradesContent.appendChild(item);
    }

    for (const key in upgrades) {
        if (key === 'doubleJump') continue; 

        const upgrade = upgrades[key];
        const item = document.createElement('div');
        item.className = 'upgrade-item';

        const info = document.createElement('div');
        const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        const currentDuration = (upgrade.baseValue + (upgrade.level - 1) * upgrade.increment) / 1000;
        const nextIncrement = upgrade.increment / 1000;
        
        let colorClass = '';
        if (key === 'shieldDuration') colorClass = 'shield-color';
        else if (key === 'magnetDuration') colorClass = 'magnet-color';
        else if (key === 'scoreDoublerDuration') colorClass = 'score-doubler-color';

        info.innerHTML = `<p class="upgrade-name ${colorClass}">${name} (Level ${upgrade.level})</p><p>Duration: ${currentDuration.toFixed(1)}s</p><p class="upgrade-increment">+${nextIncrement.toFixed(1)}s</p>`;
        
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = `Upgrade (${upgrade.cost} ✨)`;
        button.dataset.key = key;
        if (totalPoints < upgrade.cost) {
            button.disabled = true;
        }

        item.appendChild(info);
        item.appendChild(button);
        upgradesContent.appendChild(item);
    }
}

function handleSkinSelection(e) {
    const target = e.target.closest('.skin-shop-option');
    if (!target) return;

    const skinId = target.dataset.skinId;
    const skinData = skins.find(s => s.id === skinId);

    if (unlockedSkins.includes(skinId)) {
        // If the skin is already purchased, just select it
        selectedSkinId = skinId;
        playerImg.src = skinData.src;
        saveProgress();
        populateShop();
    } else if (totalPoints >= skinData.price) {
        // If the skin is not purchased and there are enough points, buy it
        totalPoints -= skinData.price;
        unlockedSkins.push(skinId);
        selectedSkinId = skinId;
        playerImg.src = skinData.src;
        saveProgress();
        populateShop();
        playSound(purchaseSound); // <-- Added
        alert(`Skin "${skinId}" unlocked!`);
    } else {
        // If not enough points
        alert('Not enough points!');
    }
}

function handleUpgradePurchase(e) { // <-- Added
    if (!e.target.matches('.upgrade-button')) return;

    const key = e.target.dataset.key;
    const upgrade = upgrades[key];

    if (key === 'doubleJump') {
        if (totalPoints >= upgrade.cost && !upgrade.purchased) {
            totalPoints -= upgrade.cost;
            upgrade.purchased = true;
            playSound(purchaseSound);
            saveProgress();
            populateUpgrades();
            totalPointsDisplay.textContent = totalPoints;
        }
        return;
    }

    if (totalPoints >= upgrade.cost) {
        totalPoints -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase the cost
        playSound(purchaseSound);
        
        saveProgress();
        populateUpgrades();
        totalPointsDisplay.textContent = totalPoints;
    }
}


// =================================
// MISSION LOGIC
// =================================

function populateMissions() {
    const container = document.getElementById('missionsContainer');
    container.innerHTML = '';

    for (const key in missions) {
        const mission = missions[key];
        
        if (mission.currentLevel >= mission.levels.length) {
            const item = document.createElement('div');
            item.className = 'mission-item';
            const missionName = mission.description.replace(' %goal%', '');
            item.innerHTML = `<p>${missionName} - All levels completed!</p>`;
            container.appendChild(item);
            continue;
        }
        
        const level = mission.levels[mission.currentLevel];
        const item = document.createElement('div');
        item.className = 'mission-item';

        const info = document.createElement('div');
        const description = mission.description.replace('%goal%', level.goal);
        const progressText = `(${Math.floor(mission.progress)}/${level.goal})`;
        info.innerHTML = `<p>${description} ${progressText}</p>`;
        
        const progress = document.createElement('div');
        progress.className = 'mission-item-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'mission-item-progress';
        progressFill.style.width = `${Math.min(100, (mission.progress / level.goal) * 100)}%`;
        progress.appendChild(progressFill);
        info.appendChild(progress);

        if (mission.progress >= level.goal) {
            progress.classList.add('completed');
        }

        const button = document.createElement('button');
        button.className = 'claim-button';
        button.textContent = `Claim (${level.reward} ✨)`;
        button.dataset.key = key;

        if (mission.progress < level.goal) {
            button.disabled = true;
        }

        item.appendChild(info);
        item.appendChild(button);
        container.appendChild(item);
    }
}

function handleMissionClaim(e) {
    if (!e.target.matches('.claim-button')) return;

    const key = e.target.dataset.key;
    const mission = missions[key];
    
    if (mission.currentLevel >= mission.levels.length) return;

    const level = mission.levels[mission.currentLevel];

    if (mission.progress >= level.goal) {
        totalPoints += level.reward;
        mission.currentLevel++;
        playSound(claimSound); // Play sound on reward claim
        saveProgress();
        populateMissions();
    }
}

// =================================
// GAME DRAWING FUNCTIONS
// =================================

// <-- Added: function to create particles
function createCoinParticles(x, y) {
    const particleCount = 5 + Math.floor(Math.random() * 3); // 5-7 particles
    for (let i = 0; i < particleCount; i++) {
        coinParticles.push({
            x: x,
            y: y,
            size: Math.random() * 9 + 6,   // Particle size from 6 to 15
            vx: (Math.random() - 0.5) * 7,   // Horizontal velocity
            vy: Math.random() * -10 - 3,   // Vertical velocity (upwards)
            life: 40 + Math.random() * 40, // Lifetime (0.6 - 1.3 seconds)
        });
    }
}

// <-- Added: function to update and draw particles
function drawAndUpdateParticles() {
    for (let i = coinParticles.length - 1; i >= 0; i--) {
        const p = coinParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity * 0.5; // Particles are lighter, gravity is weaker
        p.life--;

        if (p.life <= 0) {
            coinParticles.splice(i, 1);
        } else {
            ctx.save();
            // Fade out effect, adjusted for new lifetime
            ctx.globalAlpha = Math.max(0, p.life / 80); 
            ctx.drawImage(coinImg, p.x, p.y, p.size, p.size);
            ctx.restore();
        }
    }
}

// <-- Added: functions for score doubler particles
function createScoreDoublerParticles(x, y) {
    const particleCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < particleCount; i++) {
        scoreDoublerParticles.push({
            x: x,
            y: y,
            size: Math.random() * 9 + 6,
            vx: (Math.random() - 0.5) * 7,
            vy: Math.random() * -10 - 3,
            life: 40 + Math.random() * 40,
        });
    }
}

function drawAndUpdateScoreDoublerParticles() {
    for (let i = scoreDoublerParticles.length - 1; i >= 0; i--) {
        const p = scoreDoublerParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity * 0.5;
        p.life--;

        if (p.life <= 0) {
            scoreDoublerParticles.splice(i, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 80);
            ctx.drawImage(scoreDoublerImg, p.x, p.y, p.size, p.size);
            ctx.restore();
        }
    }
}

function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    if (shieldActive) { // <-- Added
        ctx.drawImage(shieldEffectImg, player.x - 15, player.y - 15, player.width + 30, player.height + 30);
    }
}

function drawAndUpdateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        ctx.drawImage(obs.img, obs.x, obs.y, obs.width, obs.height);
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            const mission = missions.jumpObstacles;
            if (mission.currentLevel < mission.levels.length && !gameOver) {
                mission.progress++;
            }
        }
    }
}

function drawAndUpdateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        if (magnetActive) {
            const dx = (player.x + player.width / 2) - (coin.x + coin.width / 2);
            const dy = (player.y + player.height / 2) - (coin.y + coin.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 200) { // 200 is the magnet radius
                const magnetSpeed = 5; // Coin attraction speed
                coin.x += (dx / distance) * magnetSpeed;
                coin.y += (dy / distance) * magnetSpeed;
            } else {
                coin.x -= gameSpeed;
            }
        } else {
            coin.x -= gameSpeed;
        }

        ctx.drawImage(coinImg, coin.x, coin.y, coin.width, coin.height);
        if (coin.x + coin.width < 0) coins.splice(i, 1);
    }
}

function drawAndUpdatePowerups() { // <-- Added
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.x -= gameSpeed;
        ctx.drawImage(p.img, p.x, p.y, p.width, p.height);
        if (p.x + p.width < 0) powerups.splice(i, 1);
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = '30px "Segoe UI", Arial';
    ctx.textAlign = 'left';
    const scoreText = `Score: ${Math.floor(score)}`; // Round the score
    ctx.strokeText(scoreText, 15, 40);
    ctx.fillText(scoreText, 15, 40);
}

function drawPowerupTimers() { // <-- Added
    ctx.fillStyle = 'white';
    ctx.font = '18px "Segoe UI", Arial';
    ctx.textAlign = 'right';
    let yOffset = 40;
    if (shieldActive) {
        ctx.fillText(`Shield: ${(powerupTimers.shield / 1000).toFixed(1)}s`, canvas.width - 15, yOffset);
        yOffset += 25;
    }
    if (magnetActive) {
        ctx.fillText(`Magnet: ${(powerupTimers.magnet / 1000).toFixed(1)}s`, canvas.width - 15, yOffset);
        yOffset += 25;
    }
    if (scoreDoublerActive) {
        ctx.fillText(`2x Score: ${(powerupTimers.scoreDoubler / 1000).toFixed(1)}s`, canvas.width - 15, yOffset);
    }
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = '24px "Segoe UI", Arial';
    ctx.fillText(`Your Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 30);
    
    if (newHighScoreReached) {
        ctx.fillStyle = 'gold';
        ctx.fillText('New High Score!', canvas.width / 2, canvas.height / 2 + 70);
    }

    ctx.fillStyle = 'white';
    ctx.font = '20px "Segoe UI", Arial';
    ctx.fillText("Press 'Enter' to return to the Menu", canvas.width / 2, canvas.height / 2 + 120);
}

// =================================
// GAME LOGIC
// =================================

function updatePlayer() {
    if (player.isJumping) {
        player.velocityY += gravity;
        player.y += player.velocityY;
    }
    if (player.y >= canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        if (player.isJumping) { // Restore jumps only on landing
             player.jumpsLeft = upgrades.doubleJump.purchased ? 2 : 1; // <-- Changed
             player.isJumping = false;
        }
    }
}

function updatePowerupTimers(deltaTime) { // <-- Added
    if (shieldActive) {
        powerupTimers.shield -= deltaTime;
        if (powerupTimers.shield <= 0) shieldActive = false;
    }
    if (magnetActive) {
        powerupTimers.magnet -= deltaTime;
        if (powerupTimers.magnet <= 0) {
            magnetActive = false;
            // Revert to normal skin
            const currentSkin = skins.find(s => s.id === selectedSkinId);
            playerImg.src = currentSkin.src;
        }
    }
    if (scoreDoublerActive) {
        powerupTimers.scoreDoubler -= deltaTime;
        if (powerupTimers.scoreDoubler <= 0) scoreDoublerActive = false;
    }
}

function generateObstacles() {
    // Spawn an obstacle if it's time
    if (gameFrame >= nextObstacleFrame) {
        const obstacleTypes = [ // <-- Added
            { img: obstacleImg, width: 65, height: 75, y: canvas.height - 75 }, // Short
            { img: obstacleImg, width: 75, height: 130, y: canvas.height - 130 }, // Tall
            { img: obstacleImg, width: 80, height: 50, y: canvas.height - 180 } // Flying
        ];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        obstacles.push({
            x: canvas.width,
            y: type.y,
            width: type.width,
            height: type.height,
            img: type.img
        });

        // Increase the gap between obstacles
        const minGap = 150; // Was 80
        const maxGap = 250; // Was 150
        nextObstacleFrame = gameFrame + minGap + Math.random() * (maxGap - minGap);
    }
}

function generateCoins() {
    // Spawn a coin if it's time
    if (gameFrame >= nextCoinFrame) {
        const coinSize = 60; // Increased size
        
        // Array of possible coin heights (from the ground), adapted for new height
        const coinHeights = [120, 210, 270]; 
        const randomHeight = coinHeights[Math.floor(Math.random() * coinHeights.length)];

        coins.push({
            x: canvas.width,
            y: canvas.height - randomHeight,
            width: coinSize,
            height: coinSize
        });
        
        // Set a random time for the next coin
        const minGap = 100;
        const maxGap = 200;
        nextCoinFrame = gameFrame + minGap + Math.random() * (maxGap - minGap);
    }
}

function generatePowerups() { // <-- Added
    if (gameFrame >= nextPowerupFrame) {
        const powerupTypes = [
            { type: 'shield', img: shieldPowerupImg },
            { type: 'magnet', img: magnetImg },
            { type: 'scoreDoubler', img: scoreDoublerImg }
        ];
        const typeData = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        powerups.push({
            x: canvas.width,
            y: canvas.height - 150, // Appear at the same height
            width: 50,
            height: 50,
            img: typeData.img,
            type: typeData.type
        });

        nextPowerupFrame = gameFrame + 500 + Math.random() * 500; // Appear less frequently
    }
}

function checkCollisions() {
    // Collision with obstacles
    for (const obs of obstacles) {
        // Simple but effective collision check
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            if (shieldActive) { // <-- Added
                shieldActive = false; // Shield breaks
                obstacles.splice(obstacles.indexOf(obs), 1); // Destroy the obstacle
            } else {
                endGame();
            }
        }
    }
    // Collision with coins
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y
        ) {
            createCoinParticles(coin.x + coin.width / 2, coin.y + coin.height / 2); // <-- Added
            coins.splice(i, 1);
            score += 5;
            const mission = missions.collectCoins;
            if (mission.currentLevel < mission.levels.length) {
                mission.progress++;
            }
            playSound(coinSound);
        }
    }
    // Collision with power-ups
    for (let i = powerups.length - 1; i >= 0; i--) { // <-- Added
        const p = powerups[i];
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y
        ) {
            activatePowerup(p.type, p.x + p.width / 2, p.y + p.height / 2);
            powerups.splice(i, 1);
        }
    }
}

function activatePowerup(type, x, y) { // <-- Added x, y
    if (type === 'shield') {
        shieldActive = true;
        powerupTimers.shield = upgrades.shieldDuration.baseValue + (upgrades.shieldDuration.level - 1) * upgrades.shieldDuration.increment;
    } else if (type === 'magnet') {
        magnetActive = true;
        powerupTimers.magnet = upgrades.magnetDuration.baseValue + (upgrades.magnetDuration.level - 1) * upgrades.magnetDuration.increment;
        // Change skin to magnet skin
        const currentSkin = skins.find(s => s.id === selectedSkinId);
        playerImg.src = currentSkin.magnetSrc;
    } else if (type === 'scoreDoubler') {
        createScoreDoublerParticles(x, y); // <-- Added
        scoreDoublerActive = true;
        powerupTimers.scoreDoubler = upgrades.scoreDoublerDuration.baseValue + (upgrades.scoreDoublerDuration.level - 1) * upgrades.scoreDoublerDuration.increment;
    }
}

// =================================
// MAIN GAME FUNCTIONS
// =================================

function init() {
    loadProgress();
    showScreen('main');

    // Assign event handlers
    startButton.addEventListener('click', startGame);
    shopButton.addEventListener('click', () => showScreen('shop'));
    missionsButton.addEventListener('click', () => showScreen('missions')); // <-- Added
    backToMenuButton.addEventListener('click', () => showScreen('main'));
    backToMenuFromMissionsButton.addEventListener('click', () => showScreen('main')); // <-- Added
    skinShopSelector.addEventListener('click', handleSkinSelection);
    musicToggleButton.addEventListener('click', toggleMusic);

    document.getElementById('shopTabs').addEventListener('click', (e) => { 
        if (e.target.matches('.tab-button')) {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tab}Content`).classList.add('active');
        }
    });

    // Handler for upgrades
    document.getElementById('upgradesContent').addEventListener('click', handleUpgradePurchase); // <-- Added
    // Handler for missions
    document.getElementById('missionsMenu').addEventListener('click', handleMissionClaim); // <-- Added

    const unlockAndPlayMusic = () => {
        if (musicEnabled && bgMusic.paused) {
            bgMusic.play().then(() => {
                document.removeEventListener('click', unlockAndPlayMusic);
                document.removeEventListener('keydown', unlockAndPlayMusic);
            }).catch(() => {});
        } else if (!bgMusic.paused) {
            document.removeEventListener('click', unlockAndPlayMusic);
            document.removeEventListener('keydown', unlockAndPlayMusic);
        }
    };
    document.addEventListener('click', unlockAndPlayMusic);
    document.addEventListener('keydown', unlockAndPlayMusic);

    document.addEventListener('keydown', function(event) {
        if (gameOver) {
            if (event.code === 'Enter') showScreen('main');
            return;
        }
        if (player.jumpsLeft > 0 && (event.code === 'Space' || event.code === 'ArrowUp')) {
            player.velocityY = jumpStrength;
            player.isJumping = true;
            player.jumpsLeft--;
            playSound(jumpSound);
        }
    });

    if (musicEnabled) bgMusic.play().catch(e => console.log("Autoplay prevented. Waiting for user interaction."));
}

function startGame() {
    // Reset and initialize game variables
    score = 0;
    gameOver = false;
    gameFrame = 0;
    newHighScoreReached = false; // <-- Added
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpsLeft = upgrades.doubleJump.purchased ? 2 : 1; // <-- Changed
    obstacles = [];
    coins = [];
    powerups = []; // <-- Added
    coinParticles = [];
    scoreDoublerParticles = [];
    gameSpeed = initialGameSpeed;
    gravity = 0.55; // Further reduced gravity for a longer jump
    jumpStrength = -21; // Increased jump strength

    // Reset active power-ups
    shieldActive = false;
    magnetActive = false;
    scoreDoublerActive = false;

    // Set initial spawn times
    nextObstacleFrame = 100;
    nextCoinFrame = 150;
    nextPowerupFrame = 300; // <-- Added
    
    showScreen('game');
    
    if (musicEnabled) {
        bgMusic.pause();
        startSound.onended = () => {
            if (musicEnabled) {
                bgMusic.play();
            }
            startSound.onended = null; // Clear the handler so it doesn't run again
        };
    }
    playSound(startSound);

    lastTime = performance.now(); 
    gameLoop();
}

function endGame() {
    if (gameOver) return;
    gameOver = true;
    
    const finalScore = Math.floor(score);
    totalPoints += finalScore; 

    if (finalScore > highScore) {
        highScore = finalScore;
        newHighScoreReached = true;
        playSound(newRecordSound);
    } else {
        playSound(deathSound);
    }

    // Revert to normal skin if game ends with magnet active
    if (magnetActive) {
        magnetActive = false;
        const currentSkin = skins.find(s => s.id === selectedSkinId);
        playerImg.src = currentSkin.src;
    }

    saveProgress();
}

let lastTime = 0; // <-- Added
function gameLoop(timestamp) { // <-- Changed
    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    gameFrame++;
    gameSpeed += gameSpeedIncrease;
    
    const scoreMultiplier = scoreDoublerActive ? 2 : 1;
    score += (1 / 60) * scoreMultiplier; 

    const mission = missions.runDistance;
    if (mission.currentLevel < mission.levels.length) {
        mission.progress += gameSpeed / 10;
    }
    
    // Update game state
    updatePlayer();
    updatePowerupTimers(deltaTime);
    generateObstacles();
    generateCoins();
    generatePowerups();
    checkCollisions();

    // Clear and redraw canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gray background on canvas
    ctx.fillStyle = '#cccccc'; // Gray color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawPlayer();
    drawAndUpdateObstacles();
    drawAndUpdateCoins();
    drawAndUpdatePowerups();
    drawAndUpdateParticles();
    drawAndUpdateScoreDoublerParticles();
    drawScore();
    drawPowerupTimers();

    requestAnimationFrame(gameLoop);
}

// -- START GAME --
init(); 