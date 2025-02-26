// Game state variables
let letters = getDailyLetters();  // Use daily letters instead of random ones
let timeLeft = 60;
let score = 0;
let words = [];
let currentTheme = 0;
let gameRunning = false;
let manuallyExited = false;
let timerInterval;
let streak = parseInt(localStorage.getItem('gameStreak')) || 0;
let lastPlayDate = localStorage.getItem('lastPlayDate');
let todaysBest = parseInt(localStorage.getItem('todaysBest')) || 0;

const colorThemes = [
    { name: '🏖️ Beach', background: 'linear-gradient(120deg, #fdeb93 0%, #f5b785 100%)' },
    { name: '💼 PwC', background: 'linear-gradient(120deg, #ffffff 0%, #d35400 100%)' },
    { name: '🇲🇪 Montenegro', background: 'linear-gradient(120deg, #cb3f3f 0%, #ffe900 100%)' },
    { name: '🍂 Crunchy Leaves', background: 'linear-gradient(120deg, #ffcc80 0%, #d84315 100%)' },
    { name: '🥛 Doogh', background: 'linear-gradient(120deg, #e0f7fa 0%, #80deea 100%)' },
    { name: '🧚 Fairy Princess', background: 'linear-gradient(120deg, #d8bfd8 0%, #dda0dd 50%, #ee82ee 100%)' },
    { name: '🌌 Starry Night', background: 'linear-gradient(120deg, #ff9a9e 0%, #fad0c4 50%, #1a2a6c 100%)' },
    { name: '🍔 Burger Crush', background: 'linear-gradient(120deg, #ffcc33 0%, #d87d4a 33%, #a2c523 66%, #8c6138 100%)' }
];

// Wait for DOM to be fully loaded
window.onload = function() {
    updateHighScoreDisplay();
    initializeStreak();

    window.startGame = function() {
        resetGame();
        document.getElementById("introScreen").style.display = "none";
        document.getElementById("homeLogo").style.display = "none";
        document.getElementById("game").style.display = "flex";
        document.getElementById('streakDisplay').textContent = streak;
        gameRunning = true;

        const savedTheme = localStorage.getItem('preferredTheme');
        if (savedTheme !== null) {
            currentTheme = parseInt(savedTheme);
            const theme = colorThemes[currentTheme];
            document.body.style.background = theme.background;
        }

        // Display daily letters
        const lettersElement = document.getElementById("letters");
        lettersElement.innerHTML = letters.map(letter => 
            `<span class="letter">${letter}</span>`
        ).join(' ');

        document.getElementById("wordInput").focus();
        startTimer();
    };

    window.submitWord = async function() {
        if (!gameRunning) return;
    
        let input = document.getElementById("wordInput");
        let word = input.value.toLowerCase().trim();
    
        if (words.includes(word)) {
            showError("You've already used that word!");
            input.value = "";
            input.focus();
            return;
        }
    
        if (await isValidWord(word)) {
            score += calculateWordScore(word);
            document.getElementById("currentScore").textContent = `Score: ${score}`;
            document.getElementById("currentScore").style.animation = 'none';
            setTimeout(() => {
                document.getElementById("currentScore").style.animation = '';
            }, 10);
            words.push(word);
            displayWord(word);
            showWordPraise(word);
            checkSpecialWords(word);
            input.value = "";
            input.classList.remove("invalid");
        } else {
            input.classList.add("invalid");
            showError("Word not found in dictionary");
        }
    
        input.focus();
    };
    
    window.closeEndScreen = function() {
        document.getElementById("endScreen").style.display = "none";
        document.getElementById("game").style.display = "none";
        document.getElementById("introScreen").style.display = "flex";
        document.getElementById("homeLogo").style.display = "block";
    };

    document.getElementById("wordInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            submitWord();
        }
    });
};

// Validate the word using the Datamuse API and additional rules
async function isValidWord(word) {
    // Check if the word includes both required letters
    if (!word.includes(letters[0].toLowerCase()) || !word.includes(letters[1].toLowerCase())) {
        showPopupMessage("Word does not contain the 2 letters");  // New popup message
        return false;
    }

    // Check minimum word length
    if (word.length < 3) {
        showError("Word must be at least 3 letters long");
        return false;
    }

    // Check if word has already been used
    if (words.includes(word)) {
        showError("Word already used");
        return false;
    }

    // Check with the Datamuse API for word validity
    try {
        const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
        const data = await response.json();

        if (data.length > 0 && data[0].word === word) {
            return true;
        } else {
            showError("Word not found in dictionary");
            return false;
        }
    } catch (error) {
        console.error("API Error:", error);
        showError("Error checking word. Please try again.");
        return false;
    }
}

