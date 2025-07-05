class WordValidator {
    constructor() {
        this.wordSet = new Set();
        this.wordsByLetter = {};
        this.isLoaded = false;
        this.loadPromise = null;
    }

    async loadWordList() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._loadWordListInternal();
        return this.loadPromise;
    }

    async _loadWordListInternal() {
        try {
            const response = await fetch('wordlist.txt');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const lines = text.split('\n');
            
            for (let line of lines) {
                line = line.trim();
                if (line && line.length > 0) {
                    // Remove quotes if present
                    const word = line.replace(/^"|"$/g, '').toLowerCase();
                    if (word.length >= 2) { // Only words with 2+ letters
                        this.wordSet.add(word);
                        
                        // Index by first letter for faster AI word selection
                        const firstLetter = word[0];
                        if (!this.wordsByLetter[firstLetter]) {
                            this.wordsByLetter[firstLetter] = [];
                        }
                        this.wordsByLetter[firstLetter].push(word);
                    }
                }
            }
            
            this.isLoaded = true;
            console.log(`Loaded ${this.wordSet.size} words from dictionary`);
            
        } catch (error) {
            console.error('Error loading word list:', error);
            // Fallback to a basic word list
            this._loadFallbackWords();
        }
    }

    _loadFallbackWords() {
        const fallbackWords = [
            'apple', 'elephant', 'tiger', 'rabbit', 'turtle', 'eagle', 'lion', 'notebook',
            'keyboard', 'door', 'river', 'mountain', 'ocean', 'nature', 'energy', 'yellow',
            'window', 'world', 'dance', 'earth', 'house', 'engine', 'education', 'network',
            'kind', 'dream', 'music', 'crown', 'night', 'table', 'energy', 'young', 'great',
            'tree', 'example', 'elephant', 'train', 'novel', 'light', 'today', 'year',
            'rainbow', 'wonderful', 'love', 'evening', 'game', 'exciting', 'garden', 'nice',
            'elephant', 'tomorrow', 'wonderful', 'language', 'education', 'never', 'ready',
            'yellow', 'winter', 'reading', 'grape', 'elephant', 'tennis', 'sister', 'rock',
            'knowledge', 'excited', 'dog', 'gentle', 'excellent', 'trust', 'time', 'explore'
        ];

        for (const word of fallbackWords) {
            this.wordSet.add(word.toLowerCase());
            const firstLetter = word[0].toLowerCase();
            if (!this.wordsByLetter[firstLetter]) {
                this.wordsByLetter[firstLetter] = [];
            }
            this.wordsByLetter[firstLetter].push(word.toLowerCase());
        }
        
        this.isLoaded = true;
        console.log('Loaded fallback word list');
    }

    isValidWord(word) {
        if (!this.isLoaded) {
            console.warn('Word validator not loaded yet');
            return false;
        }
        
        if (!word || typeof word !== 'string') {
            return false;
        }
        
        const cleanWord = word.toLowerCase().trim();
        
        // Basic validation
        if (cleanWord.length < 2) {
            return false;
        }
        
        // Check if word contains only letters
        if (!/^[a-z]+$/.test(cleanWord)) {
            return false;
        }
        
        return this.wordSet.has(cleanWord);
    }

    isValidConnection(previousWord, currentWord) {
        if (!previousWord || !currentWord) {
            return true; // First word or no previous word
        }
        
        const prevWord = previousWord.toLowerCase().trim();
        const currWord = currentWord.toLowerCase().trim();
        
        if (prevWord.length === 0) {
            return true;
        }
        
        const lastLetter = prevWord[prevWord.length - 1];
        const firstLetter = currWord[0];
        
        return lastLetter === firstLetter;
    }

    getWordsStartingWith(letter, difficulty = 'medium', maxResults = 50) {
        if (!this.isLoaded) {
            return [];
        }
        
        const lowerLetter = letter.toLowerCase();
        const words = this.wordsByLetter[lowerLetter] || [];
        
        if (words.length === 0) {
            return [];
        }
        
        let filteredWords;
        
        switch (difficulty) {
            case 'easy':
                // Prefer shorter, common words
                filteredWords = words.filter(word => word.length <= 7);
                break;
            case 'hard':
                // Prefer longer, less common words
                filteredWords = words.filter(word => word.length >= 5);
                break;
            default: // medium
                filteredWords = words;
                break;
        }
        
        // Shuffle and return limited results
        const shuffled = this._shuffleArray([...filteredWords]);
        return shuffled.slice(0, maxResults);
    }

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getRandomWord(difficulty = 'medium') {
        if (!this.isLoaded) {
            return null;
        }
        
        const allWords = Array.from(this.wordSet);
        let filteredWords;
        
        switch (difficulty) {
            case 'easy':
                filteredWords = allWords.filter(word => word.length >= 3 && word.length <= 6);
                break;
            case 'hard':
                filteredWords = allWords.filter(word => word.length >= 6);
                break;
            default: // medium
                filteredWords = allWords.filter(word => word.length >= 4 && word.length <= 8);
                break;
        }
        
        if (filteredWords.length === 0) {
            filteredWords = allWords;
        }
        
        return filteredWords[Math.floor(Math.random() * filteredWords.length)];
    }

    getWordScore(word) {
        if (!word || typeof word !== 'string') {
            return 0;
        }
        
        const cleanWord = word.toLowerCase().trim();
        let score = cleanWord.length; // Base score is word length
        
        // Bonus for less common letters
        const uncommonLetters = 'qxzjkwvyfbghmpuc';
        for (const letter of cleanWord) {
            if (uncommonLetters.includes(letter)) {
                score += 2;
            }
        }
        
        // Bonus for longer words
        if (cleanWord.length >= 7) {
            score += 3;
        } else if (cleanWord.length >= 5) {
            score += 1;
        }
        
        return score;
    }

    getHint(letter, usedWords = [], difficulty = 'medium') {
        if (!this.isLoaded) {
            return null;
        }
        
        const availableWords = this.getWordsStartingWith(letter, difficulty, 100);
        const unusedWords = availableWords.filter(word => 
            !usedWords.map(w => w.toLowerCase()).includes(word.toLowerCase())
        );
        
        if (unusedWords.length === 0) {
            return null;
        }
        
        // Return a random unused word as a hint
        return unusedWords[Math.floor(Math.random() * unusedWords.length)];
    }

    validateGameWord(word, previousWord, usedWords = []) {
        const result = {
            isValid: false,
            isValidWord: false,
            isValidConnection: false,
            isUsed: false,
            score: 0,
            message: ''
        };
        
        if (!word || typeof word !== 'string') {
            result.message = 'Please enter a word';
            return result;
        }
        
        const cleanWord = word.toLowerCase().trim();
        
        // Check if word is valid
        result.isValidWord = this.isValidWord(cleanWord);
        if (!result.isValidWord) {
            result.message = 'Not a valid word in the dictionary';
            return result;
        }
        
        // Check if word was already used
        result.isUsed = usedWords.map(w => w.toLowerCase()).includes(cleanWord);
        if (result.isUsed) {
            result.message = 'Word already used in this game';
            return result;
        }
        
        // Check connection to previous word
        result.isValidConnection = this.isValidConnection(previousWord, cleanWord);
        if (!result.isValidConnection) {
            const requiredLetter = previousWord ? previousWord[previousWord.length - 1].toUpperCase() : '';
            result.message = `Word must start with '${requiredLetter}'`;
            return result;
        }
        
        // Calculate score
        result.score = this.getWordScore(cleanWord);
        result.isValid = true;
        result.message = 'Valid word!';
        
        return result;
    }

    getAvailableLetters() {
        if (!this.isLoaded) {
            return [];
        }
        
        return Object.keys(this.wordsByLetter).sort();
    }

    getWordCount() {
        return this.wordSet.size;
    }

    hasWordsStartingWith(letter) {
        if (!this.isLoaded) {
            return false;
        }
        
        const lowerLetter = letter.toLowerCase();
        return this.wordsByLetter[lowerLetter] && this.wordsByLetter[lowerLetter].length > 0;
    }

    getWordStats() {
        if (!this.isLoaded) {
            return null;
        }
        
        const stats = {
            totalWords: this.wordSet.size,
            letterDistribution: {},
            averageLength: 0
        };
        
        let totalLength = 0;
        
        for (const [letter, words] of Object.entries(this.wordsByLetter)) {
            stats.letterDistribution[letter] = words.length;
        }
        
        for (const word of this.wordSet) {
            totalLength += word.length;
        }
        
        stats.averageLength = Math.round((totalLength / this.wordSet.size) * 10) / 10;
        
        return stats;
    }
}

// Create global instance
const wordValidator = new WordValidator();