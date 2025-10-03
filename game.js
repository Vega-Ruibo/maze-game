class MazeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.rows = 15;
        this.cols = 15;
        
        this.maze = [];
        this.player = { x: 1, y: 1 };
        this.enemy = { x: 0, y: 0 };
        this.exit = { x: this.cols - 2, y: this.rows - 2 };
        
        this.gameOver = false;
        this.playerWon = false;
        this.moves = 0;
        this.startTime = Date.now();
        this.currentTime = 0;
        this.bestTime = localStorage.getItem('mazeBestTime') || Infinity;
        
        this.keys = {};
        this.lastPlayerMove = 0;
        this.lastEnemyMove = 0;
        this.playerMoveInterval = 200; // 玩家移动间隔(毫秒) - 增加延迟
        this.enemyMoveInterval = 500;  // 敌人移动间隔(毫秒) - 减少延迟，让敌人更快
        
        this.init();
    }

    init() {
        this.generateMaze();
        this.placeEnemy();
        this.setupEventListeners();
        this.updateBestTimeDisplay();
        this.gameLoop();
    }

    generateMaze() {
        // 初始化迷宫为墙
        this.maze = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
        
        // 生成主路径
        this.generateMazeDFS(1, 1);
        
        // 确保出口是通路
        this.maze[this.exit.y][this.exit.x] = 0;
        
        // 添加第二条路径
        this.addSecondPath();
    }

    generateMazeDFS(x, y) {
        this.maze[y][x] = 0;
        
        const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        this.shuffleArray(directions);
        
        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX > 0 && newX < this.cols - 1 && newY > 0 && newY < this.rows - 1 && this.maze[newY][newX] === 1) {
                this.maze[y + dy / 2][x + dx / 2] = 0;
                this.generateMazeDFS(newX, newY);
            }
        }
    }

    addSecondPath() {
        // 创建第二条路径：先向右再向下
        let x = 1, y = 1;
        while (x < this.cols - 3) {
            x++;
            if (x < this.cols && y < this.rows) this.maze[y][x] = 0;
        }
        while (y < this.rows - 2) {
            y++;
            if (x < this.cols && y < this.rows) this.maze[y][x] = 0;
        }
        while (x < this.cols - 2) {
            x++;
            if (x < this.cols && y < this.rows) this.maze[y][x] = 0;
        }
        
        // 随机打通一些墙壁创建更多路径
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * (this.cols - 2)) + 1;
            const y = Math.floor(Math.random() * (this.rows - 2)) + 1;
            
            if (this.maze[y][x] === 1 && this.wouldCreateNewPath(x, y)) {
                this.maze[y][x] = 0;
            }
        }
    }

    wouldCreateNewPath(x, y) {
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        let connectedPaths = 0;
        
        for (const [dx, dy] of directions) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.maze[ny][nx] === 0) {
                connectedPaths++;
            }
        }
        
        return connectedPaths >= 2;
    }

    placeEnemy() {
        // 将敌人放在远离玩家的位置
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            this.enemy.x = Math.floor(Math.random() * (this.cols - 4)) + 2;
            this.enemy.y = Math.floor(Math.random() * (this.rows - 4)) + 2;
            attempts++;
        } while ((this.maze[this.enemy.y][this.enemy.x] === 1 || 
                 this.getDistance(this.player.x, this.player.y, this.enemy.x, this.enemy.y) < 8) && 
                 attempts < maxAttempts);
        
        // 如果找不到合适位置，放在固定位置
        if (this.maze[this.enemy.y][this.enemy.x] === 1 || attempts >= maxAttempts) {
            this.enemy.x = this.cols - 3;
            this.enemy.y = this.rows - 3;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (this.gameOver && (e.key === 'r' || e.key === 'R')) {
                this.restartGame();
            }
            
            // 阻止箭头键滚动页面
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // 手机的移动功能
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouch(e);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        // 防止连续按键过快
        document.addEventListener('keydown', (e) => {
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                if (this.keys[e.key.toLowerCase()]) {
                    e.preventDefault();
                    return;
                }
                this.keys[e.key.toLowerCase()] = true;
            }
        });
    }

    handleTouch(e) {
        if (this.gameOver) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // 计算触摸点相对于玩家的方向
        const playerCenterX = this.player.x * this.cellSize + this.cellSize / 2;
        const playerCenterY = this.player.y * this.cellSize + this.cellSize / 2;
        
        const dx = touchX - playerCenterX;
        const dy = touchY - playerCenterY;
        
        // 移动到触摸方向
        if (Math.abs(dx) > Math.abs(dy)) {
            this.movePlayer(dx > 0 ? 1 : -1, 0);
        } else {
            this.movePlayer(0, dy > 0 ? 1 : -1);
        }
    }

    movePlayer(dx, dy) {
        if (this.gameOver) return;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (this.isValidMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.moves++;
            
            this.checkGameState();
        }
    }

    moveEnemy() {
        if (this.gameOver) return;
        
        // 使用BFS寻找最短路径
        const path = this.findPathBFS(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
        
        if (path.length > 1) {
            // 沿着路径移动
            this.enemy.x = path[1].x;
            this.enemy.y = path[1].y;
        } else {
            // 如果找不到路径，使用备用方案
            this.backupEnemyMove();
        }
    }

    findPathBFS(startX, startY, targetX, targetY) {
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);
        
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === targetX && current.y === targetY) {
                return current.path.concat([current]);
            }
            
            for (const [dx, dy] of directions) {
                const newX = current.x + dx;
                const newY = current.y + dy;
                const key = `${newX},${newY}`;
                
                if (this.isValidMove(newX, newY) && !visited.has(key)) {
                    visited.add(key);
                    queue.push({
                        x: newX,
                        y: newY,
                        path: current.path.concat([current])
                    });
                }
            }
        }
        
        return [];
    }

    backupEnemyMove() {
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        let bestMove = null;
        let minDistance = Infinity;
        
        for (const [dx, dy] of directions) {
            const newX = this.enemy.x + dx;
            const newY = this.enemy.y + dy;
            
            if (this.isValidMove(newX, newY)) {
                const distance = this.getDistance(newX, newY, this.player.x, this.player.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMove = { x: newX, y: newY };
                }
            }
        }
        
        if (bestMove) {
            this.enemy.x = bestMove.x;
            this.enemy.y = bestMove.y;
        }
    }

    isValidMove(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.maze[y][x] === 0;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    checkGameState() {
        // 检查是否到达出口
        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            this.gameOver = true;
            this.playerWon = true;
            this.updateBestTime();
            this.showGameOver();
            return;
        }
        
        // 检查是否被敌人抓到
        if (this.player.x === this.enemy.x && this.player.y === this.enemy.y) {
            this.gameOver = true;
            this.playerWon = false;
            this.showGameOver();
        }
    }

    updateBestTime() {
        const currentTime = Math.floor((Date.now() - this.startTime) / 1000);
        if (currentTime < this.bestTime) {
            this.bestTime = currentTime;
            localStorage.setItem('mazeBestTime', this.bestTime);
        }
    }

    updateBestTimeDisplay() {
        const bestTimeElement = document.getElementById('bestTime');
        if (this.bestTime === Infinity) {
            bestTimeElement.textContent = '--';
        } else {
            bestTimeElement.textContent = this.bestTime;
        }
    }

    showGameOver() {
        const gameOverDiv = document.getElementById('gameOver');
        const gameMessage = document.getElementById('gameMessage');
        const finalTime = document.getElementById('finalTime');
        const finalMoves = document.getElementById('finalMoves');
        const newRecord = document.getElementById('newRecord');
        
        const timePlayed = Math.floor((Date.now() - this.startTime) / 1000);
        
        gameMessage.textContent = this.playerWon ? '🎉 Congratulations! You Won! 🎉' : '💀 Game Over! You were caught! 💀';
        gameMessage.style.color = this.playerWon ? '#10B981' : '#EF4444';
        
        finalTime.textContent = timePlayed;
        finalMoves.textContent = this.moves;
        
        // 检查是否创造新纪录
        if (this.playerWon && timePlayed === this.bestTime) {
            newRecord.classList.remove('hidden');
        } else {
            newRecord.classList.add('hidden');
        }
        
        gameOverDiv.classList.remove('hidden');
    }

    restartGame() {
        this.player = { x: 1, y: 1 };
        this.placeEnemy();
        this.gameOver = false;
        this.playerWon = false;
        this.moves = 0;
        this.startTime = Date.now();
        this.lastPlayerMove = 0;
        this.lastEnemyMove = 0;
        
        document.getElementById('gameOver').classList.add('hidden');
    }

    handleInput() {
        const now = Date.now();
        
        // 玩家移动限制：每200ms才能移动一次
        if (now - this.lastPlayerMove < this.playerMoveInterval) {
            return;
        }
        
        let moved = false;
        
        if (this.keys['arrowup'] || this.keys['w']) {
            this.movePlayer(0, -1);
            moved = true;
        } else if (this.keys['arrowdown'] || this.keys['s']) {
            this.movePlayer(0, 1);
            moved = true;
        } else if (this.keys['arrowleft'] || this.keys['a']) {
            this.movePlayer(-1, 0);
            moved = true;
        } else if (this.keys['arrowright'] || this.keys['d']) {
            this.movePlayer(1, 0);
            moved = true;
        }
        
        if (moved) {
            this.lastPlayerMove = now;
        }
    }

    update() {
        this.currentTime = Date.now();
        this.handleInput();
        
        // 敌人移动：每500ms移动一次
        if (this.currentTime - this.lastEnemyMove > this.enemyMoveInterval) {
            this.moveEnemy();
            this.lastEnemyMove = this.currentTime;
            this.checkGameState(); // 检查敌人移动后是否抓到玩家
        }
        
        // 更新UI
        document.getElementById('timer').textContent = Math.floor((this.currentTime - this.startTime) / 1000);
        document.getElementById('moves').textContent = this.moves;
    }

    render() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制迷宫
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1) {
                    // 墙壁
                    this.ctx.fillStyle = '#2d3748';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    this.ctx.strokeStyle = '#4a5568';
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                } else {
                    // 路径
                    this.ctx.fillStyle = '#2d2d2d';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        
        // 绘制出口
        this.ctx.fillStyle = '#10B981';
        this.ctx.fillRect(this.exit.x * this.cellSize + 2, this.exit.y * this.cellSize + 2, 
                         this.cellSize - 4, this.cellSize - 4);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('EXIT', this.exit.x * this.cellSize + this.cellSize / 2, 
                         this.exit.y * this.cellSize + this.cellSize / 2 + 4);
        
        // 绘制玩家
        this.ctx.fillStyle = '#3B82F6';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x * this.cellSize + this.cellSize / 2, 
                    this.player.y * this.cellSize + this.cellSize / 2, 
                    this.cellSize / 2 - 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 玩家发光效果
        this.ctx.shadowColor = '#3B82F6';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // 绘制敌人
        this.ctx.fillStyle = '#EF4444';
        this.ctx.fillRect(this.enemy.x * this.cellSize + 2, this.enemy.y * this.cellSize + 2, 
                         this.cellSize - 4, this.cellSize - 4);
        
        // 敌人发光效果
        this.ctx.shadowColor = '#EF4444';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.enemy.x * this.cellSize + 2, this.enemy.y * this.cellSize + 2, 
                         this.cellSize - 4, this.cellSize - 4);
        this.ctx.shadowBlur = 0;

        // 显示移动提示
        if (!this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('Use Arrow Keys or WASD to move', 10, 20);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// 全局函数供HTML按钮使用
function restartGame() {
    game.restartGame();
}

function closeGameOver() {
    document.getElementById('gameOver').classList.add('hidden');
}

// 页面加载完成后启动游戏
window.addEventListener('load', () => {
    game = new MazeGame();
});