// Function to show a popup message
function showPopupMessage(message) {
    let popup = document.createElement("div");
    popup.className = "popupMessage";
    popup.textContent = message;

    // Style the popup message
    popup.style.position = "fixed";
    popup.style.top = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    popup.style.color = "white";
    popup.style.padding = "10px 20px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "1000";
    document.body.appendChild(popup);

    // Remove the popup after 2 seconds
    setTimeout(() => {
        popup.remove();
    }, 2000);
}

// Generate consistent daily letters with improved randomness
function getDailyLetters() {
    const now = new Date();
    const pstOffset = -8; // PST is UTC-8
    const pstDate = new Date(now.getTime() + pstOffset * 60 * 60 * 1000); // Adjust to PST
    const dateSeed = pstDate.toISOString().split("T")[0]; // Use the date in PST as the seed

    // Use a more robust hash function
    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = (hash * 31 + dateSeed.charCodeAt(i)) % 2147483647; // Prime multiplier for better distribution
    }

// Helper function to compute letter from index
const getLetter = (index) => String.fromCharCode(65 + index);

// Debug hash values and indices
const firstLetterIndex = ((hash % 26) + 26) % 26;
const secondLetterIndex = (((hash ^ (hash >> 5)) % 26) + 26) % 26;

console.log("Hash:", hash);
console.log("First Letter Index:", firstLetterIndex);
console.log("Second Letter Index:", secondLetterIndex);

const letters = [getLetter(firstLetterIndex), getLetter(secondLetterIndex)];

    return letters;
}

function showPopupMessage(message) {
    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

// Add this near the top with your other game state variables
function getWordOfDay() {
    const words = [
    "CUTE", "LOVE", "BEACH", "REACH", "IHATEWORK",
    "OMG", "GYM", "SWIMMING", "STEAK", "BUTT",
    "HEY", "MONTENEGRO", "POUND", "MONEY", "FRISBEE",
    "DANCE", "PROTEIN", "WALK", "ACCOUNTING", "OJ",
    "THRIFT STORE", "BLOOMS TD BATTLES 2", "AIDAN", 
    "BISCUITS AND MILK", "AUSTRIA", "CESAR SALAD", "STEAK", 
    "DIABETES", "POKEMON", "SMARTIES COOKIE", 
    "DUCK SITTING ON EARTH WATCHING TV", "PASULJ", 
    "COWS", "MOSQUE", "SATURDAY", "X0.5", "CATS IN WINDOWS"
];
    
    // Get the current date in UTC (or fixed PST timezone if you prefer)
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dateSeed = utcDate.toISOString().split("T")[0]; // Fixed date in YYYY-MM-DD format

    // Generate a hash from the date for consistent "Word of the Day"
    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = ((hash << 5) - hash) + dateSeed.charCodeAt(i);
        hash = hash & hash; // Keep the hash within bounds
    }

    // Select a word based on the hash
    return words[Math.abs(hash) % words.length];
}

function toggleWordOfDay() {
    const popup = document.getElementById('wordOfDayPopup');
    const word = getWordOfDay(); // Get the word of the day

    document.getElementById('dailyWord').textContent = word; // Update the word in the popup

    // Toggle visibility
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';

    // Hide the popup automatically after 3 seconds
    if (popup.style.display === 'block') {
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }
}

    const dailyWord = document.getElementById('dailyWord');
    if (!dailyWord) {
        const span = document.createElement('span');
        span.id = 'dailyWord';
        popup.appendChild(span);
    }
    
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
    } else {
        const word = getWordOfDay();
        document.getElementById('dailyWord').textContent = word;
        popup.style.display = 'block';
        
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }

function calculateWordScore(word) {
    return Math.max(1, Math.floor(word.length * 1.5));
}

function cycleTheme() {
    currentTheme = (currentTheme + 1) % colorThemes.length;
    const theme = colorThemes[currentTheme];
    
    // Apply the theme
    document.body.style.background = theme.background;
    
    // Show a little message
    showPopupMessage(theme.name);
    
    // Save preference
    localStorage.setItem('preferredTheme', currentTheme);
}

// Show success flash animation
function showSuccessFlash() {
    const flash = document.querySelector('.success-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 300);
    }
}

function checkSpecialWords(word) {
    const lowerWord = word.toLowerCase();
    
    // Check if the word contains "dina" and award bonus points
    if (lowerWord.includes('dina')) {
        score += 50;  // Add 50 bonus points
        document.getElementById("currentScore").textContent = `Score: ${score}`;
        showPopupMessage('💖 Found my name! +50 bonus points! 💖');
        
        // Add the sparkle animation to the score
        document.getElementById("currentScore").style.animation = 'none';
        setTimeout(() => {
            document.getElementById("currentScore").style.animation = '';
        }, 10);
    }
}

