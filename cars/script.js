const player = document.getElementById('player');
const playArea = document.getElementById('play-area');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over');
const levelCompleteScreen = document.getElementById('level-complete');
const currentLevelDisplay = document.getElementById('current-level');
const timerDisplay = document.getElementById('timer');
const carImages = [
    '/Users/wang/Desktop/cars/carsss/car1.png',
    '/Users/wang/Desktop/cars/carsss/car2.png',
    '/Users/wang/Desktop/cars/carsss/car3.png',
    '/Users/wang/Desktop/cars/carsss/car4.png',
    '/Users/wang/Desktop/cars/carsss/car5.png',
    '/Users/wang/Desktop/cars/carsss/car6.png',
];

let playerX = 0;
let playerY = 0;
let score = 0;
let level = 1;
const initialCarSpeed = 54;
const initialCarInterval = 250;
let timer = 60;
let carIntervalId;
let timerInterval;
let gamePaused = false;
let collisionDetected = false;
let maxCars = 20;
let isLevelTransitioning = false; // 用於追踪關卡切換狀態
let gameStarted = false; // 追踪遊戲是經開始
let startPrompt = null; // 用於存儲開始提示元素
let countdownValue = 3; // 倒數計時值
let initialCarsCreated = false; // 追踪初始車輛是否已創建完成

playerX = (600 - 50) / 2;
playerY = 0;
player.style.left = `${playerX}px`;
player.style.bottom = `${playerY}px`;

function throttle(func, wait) {
    let lastTime = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastTime >= wait) {
            func.apply(this, args);
            lastTime = now;
        }
    };
}

document.addEventListener(
    'keydown',
    throttle((event) => {
        if (gamePaused || isLevelTransitioning || !gameStarted) return; // 增加 gameStarted 檢查

        const step = 50;
        switch (event.key) {
            case 'ArrowLeft':
                if (playerX > 0) {
                    playerX -= step;
                    player.style.left = `${playerX}px`;
                }
                break;
            case 'ArrowRight':
                if (playerX < 550) {
                    playerX += step;
                    player.style.left = `${playerX}px`;
                }
                break;
            case 'ArrowUp':
                if (playerY < 350) {
                    if (!isPathBlocked(playerX, playerY + step)) {
                        playerY += step;
                        player.style.bottom = `${playerY}px`;
                    }
                }
                break;
            case 'ArrowDown':
                if (playerY > 0) {
                    playerY -= step;
                    player.style.bottom = `${playerY}px`;
                }
                break;
        }
        checkWin();
    }, 100)
);

function isPathBlocked(x, y) {
    if (isLevelTransitioning) return false; // 關卡切換時不檢查路徑阻擋
    
    const cars = document.querySelectorAll('.car');
    for (const car of cars) {
        const carRect = car.getBoundingClientRect();
        if (
            y + 50 >= carRect.top &&
            y <= carRect.bottom &&
            x + 50 >= carRect.left &&
            x <= carRect.right
        ) {
            return true;
        }
    }
    return false;
}

function checkCollision(car) {
    if (collisionDetected || isLevelTransitioning || gamePaused) return; // 修改：增加額外檢查

    const playerRect = player.getBoundingClientRect();
    const carRect = car.getBoundingClientRect();

    // 增加額外的邊界檢查
    if (!playerRect || !carRect) return;
    
    // 增加碰撞容差
    const tolerance = 10;
    if (
        playerRect.top + tolerance < carRect.bottom &&
        playerRect.bottom - tolerance > carRect.top &&
        playerRect.right - tolerance > carRect.left &&
        playerRect.left + tolerance < carRect.right
    ) {
        console.log('Collision detected!');
        collisionDetected = true;
        gameOver();
    }
}

function checkWin() {
    if (isLevelTransitioning) return; // 關卡切換時不檢查勝利
    
    const playerTop = parseInt(player.style.bottom);
    if (playerTop >= 350) {
        score++;
        scoreDisplay.textContent = `得分: ${score}`;
        showLevelComplete();
    }
}

function showLevelComplete() {
    isLevelTransitioning = true; // 設置關卡切換狀態
    clearInterval(timerInterval);
    clearInterval(carIntervalId);
    currentLevelDisplay.textContent = level;
    levelCompleteScreen.style.display = 'block';
}

function nextLevel() {
    // 重置所有遊戲狀態
    level++;
    timer = 60;
    isLevelTransitioning = true;
    collisionDetected = false;
    gamePaused = false;

    // 清理遊戲區域
    clearPlayArea();
    
    // 重置玩家位置
    resetPlayerPosition();
    
    // 增加最大車輛數
    maxCars += 5;

    // 隱藏關卡完成界面
    levelCompleteScreen.style.display = 'none';
    
    // 使用 setTimeout 確保遊戲狀態完全重置後再開始新關卡
    setTimeout(() => {
        isLevelTransitioning = false;
        startGame();
    }, 500);
}

