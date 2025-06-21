// =================================
// DOM ЭЛЕМЕНТЫ
// =================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('mainMenu');
const shopMenu = document.getElementById('shopMenu');
const missionsMenu = document.getElementById('missionsMenu'); // <-- Добавлено
const startButton = document.getElementById('startButton');
const shopButton = document.getElementById('shopButton');
const missionsButton = document.getElementById('missionsButton'); // <-- Добавлено
const backToMenuButton = document.getElementById('backToMenuButton');
const backToMenuFromMissionsButton = document.getElementById('backToMenuFromMissionsButton'); // <-- Добавлено
const skinShopSelector = document.getElementById('skinShopSelector');
const musicToggleButton = document.getElementById('musicToggleButton');
const bgMusic = document.getElementById('bgMusic');
const totalPointsDisplay = document.getElementById('totalPointsDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay'); // <-- Добавлено

// =================================
// ИГРОВЫЕ РЕСУРСЫ И ДАННЫЕ
// =================================

// -- Изображения --
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

// -- Аудио --
const jumpSound = new Audio('jump.mp3');
const deathSound = new Audio('death.mp3');
const coinSound = new Audio('coin.mp3');
const purchaseSound = new Audio('purchase.mp3'); // <-- Добавлено
const newRecordSound = new Audio('new_record.mp3'); // <-- Добавлено
const startSound = new Audio('start.mp3'); // <-- Добавлено
let musicEnabled;

// -- Скины и Экономика --
const skins = [
    { id: 'player1', src: 'player1.png', price: 0 },
    { id: 'player2', src: 'player2.png', price: 1000 },
    { id: 'player3', src: 'player3.png', price: 2000 }
];
let totalPoints = 0;
let unlockedSkins = ['player1'];
let selectedSkinId = 'player1';
let highScore = 0; // <-- Добавлено

// -- Переменные состояния игры --
let score, gameOver, gameFrame, newHighScoreReached; // <-- Изменено
let gameSpeed, gravity, jumpStrength;
const initialGameSpeed = 3.5; // Немного увеличиваем, чтобы прыжок был дальше
const gameSpeedIncrease = 0.0005;

// -- Пауэр-апы --
let powerups = []; // <-- Добавлено
let shieldActive = false; // <-- Добавлено
let magnetActive = false; // <-- Добавлено
let scoreDoublerActive = false; // <-- Добавлено
let powerupTimers = { // <-- Добавлено
    shield: 0,
    magnet: 0,
    scoreDoubler: 0
};
let upgrades = { // <-- Добавлено
    doubleJump: { purchased: false, cost: 2000 }, // <-- Добавлено
    shieldDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 },
    magnetDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 },
    scoreDoublerDuration: { level: 1, baseValue: 5000, increment: 1000, cost: 300 }
};

// -- Новые переменные для случайного спавна --
let nextObstacleFrame;
let nextCoinFrame;
let nextPowerupFrame; // <-- Добавлено

// -- Игрок --
const player = {
    x: 75,
    y: canvas.height - 115,
    width: 115,
    height: 115,
    velocityY: 0,
    isJumping: false,
    jumpsLeft: 1 // <-- Изменено на 1
};

// -- Массивы объектов --
let obstacles = [];
let coins = [];

// -- Задания (Missions) --
let missions = { // <-- Добавлено
    runDistance: { id: 'runDistance', description: 'Run 5000 meters', progress: 0, goal: 5000, reward: 250, claimed: false },
    collectCoins: { id: 'collectCoins', description: 'Collect 250 coins', progress: 0, goal: 250, reward: 250, claimed: false },
    jumpObstacles: { id: 'jumpObstacles', description: 'Jump over 50 obstacles', progress: 0, goal: 50, reward: 250, claimed: false }
};

// =================================
// УПРАВЛЕНИЕ ЭКРАНАМИ И МУЗЫКОЙ
// =================================