function updateStreak() {
    const today = new Date().toLocaleDateString();
    
    if (lastPlayDate !== today) {
        // It's a new day
        if (lastPlayDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastPlayDate !== yesterday.toLocaleDateString()) {
                // Streak broken - they missed a day
                streak = 1;
            } else {
                // Continued streak
                streak++;
            }
        } else {
            // First time playing
            streak = 1;
        }
        
        // Save the new date and streak
        localStorage.setItem('lastPlayDate', today);
        localStorage.setItem('gameStreak', streak);
    }
    
    // Update the display
    document.getElementById('streakDisplay').textContent = streak;
}

// Timer functions
function startTimer() {
    clearInterval(timerInterval);
    updateProgressBar(60);
    timerInterval = setInterval(function() {
        if (timeLeft > 0 && gameRunning) {
            timeLeft--;
            document.getElementById("timer").textContent = `Time left: ${timeLeft}`;
            updateProgressBar(timeLeft);
            if (timeLeft <= 10) {
                document.getElementById("timer").classList.add("timer-warning");
            }
        } else {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function updateProgressBar(timeRemaining) {
    const progress = (timeRemaining / 60) * 100;
    document.getElementById('timeProgress').style.transform = `scaleX(${progress / 100})`;
}

function showWordPraise(word) {
    if (word.length >= 10) {
        const longWordPraises = [
            "INCREDIBLE! 🎯🎯🎯",
            "WORD MASTER! 👑",
            "PHENOMENAL! 🌟✨💫",
            "VOCABULARY GENIUS! 🧠",
            "OUTSTANDING! 🏆",
            "SPECTACULAR! 🎪✨",
            "LEGENDARY! 🔥🔥🔥",
            "IMPRESSIVE! 🌈🌟",
            "EXTRAORDINARY! ⭐️🎯",
            "MAGNIFICENT! 🎉🎊",
            "BRILLIANT! 💫✨",
            "AMAZING FIND! 🎯💫",
            "WORDSMITH! 📚✨",
            "SPECTACULAR! 🌟🎨",
            "GENIUS LEVEL! 🧠💫",
            "TOP TIER WORD! 🏆✨",
            "MASTERFUL! 👑💫",
            "EXCEPTIONAL! 🌟🎯",
            "REMARKABLE! ⭐️🎉",
            "OUTSTANDING! 🔥💫"
        ];
        
        const message = longWordPraises[Math.floor(Math.random() * longWordPraises.length)];
        showPopupMessage(message);
    }
}

function showError(message) {
    let errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    setTimeout(() => errorDiv.textContent = "", 2000);
}

function returnToHome() {
    manuallyExited = true;  // Set flag to true when exiting manually
    document.getElementById("game").style.display = "none";       // Hide the game screen
    document.getElementById("introScreen").style.display = "flex"; // Show the home screen
    document.getElementById("homeLogo").style.display = "block";   // Ensure home logo is visible
    gameRunning = false;                                           // Stop the game if it’s running
}

function displayWord(word) {
    const wordElement = document.createElement("p");
    wordElement.textContent = word;
    const scoreSpan = document.createElement("span");
    const wordScore = calculateWordScore(word);
    scoreSpan.textContent = ` +${wordScore}`;
    scoreSpan.classList.add("score-popup"); // Add the class for animation
    scoreSpan.style.color = "var(--primary-color)";
    wordElement.appendChild(scoreSpan);
    document.getElementById("wordsList").appendChild(wordElement);
}

function updateHighScoreDisplay() {
    const highScore = localStorage.getItem("lettoraHighScore") || 0;
    const highScoreLetters = localStorage.getItem("lettoraHighScoreLetters") || "AB"; // Default letters if no high score is set yet
    document.getElementById('highScoreDisplay').textContent = highScore;
    document.getElementById('highScoreLetters').textContent = highScoreLetters;
}

async function endGame() {
    gameRunning = false;

    // Only display the score and other end-game elements if the game was not manually exited
    if (!manuallyExited) {
        document.getElementById("finalScore").textContent = score;

        // Check and update high score
        const currentHighScore = parseInt(localStorage.getItem("lettoraHighScore")) || 0;
        if (score > currentHighScore) {
            localStorage.setItem("lettoraHighScore", score.toString());
            localStorage.setItem("lettoraHighScoreLetters", letters.join('')); // Save the letters used
            createConfetti(); // Celebrate new high score
        }

        // Update today's best score
        const today = new Date().toLocaleDateString();
        if (localStorage.getItem('todaysBestDate') !== today) {
            // New day, reset best
            todaysBest = score;
            localStorage.setItem('todaysBestDate', today);
        } else if (score > todaysBest) {
            todaysBest = score;
        }
        localStorage.setItem('todaysBest', todaysBest.toString());
        document.getElementById("todaysBestScore").textContent = todaysBest;

        // Display final word list
        const finalWordList = document.getElementById("finalWordList");
        finalWordList.innerHTML = '';

        words.forEach(word => {
            const wordElement = document.createElement("p");
            const wordScore = calculateWordScore(word);
            wordElement.innerHTML = `${word} <span style="color: var(--primary-color)">+${wordScore}</span>`;
            finalWordList.appendChild(wordElement);
        });

        // Update streak - improved logic
        const lastPlayDate = localStorage.getItem('lastPlayDate');
        let streak = parseInt(localStorage.getItem('gameStreak')) || 0;
        
        if (lastPlayDate !== today) {
            // It's a new day
            if (lastPlayDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastPlayDate !== yesterday.toLocaleDateString()) {
                    // Streak broken - they missed a day
                    streak = 1;
                } else {
                    // Continued streak
                    streak++;
                }
            } else {
                // First time playing
                streak = 1;
            }
            
            // Save the new date and streak
            localStorage.setItem('lastPlayDate', today);
            localStorage.setItem('gameStreak', streak.toString());
        }
        
        // Always update the display
        document.getElementById('streakDisplay').textContent = streak;
        document.getElementById("endScreen").style.display = "flex";
    }

    // Reset the flag after ending the game
    manuallyExited = false;

    // Update the personal high score display
    updateHighScoreDisplay();
}

// Also update the resetGame function to properly show current high score
function resetGame() {
    timeLeft = 60; 
    score = 0;
    words = [];
    document.getElementById("wordsList").innerHTML = "";
    document.getElementById("timer").textContent = "Time left: 60";
    document.getElementById("timer").style.color = "#34495e";
    document.getElementById("timer").classList.remove("timer-warning");
    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").classList.remove("invalid");
    document.getElementById("errorMessage").textContent = "";
    document.getElementById("currentScore").textContent = "Score: 0";
    updateHighScoreDisplay(); // Make sure high score is displayed correctly
}

function initializeStreak() {
    const streak = parseInt(localStorage.getItem('gameStreak')) || 0;
    document.getElementById('streakDisplay').textContent = streak;
}

function createConfetti() {
    const colors = ['#4CAF50', '#45a049', '#2E7D32', '#A5D6A7'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';

        document.body.appendChild(confetti);

        const animation = confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.random() * 300 - 150}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 1000,
            easing: 'cubic-bezier(.25,.46,.45,.94)'
        });

        animation.onfinish = () => confetti.remove();
    }
}