function resetPlayerPosition() {
    playerX = (600 - 50) / 2;
    playerY = 0;
    player.style.left = `${playerX}px`;
    player.style.bottom = `${playerY}px`;
}

function clearPlayArea() {
    const cars = document.querySelectorAll('.car');
    cars.forEach((car) => car.remove());
}

function gameOver() {
    if (isLevelTransitioning) return; // 關卡切換時不觸發遊戲結束
    
    clearInterval(timerInterval);
    clearInterval(carIntervalId);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'block';
    gamePaused = true;
}

function restartGame() {
    // 重置所有遊戲狀態
    score = 0;
    level = 1;
    timer = 60;
    maxCars = 20;
    collisionDetected = false;
    gamePaused = false;
    isLevelTransitioning = false;
    gameStarted = false; // 重置遊戲開始狀態
    initialCarsCreated = false;
    countdownValue = 3;
    if (startPrompt) {
        startPrompt.remove();
        startPrompt = null;
    }

    // 更新顯示
    scoreDisplay.textContent = `得分: ${score}`;
    timerDisplay.textContent = timer;
    gameOverScreen.style.display = 'none';
    
    // 重置玩家位置和清理遊戲區域
    resetPlayerPosition();
    clearPlayArea();
    
    // 開始新遊戲
    startGame();
}

function startGame() {
    if (isLevelTransitioning) return; // 關卡切換時不開始新遊戲
    
    clearPlayArea();
    // 根據關卡增加難度
    const carSpeed = initialCarSpeed + (level - 1) * 9; // 調整每關速度提升幅度
    const carInterval = Math.max(200, initialCarInterval - (level - 1) * 50); // 調整生成間隔
    maxCars = 20 + (level - 1) * 5;
    
    if (carIntervalId) clearInterval(carIntervalId);
    if (timerInterval) clearInterval(timerInterval);
    
    if (!gameStarted) {
        // 創建倒數計時提示
        startPrompt = document.createElement('div');
        startPrompt.style.position = 'absolute';
        startPrompt.style.top = '50%';
        startPrompt.style.left = '50%';
        startPrompt.style.transform = 'translate(-50%, -50%)';
        startPrompt.style.fontSize = '48px';
        startPrompt.style.color = 'white';
        startPrompt.style.zIndex = '1000';
        playArea.appendChild(startPrompt);
        
        // 開始倒數
        startCountdown();
    } else {
        startGameTimers(carSpeed, carInterval);
    }
}

function startCountdown() {
    if (countdownValue > 0) {
        startPrompt.textContent = countdownValue;
        countdownValue--;
        setTimeout(startCountdown, 500); // 加快倒數速度到0.5秒
    } else {
        startPrompt.textContent = 'START!';
        createInitialCars(() => {
            setTimeout(() => {
                startPrompt.remove();
                gameStarted = true;
                countdownValue = 3;
                startGameTimers(initialCarSpeed + (level - 1) * 9, 
                    Math.max(200, initialCarInterval - (level - 1) * 50));
            }, 500); // 縮短等待時間
        });
    }
}

function createInitialCars(callback) {
    const carSpeed = initialCarSpeed + (level - 1) * 9;
    let carsCreated = 0;
    const totalInitialCars = 12;
    const positions = [];
    
    // 預先計算車輛位置，進一步縮小間距
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            positions.push({
                row: i,
                right: 600 + j * 100 // 更密集的車輛分布
            });
        }
    }
    
    function createCar() {
        if (carsCreated < totalInitialCars) {
            const position = positions[carsCreated];
            const car = document.createElement('div');
            car.classList.add('car');
            car.style.backgroundImage = `url('${carImages[Math.floor(Math.random() * carImages.length)]}')`;
            car.style.top = `${position.row * 100}px`;
            car.style.right = `${position.right}px`;
            playArea.appendChild(car);
            
            let carMovementId;
            function moveCar() {
                if (gamePaused || isLevelTransitioning) {
                    cancelAnimationFrame(carMovementId);
                    return;
                }
                
                const currentRight = parseInt(car.style.right);
                if (currentRight < -100) {
                    cancelAnimationFrame(carMovementId);
                    car.remove();
                } else {
                    car.style.right = `${currentRight - carSpeed}px`;
                    if (!isLevelTransitioning && !gamePaused) {
                        checkCollision(car);
                    }
                    carMovementId = requestAnimationFrame(moveCar);
                }
            }
            carMovementId = requestAnimationFrame(moveCar);
            
            carsCreated++;
            setTimeout(createCar, 40); // 稍微放慢生成速度
        } else {
            setTimeout(callback, 250);
        }
    }
    
    createCar();
}