function showScreen(screen) {
    mainMenu.classList.add('hidden');
    shopMenu.classList.add('hidden');
    missionsMenu.classList.add('hidden'); // <-- Добавлено
    canvas.classList.add('hidden');
    document.body.className = '';

    if (screen === 'main') {
        mainMenu.classList.remove('hidden');
        highScoreDisplay.textContent = highScore; // <-- Добавлено
        document.body.classList.add('menu-bg');
    } else if (screen === 'shop') {
        populateShop();
        populateUpgrades(); 
        shopMenu.classList.remove('hidden');
        document.body.classList.add('shop-bg');
    } else if (screen === 'missions') { // <-- Добавлено
        populateMissions();
        missionsMenu.classList.remove('hidden');
        document.body.classList.add('menu-bg'); // Можно другой фон
    } else if (screen === 'game') {
        canvas.classList.remove('hidden');
        document.body.classList.add('game-page-bg'); // Применяем фон для страницы
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
// СОХРАНЕНИЕ ПРОГРЕССА (очки и скины)
// =================================

function loadProgress() {
    totalPoints = parseInt(localStorage.getItem('plasmaRunnerTotalPoints') || '0', 10);
    unlockedSkins = JSON.parse(localStorage.getItem('plasmaRunnerUnlockedSkins') || '["player1"]');
    selectedSkinId = localStorage.getItem('plasmaRunnerSelectedSkin') || 'player1';
    highScore = parseInt(localStorage.getItem('plasmaRunnerHighScore') || '0', 10); // <-- Добавлено
    
    const savedMissions = JSON.parse(localStorage.getItem('plasmaRunnerMissions'));
    if (savedMissions) missions = savedMissions;
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
    localStorage.setItem('plasmaRunnerHighScore', highScore); // <-- Добавлено
    localStorage.setItem('plasmaRunnerMissions', JSON.stringify(missions)); // <-- Добавлено
    localStorage.setItem('plasmaRunnerUpgrades', JSON.stringify(upgrades)); // <-- Добавлено
}

// =================================
// ЛОГИКА МАГАЗИНА
// =================================

function populateShop() {
    skinShopSelector.innerHTML = '';
    totalPointsDisplay.textContent = totalPoints;

    skins.forEach(skin => {
        const skinElement = document.createElement('div');
        skinElement.className = 'skin-shop-option';
        skinElement.dataset.skinId = skin.id;

        // Добавляем классы редкости
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
            priceTag.textContent = `${skin.price} ✨`; // ✨ вместо монетки
            skinElement.appendChild(priceTag);
        }
        skinShopSelector.appendChild(skinElement);
    });
}

function populateUpgrades() { // <-- Добавлено
    const upgradesContent = document.getElementById('upgradesContent');
    upgradesContent.innerHTML = '';

    // Отображение улучшения Double Jump
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
        info.innerHTML = `<p>${name}</p><p>Level: ${upgrade.level}</p>`;
        
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
        // Если скин уже куплен, просто выбираем его
        selectedSkinId = skinId;
        playerImg.src = skinData.src;
        saveProgress();
        populateShop();
    } else if (totalPoints >= skinData.price) {
        // Если скин не куплен и очков хватает, покупаем
        totalPoints -= skinData.price;
        unlockedSkins.push(skinId);
        selectedSkinId = skinId;
        playerImg.src = skinData.src;
        saveProgress();
        populateShop();
        playSound(purchaseSound); // <-- Добавлено
        alert(`Skin "${skinId}" unlocked!`);
    } else {
        // Если очков не хватает
        alert('Not enough points!');
    }
}

function handleUpgradePurchase(e) { // <-- Добавлено
    if (!e.target.matches('.upgrade-button')) return;

    const key = e.target.dataset.key;
    const upgrade = upgrades[key];

    if (key === 'doubleJump') {
        if (totalPoints >= upgrade.cost && !upgrade.purchased) {
            totalPoints -= upgrade.cost;
            upgrade.purchased = true;
            saveProgress();
            populateUpgrades();
            totalPointsDisplay.textContent = totalPoints;
        }
        return;
    }

    if (totalPoints >= upgrade.cost) {
        totalPoints -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5); // Увеличиваем стоимость
        
        saveProgress();
        populateUpgrades();
        totalPointsDisplay.textContent = totalPoints;
    }
}


// =================================
// ЛОГИКА МИССИЙ
// =================================

function populateMissions() { // <-- Добавлено
    const container = document.getElementById('missionsContainer');
    container.innerHTML = '';

    for (const key in missions) {
        const mission = missions[key];
        const item = document.createElement('div');
        item.className = 'mission-item';

        const info = document.createElement('div');
        info.innerHTML = `<p>${mission.description}</p>`;
        
        const progress = document.createElement('div');
        progress.className = 'mission-item-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'mission-item-progress';
        progressFill.style.width = `${Math.min(100, (mission.progress / mission.goal) * 100)}%`;
        progress.appendChild(progressFill);
        info.appendChild(progress);

        const button = document.createElement('button');
        button.className = 'claim-button';
        button.textContent = `Claim (${mission.reward} ✨)`;
        button.dataset.key = key;

        if (mission.progress < mission.goal || mission.claimed) {
            button.disabled = true;
        }
        if (mission.claimed) {
            button.textContent = 'Claimed';
        }

        item.appendChild(info);
        item.appendChild(button);
        container.appendChild(item);
    }
}

