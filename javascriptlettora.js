// Game state variables
let letters = getDailyLetters();
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
    { name: '🏛️ Vienna', background: 'linear-gradient(120deg, #f7f1e3 0%, #d4b483 45%, #c41e3a 100%)' },
    { name: '🍫 Nutella Cookies', background: 'linear-gradient(120deg, #4b2e23 0%, #6a4733 40%, #d7b899 100%)' },
    { name: '🃏 Cambio', background: 'linear-gradient(120deg, #0b3d0b 0%, #145214 40%, #3bb273 100%)' },
    { name: '🍹 Aperol Spritz', background: 'linear-gradient(120deg, #ff7e00 0%, #ff9f45 45%, #ffd1a1 100%)' },
    { name: '🧿 Evil Eye', background: 'linear-gradient(120deg, #001f54 0%, #00509d 35%, #00a6fb 70%, #e1f5fe 100%)' },
    { name: '💞 1 Year Anniversary', background: 'linear-gradient(120deg, #ffe5ec 0%, #ffd1dc 45%, #f7c6a3 100%)' },
    { name: '💼 Wealthsimple Premium', background: 'linear-gradient(120deg, #0f0f10 0%, #1b1b1c 55%, #d4af37 100%)' },
    { name: '🥟 Burek', background: 'linear-gradient(120deg, #f5d399 0%, #e8b979 45%, #c98f4a 100%)' }
];

window.onload = function() {
    updateHighScoreDisplay();
    initializeStreak();

    window.startGame = function() {
        resetGame();
        document.getElementById("introScreen").style.display = "none";
        document.getElementById("homeLogo").style.display = "none";
        document.getElementById("game").style.display = "flex";
        gameRunning = true;

        const savedTheme = localStorage.getItem('preferredTheme');
        if (savedTheme !== null) {
            currentTheme = parseInt(savedTheme);
            const theme = colorThemes[currentTheme];
            document.body.style.background = theme.background;
        }

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

async function isValidWord(word) {
    if (!word.includes(letters[0].toLowerCase()) || !word.includes(letters[1].toLowerCase())) {
        showPopupMessage("Word does not contain the 2 letters");
        return false;
    }

    if (word.length < 3) {
        showError("Word must be at least 3 letters long");
        return false;
    }

    if (words.includes(word)) {
        showError("Word already used");
        return false;
    }

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

function showPopupMessage(message) {
    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

function getDailyLetters() {
    const now = new Date();
    const pstOffset = -8;
    const pstDate = new Date(now.getTime() + pstOffset * 60 * 60 * 1000);
    const dateSeed = pstDate.toISOString().split("T")[0];

    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = (hash * 31 + dateSeed.charCodeAt(i)) % 2147483647;
    }

    const getLetter = (index) => String.fromCharCode(65 + index);

    const firstLetterIndex = ((hash % 26) + 26) % 26;
    const secondLetterIndex = (((hash ^ (hash >> 5)) % 26) + 26) % 26;

    console.log("Hash:", hash);
    console.log("First Letter Index:", firstLetterIndex);
    console.log("Second Letter Index:", secondLetterIndex);

    const letters = [getLetter(firstLetterIndex), getLetter(secondLetterIndex)];

    return letters;
}

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
    
    const now = new Date();
    const utcDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dateSeed = utcDate.toISOString().split("T")[0];

    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = ((hash << 5) - hash) + dateSeed.charCodeAt(i);
        hash = hash & hash;
    }

    return words[Math.abs(hash) % words.length];
}

function toggleWordOfDay() {
    const popup = document.getElementById('wordOfDayPopup');
    const word = getWordOfDay();

    document.getElementById('dailyWord').textContent = word;

    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';

    if (popup.style.display === 'block') {
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }
}

function calculateWordScore(word) {
    return Math.max(1, Math.floor(word.length * 1.5));
}

function cycleTheme() {
    currentTheme = (currentTheme + 1) % colorThemes.length;
    const theme = colorThemes[currentTheme];
    
    document.body.style.background = theme.background;
    
    showPopupMessage(theme.name);
    
    localStorage.setItem('preferredTheme', currentTheme);
}

function showSuccessFlash() {
    const flash = document.querySelector('.success-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 300);
    }
}

function checkSpecialWords(word) {
    const lowerWord = word.toLowerCase();
    
    if (lowerWord.includes('dina')) {
        score += 50;
        document.getElementById("currentScore").textContent = `Score: ${score}`;
        showPopupMessage('💖 Found my name! +50 bonus points! 💖');
        
        document.getElementById("currentScore").style.animation = 'none';
        setTimeout(() => {
            document.getElementById("currentScore").style.animation = '';
        }, 10);
    }
}

function updateStreak() {
    const today = new Date().toLocaleDateString();
    
    if (lastPlayDate !== today) {
        if (lastPlayDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastPlayDate !== yesterday.toLocaleDateString()) {
                streak = 1;
            } else {
                streak++;
            }
        } else {
            streak = 1;
        }
        
        localStorage.setItem('lastPlayDate', today);
        localStorage.setItem('gameStreak', streak);
    }
}

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
    manuallyExited = true;
    document.getElementById("game").style.display = "none";
    document.getElementById("introScreen").style.display = "flex";
    document.getElementById("homeLogo").style.display = "block";
    gameRunning = false;
}

function displayWord(word) {
    const wordElement = document.createElement("p");
    wordElement.textContent = word;
    const scoreSpan = document.createElement("span");
    const wordScore = calculateWordScore(word);
    scoreSpan.textContent = ` +${wordScore}`;
    scoreSpan.classList.add("score-popup");
    scoreSpan.style.color = "var(--primary-color)";
    wordElement.appendChild(scoreSpan);
    document.getElementById("wordsList").appendChild(wordElement);
}

