// Game state variables
let letters = getDailyLetters();  // Use daily letters instead of random ones
let timeLeft = 90;
let score = 0;
let words = [];
let gameRunning = false;
let timerInterval;

// Wait for DOM to be fully loaded
window.onload = function() {
    updateHighScoreDisplay();

    window.startGame = function() {
        resetGame();
        document.getElementById("introScreen").style.display = "none";
        document.getElementById("homeLogo").style.display = "none";
        document.getElementById("game").style.display = "flex";
        gameRunning = true;

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
    
        // Check if word has already been used
        if (words.includes(word)) {
            showError("You've already used that word!");
            input.value = "";
            input.focus();
            return;
        }
    
        // Validate word with Datamuse API
        if (await isValidWord(word)) {
            score += calculateWordScore(word); // Changed from score++
            words.push(word);
            displayWord(word);
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

function calculateWordScore(word) {
    return Math.max(1, Math.floor(word.length * 1.5));
}

// Show success flash animation
function showSuccessFlash() {
    const flash = document.querySelector('.success-flash');
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 300);
    }
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

function endGame() {
    gameRunning = false; // Stop the game
    document.getElementById("finalScore").textContent = score;

    // Display final word list
    const finalWordList = document.getElementById("finalWordList");
    finalWordList.innerHTML = ''; // Clear previous list

    // Display each word the player entered with its score
    words.forEach(word => {
        const wordElement = document.createElement("p");
        const wordScore = calculateWordScore(word);
        wordElement.innerHTML = `${word} <span style="color: var(--primary-color)">+${wordScore}</span>`;
        finalWordList.appendChild(wordElement);
    });

    document.getElementById("endScreen").style.display = "flex"; // Show the end screen

    // Check for a new high score and update it if applicable
    const highScore = localStorage.getItem("lettoraHighScore") || 0;
    if (score > highScore) {
        // Update high score in localStorage
        localStorage.setItem("lettoraHighScore", score);
        // Save the letters associated with the new high score
        localStorage.setItem("lettoraHighScoreLetters", letters.join("")); // Store current letters

        document.getElementById("finalScore").textContent += " (New High Score!)"; // Notify player of new high score
        createConfetti(); // Trigger confetti animation for celebration
    }

    // Update the high score display at the top of the screen with the new values
    updateHighScoreDisplay(); 
}

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
    updateHighScoreDisplay(); // Ensure high score display is updated each time
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
    const score = localStorage.getItem("lettoraHighScore") || 0;
    const letters = localStorage.getItem("lettoraHighScoreLetters") || "AB";
    const shareText = `I scored ${score} points in Dina's Word Game with letters ${letters}! Try to beat my score!`;
    const shareUrl = window.location.href; // Current page URL

    if (navigator.share) {
        // Native sharing on mobile devices
        navigator.share({
            title: "Dina's Word Game",
            text: shareText,
            url: shareUrl
        }).catch(console.error);
    } else {
        // Web-based share options for desktop or unsupported devices
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Dina's Word Game")}&summary=${encodeURIComponent(shareText)}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent("Check out Dina's Word Game!")}&body=${encodeURIComponent(shareText + " " + shareUrl)}`;

        // Display options as links in the share button
        document.getElementById("shareButton").innerHTML = `
            <a href="${twitterUrl}" target="_blank" style="color: #1DA1F2; margin-right: 10px;">Twitter</a>
            <a href="${facebookUrl}" target="_blank" style="color: #4267B2; margin-right: 10px;">Facebook</a>
            <a href="${linkedinUrl}" target="_blank" style="color: #0077B5; margin-right: 10px;">LinkedIn</a>
            <a href="${whatsappUrl}" target="_blank" style="color: #25D366; margin-right: 10px;">WhatsApp</a>
            <a href="${mailtoUrl}" style="color: #D44638;">Email</a>
        `;
    }
}