function handleMissionClaim(e) { // <-- Добавлено
    if (!e.target.matches('.claim-button')) return;

    const key = e.target.dataset.key;
    const mission = missions[key];

    if (mission.progress >= mission.goal && !mission.claimed) {
        totalPoints += mission.reward;
        mission.claimed = true;
        saveProgress();
        populateMissions();
        totalPointsDisplay.textContent = totalPoints;
    }
}

// =================================
// ФУНКЦИИ ОТРИСОВКИ ИГРЫ
// =================================

function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    if (shieldActive) { // <-- Добавлено
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
            if (!missions.jumpObstacles.claimed && !gameOver) { // <-- Добавлена проверка !gameOver
                missions.jumpObstacles.progress++;
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
            if (distance < 200) { // 200 - радиус магнита
                const magnetSpeed = 5; // Скорость притяжения монеты
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

function drawAndUpdatePowerups() { // <-- Добавлено
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
    const scoreText = `Score: ${Math.floor(score)}`; // Округляем счет
    ctx.strokeText(scoreText, 15, 40);
    ctx.fillText(scoreText, 15, 40);
}

function drawPowerupTimers() { // <-- Добавлено
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
// ЛОГИКА ИГРЫ
// =================================

function updatePlayer() {
    if (player.isJumping) {
        player.velocityY += gravity;
        player.y += player.velocityY;
    }
    if (player.y >= canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        if (player.isJumping) { // Восстанавливаем прыжки только при приземлении
             player.jumpsLeft = upgrades.doubleJump.purchased ? 2 : 1; // <-- Изменено
             player.isJumping = false;
        }
    }
}

function updatePowerupTimers(deltaTime) { // <-- Добавлено
    if (shieldActive) {
        powerupTimers.shield -= deltaTime;
        if (powerupTimers.shield <= 0) shieldActive = false;
    }
    if (magnetActive) {
        powerupTimers.magnet -= deltaTime;
        if (powerupTimers.magnet <= 0) magnetActive = false;
    }
    if (scoreDoublerActive) {
        powerupTimers.scoreDoubler -= deltaTime;
        if (powerupTimers.scoreDoubler <= 0) scoreDoublerActive = false;
    }
}

function generateObstacles() {
    // Спавним препятствие, если пришло время
    if (gameFrame >= nextObstacleFrame) {
        const obstacleTypes = [ // <-- Добавлено
            { img: obstacleImg, width: 65, height: 75, y: canvas.height - 75 }, // Короткое
            { img: obstacleImg, width: 75, height: 130, y: canvas.height - 130 }, // Высокое
            { img: obstacleImg, width: 80, height: 50, y: canvas.height - 180 } // Летающее
        ];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        obstacles.push({
            x: canvas.width,
            y: type.y,
            width: type.width,
            height: type.height,
            img: type.img
        });

        // Увеличиваем расстояние между препятствиями
        const minGap = 150; // Было 80
        const maxGap = 250; // Было 150
        nextObstacleFrame = gameFrame + minGap + Math.random() * (maxGap - minGap);
    }
}

function generateCoins() {
    // Спавним монету, если пришло время
    if (gameFrame >= nextCoinFrame) {
        const coinSize = 60; // Увеличенный размер
        
        // Массив возможных высот для монет (от земли), адаптированный под новую высоту
        const coinHeights = [120, 210, 270]; 
        const randomHeight = coinHeights[Math.floor(Math.random() * coinHeights.length)];

        coins.push({
            x: canvas.width,
            y: canvas.height - randomHeight,
            width: coinSize,
            height: coinSize
        });
        
        // Устанавливаем случайное время для следующей монеты
        const minGap = 100;
        const maxGap = 200;
        nextCoinFrame = gameFrame + minGap + Math.random() * (maxGap - minGap);
    }
}

function generatePowerups() { // <-- Добавлено
    if (gameFrame >= nextPowerupFrame) {
        const powerupTypes = [
            { type: 'shield', img: shieldPowerupImg },
            { type: 'magnet', img: magnetImg },
            { type: 'scoreDoubler', img: scoreDoublerImg }
        ];
        const typeData = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        powerups.push({
            x: canvas.width,
            y: canvas.height - 150, // Появляются на одной высоте
            width: 50,
            height: 50,
            img: typeData.img,
            type: typeData.type
        });

        nextPowerupFrame = gameFrame + 500 + Math.random() * 500; // Появляются реже
    }
}

function checkCollisions() {
    // Столкновение с препятствиями
    for (const obs of obstacles) {
        // Простая, но эффективная проверка столкновений
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            if (shieldActive) { // <-- Добавлено
                shieldActive = false; // Щит ломается
                obstacles.splice(obstacles.indexOf(obs), 1); // Уничтожаем препятствие
            } else {
                endGame();
            }
        }
    }
    // Столкновение с монетками
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y
        ) {
            coins.splice(i, 1);
            score += 5;
            if (!missions.collectCoins.claimed) {
                missions.collectCoins.progress++;
            }
            playSound(coinSound);
        }
    }
    // Столкновение с пауэр-апами
    for (let i = powerups.length - 1; i >= 0; i--) { // <-- Добавлено
        const p = powerups[i];
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y
        ) {
            powerups.splice(i, 1);
            activatePowerup(p.type);
            // playSound(powerupSound); // Нужен звук для пауэрапа
        }
    }
}

