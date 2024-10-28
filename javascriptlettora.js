let letters = getDailyLetters();  // Fetch new random letters each day at 12 AM PST
let timeLeft = 90;  // Game lasts 90 seconds
let score = 0;
let words = [];
let gameRunning = false;

// Function to start the game from the intro screen
function startGame() {
    document.getElementById("introScreen").style.display = "none"; // Hide intro screen
    document.getElementById("game").style.display = "flex"; // Show game screen
    gameRunning = true;
    document.getElementById("letters").textContent = letters.join(" "); // Display letters
    startTimer();
}

// Countdown timer function
function startTimer() {
    let timerInterval = setInterval(function() {
        if (timeLeft > 0 && gameRunning) {
            timeLeft--;
            document.getElementById("timer").textContent = `Time left: ${timeLeft}`;
        } else {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// Submit a word
async function submitWord() {
    if (!gameRunning) return;

    let wordInput = document.getElementById("wordInput");
    let word = wordInput.value.toLowerCase();
    
    // Check if word has already been used
    if (words.includes(word)) {
        wordInput.value = "";  // Clear input box
        return;
    }
    
    // Check if word is valid
    if (await isValidWord(word)) {
        score++;
        words.push(word);  // Add word to the list of used words
        
        // Create a new element for the word and add it to #wordsList
        let wordElement = document.createElement("p");
        wordElement.textContent = word;
        document.getElementById("wordsList").appendChild(wordElement);

        wordInput.value = "";  // Clear input box for next word
        wordInput.style.borderColor = "#4CAF50"; // Reset border to green for valid word
    } else {
        wordInput.style.borderColor = "red"; // Set border to red for invalid word
    }
}

// Validate the word using the Datamuse API
async function isValidWord(word) {
    if (!word.includes(letters[0].toLowerCase()) || !word.includes(letters[1].toLowerCase())) {
        return false;  // Word must contain both given letters
    }

    // Check word validity using the API
    const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
    const data = await response.json();

    // If the API returns a match, the word is valid
    return data.length > 0 && data[0].word === word;
}

// End the game and show the score popup
function endGame() {
    gameRunning = false;
    document.getElementById("finalScore").textContent = score;
    document.getElementById("endScreen").style.display = "flex"; // Show the end screen
}

// Close the end screen and return to the game view
function closeEndScreen() {
    document.getElementById("endScreen").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("introScreen").style.display = "flex"; // Return to intro screen
    resetGame();
}

// Reset game state for replay (for development or testing purposes)
function resetGame() {
    timeLeft = 90; // Reset the game timer to 90 seconds
    score = 0;
    words = [];
    document.getElementById("wordsList").innerHTML = ""; // Clear words list
    document.getElementById("timer").textContent = "Time left: 90"; // Reset timer display
    document.getElementById("wordInput").value = ""; // Clear input field
    document.getElementById("wordInput").style.borderColor = "#4CAF50"; // Reset input box color
}

// Event listener for Enter key to submit word
document.getElementById("wordInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent default behavior of Enter
        submitWord(); // Trigger word submission
    }
});

// Generate consistent random letters for everyone each day at 12 AM PST
function getDailyLetters() {
    const now = new Date();
    const pstOffset = -8; // PST is UTC-8
    const utcDate = new Date(now.getTime() + pstOffset * 60 * 60 * 1000); // Adjust to PST
    const dateSeed = utcDate.toISOString().split("T")[0]; // Use the date in PST as the seed

    // Hash function to create reproducible randomness
    let hash = 0;
    for (let i = 0; i < dateSeed.length; i++) {
        hash = dateSeed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate two consistent letters from the hash
    const letters = [
        String.fromCharCode(65 + (Math.abs(hash) % 26)),
        String.fromCharCode(65 + (Math.abs(hash * 2) % 26))
    ];

    return letters;
}