function updateHighScoreDisplay() {
    const highScore = localStorage.getItem("lettoraHighScore") || 0;
    const highScoreLetters = localStorage.getItem("lettoraHighScoreLetters") || "AB";
    if (document.getElementById('highScoreDisplay')) {
        document.getElementById('highScoreDisplay').textContent = highScore;
    }
    if (document.getElementById('highScoreLetters')) {
        document.getElementById('highScoreLetters').textContent = highScoreLetters;
    }
}

// --- SAVE SCORE (if signed in) & LOAD LEADERBOARD ---
(async () => {
  try {
    // Save (won’t save if not signed in)
    if (window._dwgSaveScoreToCloud) {
      await window._dwgSaveScoreToCloud(score, letters);
    }

    // Always load the leaderboard (read is public)
    if (window._dwgLoadLeaderboard) {
      await window._dwgLoadLeaderboard(letters);
    }
  } catch (e) {
    console.error('Leaderboard/Save error:', e);
    const listEl = document.getElementById('dailyLeaderboard');
    if (listEl) listEl.innerHTML = `<div style="color:#c00;">Error loading leaderboard: ${e.code || e.message}</div>`;
  }
})();

async function endGame() {
    gameRunning = false;

    if (!manuallyExited) {
        document.getElementById("finalScore").textContent = score;

        const currentHighScore = parseInt(localStorage.getItem("lettoraHighScore")) || 0;
        if (score > currentHighScore) {
            localStorage.setItem("lettoraHighScore", score.toString());
            localStorage.setItem("lettoraHighScoreLetters", letters.join(''));
            createConfetti();
        }

        const today = new Date().toLocaleDateString();
        if (localStorage.getItem('todaysBestDate') !== today) {
            todaysBest = score;
            localStorage.setItem('todaysBestDate', today);
        } else if (score > todaysBest) {
            todaysBest = score;
        }
        localStorage.setItem('todaysBest', todaysBest.toString());
        document.getElementById("todaysBestScore").textContent = todaysBest;

        const finalWordList = document.getElementById("finalWordList");
        finalWordList.innerHTML = '';

        words.forEach(word => {
            const wordElement = document.createElement("p");
            const wordScore = calculateWordScore(word);
            wordElement.innerHTML = `${word} <span style="color: var(--primary-color)">+${wordScore}</span>`;
            finalWordList.appendChild(wordElement);
        });

        const lastPlayDate = localStorage.getItem('lastPlayDate');
        let streak = parseInt(localStorage.getItem('gameStreak')) || 0;
        
        if (lastPlayDate !== today) {
            if (lastPlayDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastPlayDate !== yesterday.toLocaleDateString()) {
                    streak = 1;
                } else {
                    streak++;
                }
            } else {
                streak = 1;
            }
            
            localStorage.setItem('lastPlayDate', today);
            localStorage.setItem('gameStreak', streak.toString());
        }
        
        document.getElementById("endScreen").style.display = "flex";
    }

    manuallyExited = false;
    updateHighScoreDisplay();

    try {
        const res = await (window._dwgSaveScoreToCloud ? window._dwgSaveScoreToCloud(score, letters) : Promise.resolve({saved:false}));
        if (res && res.saved) {
          showPopupMessage('✅ Score saved!');
        } else {
          const endBtn = document.getElementById('endSignIn');
          if (endBtn) endBtn.style.display = '';
        }
    } catch(e) { console.error('Cloud save failed', e); }

    try {
        if (window._dwgLoadLeaderboard) {
          await window._dwgLoadLeaderboard(letters);
        }
    } catch(e) { console.error('Load leaderboard failed', e); }
}

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
    updateHighScoreDisplay();
}

function initializeStreak() {
    const streak = parseInt(localStorage.getItem('gameStreak')) || 0;
    if (document.getElementById('streakDisplay')) {
        document.getElementById('streakDisplay').textContent = streak;
    }
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
    console.log("Current Score:", score);
    console.log("Letters:", letters);

    const currentScore = score;
    const lettersText = letters.join('');

    let performanceEmoji;
    if (currentScore < 50) performanceEmoji = "🌱";
    else if (currentScore < 100) performanceEmoji = "🌿";
    else if (currentScore < 150) performanceEmoji = "🌳";
    else if (currentScore < 200) performanceEmoji = "🏆";
    else performanceEmoji = "👑";

    const shareText = `Dina's Word Game ${performanceEmoji}\n` +
        `Letters: ${lettersText}\n` +
        `Score: ${currentScore}`;
    
    const shareUrl = window.location.href;
    const fullShareText = shareText + "\nPlay at: " + shareUrl;

    if (navigator.share) {
        navigator.share({
            title: "Dina's Word Game",
            text: fullShareText
        }).catch(error => console.error("Error sharing:", error));
    } else {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Dina's Word Game")}&summary=${encodeURIComponent(shareText)}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent("Check out Dina's Word Game!")}&body=${encodeURIComponent(fullShareText)}`;

        document.getElementById("shareButton").innerHTML = `
            <a href="${twitterUrl}" target="_blank" style="color: #1DA1F2; margin-right: 10px;">Twitter</a>
            <a href="${facebookUrl}" target="_blank" style="color: #4267B2; margin-right: 10px;">Facebook</a>
            <a href="${linkedinUrl}" target="_blank" style="color: #0077B5; margin-right: 10px;">LinkedIn</a>
            <a href="${whatsappUrl}" target="_blank" style="color: #25D366; margin-right: 10px;">WhatsApp</a>
            <a href="${mailtoUrl}" style="color: #D44638;">Email</a>
        `;
    }
}