function activatePowerup(type) { // <-- Добавлено
    if (type === 'shield') {
        shieldActive = true;
        powerupTimers.shield = upgrades.shieldDuration.baseValue + (upgrades.shieldDuration.level - 1) * upgrades.shieldDuration.increment;
    } else if (type === 'magnet') {
        magnetActive = true;
        powerupTimers.magnet = upgrades.magnetDuration.baseValue + (upgrades.magnetDuration.level - 1) * upgrades.magnetDuration.increment;
    } else if (type === 'scoreDoubler') {
        scoreDoublerActive = true;
        powerupTimers.scoreDoubler = upgrades.scoreDoublerDuration.baseValue + (upgrades.scoreDoublerDuration.level - 1) * upgrades.scoreDoublerDuration.increment;
    }
}

// =================================
// ГЛАВНЫЕ ИГРОВЫЕ ФУНКЦИИ
// =================================

function init() {
    loadProgress();
    showScreen('main');

    // Назначаем обработчики событий
    startButton.addEventListener('click', startGame);
    shopButton.addEventListener('click', () => showScreen('shop'));
    missionsButton.addEventListener('click', () => showScreen('missions')); // <-- Добавлено
    backToMenuButton.addEventListener('click', () => showScreen('main'));
    backToMenuFromMissionsButton.addEventListener('click', () => showScreen('main')); // <-- Добавлено
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

    // Обработчик для улучшений
    document.getElementById('upgradesContent').addEventListener('click', handleUpgradePurchase); // <-- Добавлено
    // Обработчик для миссий
    document.getElementById('missionsMenu').addEventListener('click', handleMissionClaim); // <-- Добавлено

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
    // Сброс и инициализация переменных игры
    score = 0;
    gameOver = false;
    gameFrame = 0;
    newHighScoreReached = false; // <-- Добавлено
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpsLeft = upgrades.doubleJump.purchased ? 2 : 1; // <-- Изменено
    obstacles = [];
    coins = [];
    powerups = []; // <-- Добавлено
    gameSpeed = initialGameSpeed;
    gravity = 0.55; // Еще уменьшаем гравитацию для более длинного прыжка
    jumpStrength = -21; // Увеличиваем силу прыжка

    // Сброс активных пауэрапов
    shieldActive = false;
    magnetActive = false;
    scoreDoublerActive = false;

    // Устанавливаем начальное время для спавна
    nextObstacleFrame = 100;
    nextCoinFrame = 150;
    nextPowerupFrame = 300; // <-- Добавлено
    
    showScreen('game');
    
    if (musicEnabled) {
        bgMusic.pause();
        startSound.onended = () => {
            if (musicEnabled) {
                bgMusic.play();
            }
            startSound.onended = null; // Очищаем обработчик, чтобы он не сработал снова
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

    saveProgress();
}

let lastTime = 0; // <-- Добавлено
function gameLoop(timestamp) { // <-- Изменено
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

    if (!missions.runDistance.claimed) {
        missions.runDistance.progress += gameSpeed / 10;
    }
    
    // Обновляем состояние игры
    updatePlayer();
    updatePowerupTimers(deltaTime);
    generateObstacles();
    generateCoins();
    generatePowerups();
    checkCollisions();

    // Очищаем и перерисовываем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем серый фон на холсте
    ctx.fillStyle = '#cccccc'; // Серый цвет
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawPlayer();
    drawAndUpdateObstacles();
    drawAndUpdateCoins();
    drawAndUpdatePowerups();
    drawScore();
    drawPowerupTimers();

    requestAnimationFrame(gameLoop);
}

// -- ЗАПУСК ИГРЫ --
init(); 