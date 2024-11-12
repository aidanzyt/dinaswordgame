// Game state variables
let letters = getDailyLetters();  // Use daily letters instead of random ones
let timeLeft = 90;
let score = 0;
let words = [];
let currentTheme = 0;
let gameRunning = false;
let timerInterval;
let streak = parseInt(localStorage.getItem('gameStreak')) || 0;
let lastPlayDate = localStorage.getItem('lastPlayDate');
let todaysBest = parseInt(localStorage.getItem('todaysBest')) || 0;

const colorThemes = [
    { name: '🌸 Rose', background: 'linear-gradient(120deg, #ffffff 0%, #f7d7ff 100%)' },
    { name: '🌊 Ocean', background: 'linear-gradient(120deg, #ffffff 0%, #d7f0ff 100%)' },
    { name: '🌿 Mint', background: 'linear-gradient(120deg, #ffffff 0%, #d7fff0 100%)' },
    { name: '🍑 Peach', background: 'linear-gradient(120deg, #ffffff 0%, #ffeae0 100%)' },
    { name: '💜 Lavender', background: 'linear-gradient(120deg, #ffffff 0%, #e0e0ff 100%)' }
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
            document.getElementById("currentScore").textContent = `Score: ${score}`; // Add this line
            document.getElementById("currentScore").style.animation = 'none'; // Reset animation
            setTimeout(() => {
                document.getElementById("currentScore").style.animation = ''; // Restart animation
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

// Generate consistent daily letters
function getDailyLetters() {
    const now = new Date();
    const pstOffset = -8; // PST is UTC-8
    const utcDate = new Date(now.getTime() + pstOffset * 60 * 60 * 1000); // Adjust to PST
    const dateSeed = utcDate.toISOString().split("T")[0]; // Use the date in PST as the seed

    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = dateSeed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const letters = [
        String.fromCharCode(65 + (Math.abs(hash) % 26)),
        String.fromCharCode(65 + (Math.abs(hash * 2) % 26))
    ];

    return letters;
}

function showPopupMessage(message) {
    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
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
    updateProgressBar(90);
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
    const progress = (timeRemaining / 90) * 100;
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

    // Update the personal high score display
    updateHighScoreDisplay();
}

// Also update the resetGame function to properly show current high score
function resetGame() {
    timeLeft = 90; 
    score = 0;
    words = [];
    document.getElementById("wordsList").innerHTML = "";
    document.getElementById("timer").textContent = "Time left: 90";
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