function startGameTimers(carSpeed, carInterval) {
    // 先創建一批車輛，確保畫面上有足夠的車
    for (let i = 0; i < 4; i++) {
        createCars(carSpeed);
    }
    
    carIntervalId = setInterval(() => {
        if (!gamePaused && !isLevelTransitioning && gameStarted) {
            const currentCars = document.querySelectorAll('.car').length;
            // 根據當前車輛數量動態調整生成
            if (currentCars < maxCars - 2) { // 預留空間給新車
                createCars(carSpeed);
            }
        }
    }, carInterval);

    timerInterval = setInterval(() => {
        if (gamePaused || isLevelTransitioning || !gameStarted) return;
        timer--;
        timerDisplay.textContent = timer;
        if (timer <= 0) {
            gameOver();
        }
    }, 1000);
}

function createCars(carSpeed) {
    if (isLevelTransitioning) return;
    
    const numRows = 4;
    const rowHeight = 100;
    const minDistanceBetweenCars = 120; // 稍微增加最小間距

    for (let i = 0; i < numRows; i++) {
        const existingCarsInRow = Array.from(document.querySelectorAll('.car')).filter(
            car => parseInt(car.style.top) === i * rowHeight
        );

        // 檢查最後一輛車的位置
        if (existingCarsInRow.length > 0) {
            const lastCar = existingCarsInRow[existingCarsInRow.length - 1];
            const lastCarRight = parseInt(lastCar.style.right);
            if (lastCarRight > -100 && lastCarRight < minDistanceBetweenCars) {
                continue;
            }
        }

        // 如果該行可以創建新車
        if (Math.random() < 0.75) { // 稍微降低生成概率
            const car = document.createElement('div');
            car.classList.add('car');
            car.style.backgroundImage = `url('${carImages[Math.floor(Math.random() * carImages.length)]}')`;
            car.style.top = `${i * rowHeight}px`;
            
            // 根據現有車輛位置計算新車位置
            let newCarRight = 600;
            if (existingCarsInRow.length > 0) {
                const lastCar = existingCarsInRow[existingCarsInRow.length - 1];
                const lastCarRight = parseInt(lastCar.style.right);
                newCarRight = Math.max(600, lastCarRight + minDistanceBetweenCars);
            }

            car.style.right = `${newCarRight}px`;
            playArea.appendChild(car);

            let carMovementId;
            function moveCar() {
                if (gamePaused || isLevelTransitioning) {
                    cancelAnimationFrame(carMovementId);
                    return;
                }
                
                const currentRight = parseInt(car.style.right);
                if (currentRight < -100) {
                    cancelAnimationFrame(carMovementId);
                    car.remove();
                } else {
                    car.style.right = `${currentRight - carSpeed}px`;
                    if (!isLevelTransitioning && !gamePaused) {
                        checkCollision(car);
                    }
                    carMovementId = requestAnimationFrame(moveCar);
                }
            }
            carMovementId = requestAnimationFrame(moveCar);
        }
    }
}

function createFirstCar(carSpeed, callback) {
    const car = document.createElement('div');
    car.classList.add('car');
    car.style.backgroundImage = `url('${carImages[Math.floor(Math.random() * carImages.length)]}')`;
    car.style.top = '0px';
    car.style.right = '600px';
    playArea.appendChild(car);

    let carMovementId;
    function moveFirstCar() {
        const currentRight = parseInt(car.style.right);
        if (currentRight <= -100) {
            cancelAnimationFrame(carMovementId);
            car.remove();
            callback();
        } else {
            car.style.right = `${currentRight - carSpeed}px`;
            carMovementId = requestAnimationFrame(moveFirstCar);
        }
    }
    carMovementId = requestAnimationFrame(moveFirstCar);
}

const GAME_SETTINGS = {
    CAR_SPEEDS: {
        easy: 0.5,     // 原本可能是 2 或更高
        normal: 0.8,   // 原本可能是 3 或更高
        hard: 1.2      // 原本可能是 4 或更高
    },
    SPAWN_INTERVALS: {
        easy: 2500,    // 每 2.5 秒
        normal: 2000,  // 每 2 秒
        hard: 1500     // 每 1.5 秒
    }
};

function createCar() {
    const car = document.createElement('div');
    car.className = 'car';
    const lane = Math.floor(Math.random() * 7);
    car.style.top = `${lane * 14 + 5}%`;
    
    // 使用極低的速度值
    const baseSpeed = GAME_SETTINGS.CAR_SPEEDS[currentDifficulty] || GAME_SETTINGS.CAR_SPEEDS.normal;
    const speed = baseSpeed;  // 不再添加隨機變化，保持穩定的低速
    
    car.style.right = '-50px';
    playArea.appendChild(car);

    let position = -50;
    function moveCar() {
        if (position > window.innerWidth) {
            car.remove();
        } else {
            position += speed;
            car.style.right = `${position}px`;
            requestAnimationFrame(moveCar);
        }
    }

    requestAnimationFrame(moveCar);
}

// 如果有生成車輛的間隔控制，也相應調整
function startSpawningCars() {
    const spawnInterval = GAME_SETTINGS.SPAWN_INTERVALS[currentDifficulty] || GAME_SETTINGS.SPAWN_INTERVALS.normal;
    
    return setInterval(() => {
        createCar();
    }, spawnInterval);
}

startGame();