function shareScore() {
    // Check if score and letters are defined and accessible
    console.log("Current Score:", score);  // Debugging check
    console.log("Letters:", letters);      // Debugging check

    // Use the current score (not the high score)
    const currentScore = score;
    const lettersText = letters.join('');  // Ensure letters array is converted to a string

    // Add performance emoji based on current score
    let performanceEmoji;
    if (currentScore < 50) performanceEmoji = "🌱";
    else if (currentScore < 100) performanceEmoji = "🌿";
    else if (currentScore < 150) performanceEmoji = "🌳";
    else if (currentScore < 200) performanceEmoji = "🏆";
    else performanceEmoji = "👑";

    // Create formatted share text without high score
    const shareText = `Dina's Word Game ${performanceEmoji}\n` +
        `Letters: ${lettersText}\n` +
        `Score: ${currentScore}`;
    
    const shareUrl = window.location.href;
    const fullShareText = shareText + "\nPlay at: " + shareUrl;

    // Use native sharing for mobile
    if (navigator.share) {
        navigator.share({
            title: "Dina's Word Game",
            text: fullShareText  // Pass the full text without specifying the URL separately
        }).catch(error => console.error("Error sharing:", error));
    } else {
        // Fallback for non-mobile devices or unsupported browsers
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Dina's Word Game")}&summary=${encodeURIComponent(shareText)}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent("Check out Dina's Word Game!")}&body=${encodeURIComponent(fullShareText)}`;

        // Replace button content with social media links for desktop
        document.getElementById("shareButton").innerHTML = `
            <a href="${twitterUrl}" target="_blank" style="color: #1DA1F2; margin-right: 10px;">Twitter</a>
            <a href="${facebookUrl}" target="_blank" style="color: #4267B2; margin-right: 10px;">Facebook</a>
            <a href="${linkedinUrl}" target="_blank" style="color: #0077B5; margin-right: 10px;">LinkedIn</a>
            <a href="${whatsappUrl}" target="_blank" style="color: #25D366; margin-right: 10px;">WhatsApp</a>
            <a href="${mailtoUrl}" style="color: #D44638;">Email</a>
        `;
    }
}
