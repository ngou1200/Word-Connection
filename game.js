class WordConnectionGame {
    constructor() {
        this.gameState = {
            mode: null, // 'pvp', 'ai', 'ai-ai'
            currentPlayer: 1,
            players: {
                1: { name: 'Player 1', score: 0, isAI: false },
                2: { name: 'Player 2', score: 0, isAI: false }
            },
            wordChain: [],
            usedWords: [],
            timeLimit: 60,
            currentTime: 60,
            timer: null,
            isPaused: false,
            isGameOver: false,
            difficulty: 'medium',
            turnCount: 0,
            skipCount: { 1: 0, 2: 0 }
        };
        
        this.elements = {};
        this.aiThinkingTime = { easy: 2000, medium: 3000, hard: 4000 };
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.showLoading();
        this.loadWordValidator();
    }

    cacheElements() {
        this.elements = {
            gameSetup: document.getElementById('gameSetup'),
            gameArea: document.getElementById('gameArea'),
            gameOver: document.getElementById('gameOver'),
            loading: document.getElementById('loading'),
            
            // Setup elements
            modeButtons: document.querySelectorAll('.mode-btn'),
            timeLimit: document.getElementById('timeLimit'),
            difficulty: document.getElementById('difficulty'),
            startGame: document.getElementById('startGame'),
            
            // Game elements
            player1Name: document.getElementById('player1Name'),
            player2Name: document.getElementById('player2Name'),
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            currentPlayer: document.getElementById('currentPlayer'),
            timer: document.getElementById('timer'),
            wordChain: document.getElementById('wordChain'),
            nextLetter: document.getElementById('nextLetter'),
            wordInput: document.getElementById('wordInput'),
            submitWord: document.getElementById('submitWord'),
            skipTurn: document.getElementById('skipTurn'),
            wordHistory: document.getElementById('wordHistory'),
            
            // Control elements
            pauseGame: document.getElementById('pauseGame'),
            endGame: document.getElementById('endGame'),
            newGame: document.getElementById('newGame'),
            
            // Game over elements
            winner: document.getElementById('winner'),
            finalStats: document.getElementById('finalStats'),
            playAgain: document.getElementById('playAgain'),
            backToMenu: document.getElementById('backToMenu')
        };
    }

    bindEvents() {
        // Mode selection
        this.elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMode(e.target.dataset.mode));
        });
        
        // Game setup
        this.elements.startGame.addEventListener('click', () => this.startGame());
        
        // Game controls
        this.elements.submitWord.addEventListener('click', () => this.submitWord());
        this.elements.skipTurn.addEventListener('click', () => this.skipTurn());
        this.elements.pauseGame.addEventListener('click', () => this.togglePause());
        this.elements.endGame.addEventListener('click', () => this.endGame());
        this.elements.newGame.addEventListener('click', () => this.newGame());
        
        // Input handling
        this.elements.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitWord();
            }
        });
        
        this.elements.wordInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '');
        });
        
        // Game over controls
        this.elements.playAgain.addEventListener('click', () => this.playAgain());
        this.elements.backToMenu.addEventListener('click', () => this.backToMenu());
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    async loadWordValidator() {
        try {
            await wordValidator.loadWordList();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load word validator:', error);
            this.hideLoading();
            alert('Failed to load word database. Some features may not work properly.');
        }
    }

    selectMode(mode) {
        this.gameState.mode = mode;
        
        // Update button states
        this.elements.modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Update player names based on mode
        switch (mode) {
            case 'pvp':
                this.gameState.players[1] = { name: 'Player 1', score: 0, isAI: false };
                this.gameState.players[2] = { name: 'Player 2', score: 0, isAI: false };
                break;
            case 'ai':
                this.gameState.players[1] = { name: 'Player', score: 0, isAI: false };
                this.gameState.players[2] = { name: 'AI', score: 0, isAI: true };
                break;
            case 'ai-ai':
                this.gameState.players[1] = { name: 'AI Player 1', score: 0, isAI: true };
                this.gameState.players[2] = { name: 'AI Player 2', score: 0, isAI: true };
                break;
        }
    }

    startGame() {
        if (!this.gameState.mode) {
            alert('Please select a game mode first!');
            return;
        }
        
        if (!wordValidator.isLoaded) {
            alert('Word database is still loading. Please wait...');
            return;
        }
        
        // Get settings
        this.gameState.timeLimit = parseInt(this.elements.timeLimit.value);
        this.gameState.difficulty = this.elements.difficulty.value;
        this.gameState.currentTime = this.gameState.timeLimit;
        
        // Reset game state
        this.resetGameState();
        
        // Update UI
        this.updatePlayerNames();
        this.updateScores();
        this.updateCurrentPlayer();
        this.updateTimer();
        this.updateWordChain();
        this.updateNextLetter();
        
        // Show game area
        this.elements.gameSetup.style.display = 'none';
        this.elements.gameArea.style.display = 'block';
        
        // Start timer if enabled
        if (this.gameState.timeLimit > 0) {
            this.startTimer();
        }
        
        // Handle AI vs AI mode
        if (this.gameState.mode === 'ai-ai') {
            this.elements.wordInput.style.display = 'none';
            this.elements.submitWord.style.display = 'none';
            this.elements.skipTurn.style.display = 'none';
            this.handleAITurn();
        } else {
            this.elements.wordInput.style.display = 'block';
            this.elements.submitWord.style.display = 'inline-block';
            this.elements.skipTurn.style.display = 'inline-block';
            
            // Focus input for human players
            if (!this.gameState.players[this.gameState.currentPlayer].isAI) {
                this.elements.wordInput.focus();
            }
        }
        
        // Handle AI first turn
        if (this.gameState.players[this.gameState.currentPlayer].isAI) {
            this.handleAITurn();
        }
    }

    resetGameState() {
        this.gameState.currentPlayer = 1;
        this.gameState.wordChain = [];
        this.gameState.usedWords = [];
        this.gameState.isPaused = false;
        this.gameState.isGameOver = false;
        this.gameState.turnCount = 0;
        this.gameState.skipCount = { 1: 0, 2: 0 };
        this.gameState.players[1].score = 0;
        this.gameState.players[2].score = 0;
        
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
    }

    updatePlayerNames() {
        this.elements.player1Name.textContent = this.gameState.players[1].name;
        this.elements.player2Name.textContent = this.gameState.players[2].name;
    }

    updateScores() {
        this.elements.player1Score.textContent = `Score: ${this.gameState.players[1].score}`;
        this.elements.player2Score.textContent = `Score: ${this.gameState.players[2].score}`;
    }

    updateCurrentPlayer() {
        const currentPlayerName = this.gameState.players[this.gameState.currentPlayer].name;
        this.elements.currentPlayer.textContent = `${currentPlayerName}'s Turn`;
        
        // Update player visual indicators
        document.getElementById('player1Info').classList.toggle('active', this.gameState.currentPlayer === 1);
        document.getElementById('player2Info').classList.toggle('active', this.gameState.currentPlayer === 2);
    }

    updateTimer() {
        if (this.gameState.timeLimit === 0) {
            this.elements.timer.textContent = '∞';
            this.elements.timer.classList.remove('warning');
        } else {
            this.elements.timer.textContent = `${this.gameState.currentTime}s`;
            this.elements.timer.classList.toggle('warning', this.gameState.currentTime <= 10);
        }
    }

    startTimer() {
        if (this.gameState.timeLimit === 0) return;
        
        this.gameState.timer = setInterval(() => {
            if (this.gameState.isPaused || this.gameState.isGameOver) return;
            
            this.gameState.currentTime--;
            this.updateTimer();
            
            if (this.gameState.currentTime <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    handleTimeout() {
        this.addToHistory(`${this.gameState.players[this.gameState.currentPlayer].name} ran out of time!`);
        this.skipTurn();
    }

    updateWordChain() {
        this.elements.wordChain.innerHTML = '';
        
        this.gameState.wordChain.forEach((entry, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = `word-item ${entry.player === 1 ? 'player1' : 'player2'}`;
            wordElement.textContent = entry.word;
            wordElement.title = `${this.gameState.players[entry.player].name}: ${entry.word} (${entry.score} points)`;
            this.elements.wordChain.appendChild(wordElement);
        });
        
        if (this.gameState.wordChain.length === 0) {
            this.elements.wordChain.innerHTML = '<div class="empty-chain">Game will start with your first word!</div>';
        }
    }

    updateNextLetter() {
        if (this.gameState.wordChain.length === 0) {
            this.elements.nextLetter.textContent = 'Any letter';
        } else {
            const lastWord = this.gameState.wordChain[this.gameState.wordChain.length - 1].word;
            const nextLetter = lastWord[lastWord.length - 1].toUpperCase();
            this.elements.nextLetter.textContent = nextLetter;
        }
    }

    submitWord() {
        if (this.gameState.isGameOver || this.gameState.isPaused) return;
        
        const word = this.elements.wordInput.value.trim();
        if (!word) return;
        
        this.processWord(word);
        this.elements.wordInput.value = '';
    }

    processWord(word) {
        const previousWord = this.gameState.wordChain.length > 0 
            ? this.gameState.wordChain[this.gameState.wordChain.length - 1].word 
            : '';
        
        const validation = wordValidator.validateGameWord(word, previousWord, this.gameState.usedWords);
        
        if (validation.isValid) {
            this.acceptWord(word, validation.score);
        } else {
            this.rejectWord(validation.message);
        }
    }

    acceptWord(word, score) {
        const currentPlayer = this.gameState.currentPlayer;
        
        // Add to word chain
        this.gameState.wordChain.push({
            word: word.toLowerCase(),
            player: currentPlayer,
            score: score
        });
        
        // Add to used words
        this.gameState.usedWords.push(word.toLowerCase());
        
        // Update score
        this.gameState.players[currentPlayer].score += score;
        
        // Add to history
        this.addToHistory(`${this.gameState.players[currentPlayer].name}: ${word} (+${score} points)`);
        
        // Update UI
        this.updateWordChain();
        this.updateNextLetter();
        this.updateScores();
        
        // Switch turns
        this.switchTurn();
    }

    rejectWord(message) {
        this.addToHistory(`❌ ${message}`, 'error');
        
        // For AI, try another word
        if (this.gameState.players[this.gameState.currentPlayer].isAI) {
            setTimeout(() => this.handleAITurn(), 1000);
        }
    }

    switchTurn() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.gameState.currentTime = this.gameState.timeLimit;
        this.gameState.turnCount++;
        
        this.updateCurrentPlayer();
        this.updateTimer();
        
        // Check for game end conditions
        if (this.shouldEndGame()) {
            this.endGame();
            return;
        }
        
        // Handle AI turn
        if (this.gameState.players[this.gameState.currentPlayer].isAI) {
            setTimeout(() => this.handleAITurn(), 500);
        } else {
            this.elements.wordInput.focus();
        }
    }

    handleAITurn() {
        if (this.gameState.isGameOver || this.gameState.isPaused) return;
        
        const thinkingTime = this.aiThinkingTime[this.gameState.difficulty];
        const currentPlayer = this.gameState.currentPlayer;
        
        // Show AI thinking
        this.elements.currentPlayer.textContent = `${this.gameState.players[currentPlayer].name} is thinking...`;
        
        setTimeout(() => {
            if (this.gameState.isGameOver || this.gameState.isPaused) return;
            
            const aiWord = this.getAIWord();
            
            if (aiWord) {
                this.processWord(aiWord);
            } else {
                // AI couldn't find a word, skip turn
                this.addToHistory(`${this.gameState.players[currentPlayer].name} couldn't find a word and skipped turn`);
                this.skipTurn();
            }
        }, thinkingTime);
    }

    getAIWord() {
        const nextLetter = this.gameState.wordChain.length > 0 
            ? this.gameState.wordChain[this.gameState.wordChain.length - 1].word.slice(-1)
            : this.getRandomLetter();
        
        const availableWords = wordValidator.getWordsStartingWith(
            nextLetter, 
            this.gameState.difficulty, 
            100
        );
        
        // Filter out used words
        const unusedWords = availableWords.filter(word => 
            !this.gameState.usedWords.includes(word.toLowerCase())
        );
        
        if (unusedWords.length === 0) {
            return null;
        }
        
        // AI strategy based on difficulty
        let selectedWord;
        
        switch (this.gameState.difficulty) {
            case 'easy':
                // Choose shorter, simpler words
                selectedWord = unusedWords.find(word => word.length <= 5) || unusedWords[0];
                break;
            case 'hard':
                // Choose longer, higher-scoring words
                const highScoreWords = unusedWords
                    .map(word => ({ word, score: wordValidator.getWordScore(word) }))
                    .sort((a, b) => b.score - a.score);
                selectedWord = highScoreWords[0]?.word || unusedWords[0];
                break;
            default: // medium
                // Random selection from available words
                selectedWord = unusedWords[Math.floor(Math.random() * unusedWords.length)];
                break;
        }
        
        return selectedWord;
    }

    getRandomLetter() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        return letters[Math.floor(Math.random() * letters.length)];
    }

    skipTurn() {
        if (this.gameState.isGameOver) return;
        
        const currentPlayer = this.gameState.currentPlayer;
        this.gameState.skipCount[currentPlayer]++;
        
        this.addToHistory(`${this.gameState.players[currentPlayer].name} skipped their turn`);
        
        // Check if player has skipped too many times
        if (this.gameState.skipCount[currentPlayer] >= 3) {
            this.addToHistory(`${this.gameState.players[currentPlayer].name} has skipped 3 turns and loses!`);
            this.endGame();
            return;
        }
        
        this.switchTurn();
    }

    shouldEndGame() {
        // Game ends after 50 turns or if no valid words available
        if (this.gameState.turnCount >= 50) {
            return true;
        }
        
        // Check if there are any valid words for the next letter
        if (this.gameState.wordChain.length > 0) {
            const nextLetter = this.gameState.wordChain[this.gameState.wordChain.length - 1].word.slice(-1);
            const availableWords = wordValidator.getWordsStartingWith(nextLetter, 'easy', 10);
            const unusedWords = availableWords.filter(word => 
                !this.gameState.usedWords.includes(word.toLowerCase())
            );
            
            if (unusedWords.length === 0) {
                return true;
            }
        }
        
        return false;
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.elements.pauseGame.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
        
        if (this.gameState.isPaused) {
            this.addToHistory('Game paused');
        } else {
            this.addToHistory('Game resumed');
            
            // Resume AI turn if needed
            if (this.gameState.players[this.gameState.currentPlayer].isAI) {
                this.handleAITurn();
            }
        }
    }

    endGame() {
        this.gameState.isGameOver = true;
        
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
        
        this.showGameOver();
    }

    showGameOver() {
        // Determine winner
        const player1Score = this.gameState.players[1].score;
        const player2Score = this.gameState.players[2].score;
        
        let winnerText;
        if (player1Score > player2Score) {
            winnerText = `${this.gameState.players[1].name} Wins!`;
        } else if (player2Score > player1Score) {
            winnerText = `${this.gameState.players[2].name} Wins!`;
        } else {
            winnerText = "It's a Tie!";
        }
        
        this.elements.winner.textContent = winnerText;
        
        // Show final stats
        const stats = `
            <div class="stat-item">
                <span>${this.gameState.players[1].name} Score:</span>
                <span>${player1Score}</span>
            </div>
            <div class="stat-item">
                <span>${this.gameState.players[2].name} Score:</span>
                <span>${player2Score}</span>
            </div>
            <div class="stat-item">
                <span>Total Words:</span>
                <span>${this.gameState.wordChain.length}</span>
            </div>
            <div class="stat-item">
                <span>Total Turns:</span>
                <span>${this.gameState.turnCount}</span>
            </div>
        `;
        
        this.elements.finalStats.innerHTML = stats;
        
        // Show game over screen
        this.elements.gameArea.style.display = 'none';
        this.elements.gameOver.style.display = 'block';
    }

    playAgain() {
        this.elements.gameOver.style.display = 'none';
        this.startGame();
    }

    backToMenu() {
        this.elements.gameOver.style.display = 'none';
        this.elements.gameArea.style.display = 'none';
        this.elements.gameSetup.style.display = 'block';
        
        if (this.gameState.timer) {
            clearInterval(this.gameState.timer);
            this.gameState.timer = null;
        }
    }

    newGame() {
        this.backToMenu();
    }

    addToHistory(message, type = 'info') {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${type}`;
        historyItem.innerHTML = `
            <span class="history-message">${message}</span>
            <span class="history-time">${new Date().toLocaleTimeString()}</span>
        `;
        
        this.elements.wordHistory.insertBefore(historyItem, this.elements.wordHistory.firstChild);
        
        // Keep only last 20 history items
        while (this.elements.wordHistory.children.length > 20) {
            this.elements.wordHistory.removeChild(this.elements.wordHistory.lastChild);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WordConnectionGame();
});