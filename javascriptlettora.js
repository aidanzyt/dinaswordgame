<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Dina's Word Game</title>
        <script>
            window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments) };
            va('pageview');
            </script>
        <script>
            !function(t,e){var n=void 0!==t.self&&t.self.location&&"https:"===t.self.location.protocol,o=e.createElement("script");o.src="/_vercel/insights/script.js".concat(n?"":""),o.defer=!0,o.setAttribute("data-sdkn","@vercel/analytics"),o.setAttribute("data-sdkv","1.1.1"),(e.head||e.body).appendChild(o)}(window,document);
            </script>
        <link rel="icon" href="favicon.ico" type="image/x-icon">
        <link rel="icon" type="image/png" href="favicon.png" sizes="32x32">
        <link rel="icon" type="image/svg+xml" href="favicon.svg">
        <link rel="apple-touch-icon" href="favicon.png">        
    <style>
        :root {
            --primary-color: #4CAF50;
            --primary-dark: #45a049;
            --background: #f0f2f5;
            --card-bg: #ffffff;
            --text-primary: #2c3e50;
            --text-secondary: #34495e;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--background);
            min-height: 100vh;
            height: 100%; /* Add this */
            width: 100%;
            overflow: hidden; /* Change from overflow-x: hidden */
            display: flex;
            justify-content: center;
            align-items: center;
            position: fixed; /* Add this */
            touch-action: none; /* Add this */
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(120deg, #ffffff 0%, #f7d7ff 0%);
            opacity: 0.3;
            z-index: -1;
            animation: gradientBG 15s ease infinite;
            background-size: 200% 200%;
        }

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            height: 100vh; /* Change from min-height to height */
            width: 100%;
            overflow: hidden; /* Add this */
        }

        .logo {
            width: min(200px, 80%);
            height: auto;
            margin: 20px 0;
        }

        #homeLogo {
            position: absolute;
            top: 100px; /* Adjust as necessary */
            left: 50%;
            transform: translateX(-50%);
        }

        .theme-button {
    cursor: pointer;
    padding: 5px;
    transition: opacity 0.2s;
}

.theme-button:hover {
    opacity: 0.7;
}

        .intro-container, .game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            width: 90%;
            max-width: 600px;
            padding: 10px;
            margin: auto;
            margin-top: 250px;
        }

        .game-container {
            display: none;
            padding: 30px;
            border-radius: 20px;
            background: var(--card-bg);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            width: min(600px, 95%);
            margin-top: 70px;
        }

        h1 {
            font-size: clamp(24px, 5vw, 36px);
            color: var(--text-primary);
            margin-bottom: 15px;
        }

        p {
            font-size: clamp(16px, 3vw, 18px);
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .play-button, #submitButton {
            font-size: clamp(16px, 3vw, 20px);
            padding: 15px 40px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px 0;
            width: min(300px, 80%);
        }

        .play-button:hover, #submitButton:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
        }

        #letters {
            font-size: clamp(48px, 15vw, 72px);
            color: var(--text-primary);
            font-weight: bold;
            margin: 20px 0;
            letter-spacing: 0.1em;
        }

        #timer {
            font-size: clamp(18px, 4vw, 24px);
            color: var(--text-secondary);
            margin: 10px 0;
        }

        .word-of-day-popup {
    position: fixed;
    top: 40px;  /* Adjust this to position it where you want it */
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 15px;
    border-radius: 15px;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: none;
    white-space: nowrap;
    z-index: 1001; /* Make sure it's above other elements */
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

        .progress-container {
            width: 90%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            margin: 15px 0;
            overflow: hidden;
        }

        .progress-bar {
            width: 100%;
            height: 100%;
            background: var(--primary-color);
            transform-origin: left;
            transition: transform 1s linear;
        }

        #wordInput {
            font-size: clamp(16px, 3vw, 20px);
            padding: 15px;
            width: min(400px, 90%);
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            margin: 10px 0;
        }

        #wordInput:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        #wordInput.invalid {
            border-color: #ff4757;
            background-color: #ffe6e6;
        }

        #errorMessage {
            color: #ff4757;
            font-size: clamp(14px, 2vw, 16px);
            min-height: 20px;
            margin: 5px 0;
        }

        #wordsList {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            width: 100%;
            padding: 10px;
            margin-top: 20px;
        }

        #wordsList p {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 10px;
            margin: 0;
            font-size: clamp(14px, 2vw, 16px);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .high-score {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 100;
        }

        #endScreen {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .popup {
            background: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 90%;
            width: 400px;
        }

        .popup button {
            font-size: 18px;
            padding: 12px 30px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
        }

        #wordsList {
        max-height: 30vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 20px;
    }

        @media (max-width: 480px) {
            .container {
                padding: 10px;
        }

            .high-score {
                top: auto;
                bottom: 20px;
        }

            .game-container {
                padding: 20px;
                max-height: 100vh;
                overflow: hidden;
        }

}
        .timer-warning {
            color: #ff4757 !important;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        #wordsList p {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 10px;
            margin: 0;
            font-size: clamp(14px, 2vw, 16px);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        @keyframes scorePopup {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .score-popup {
            margin-left: 8px;
            color: var(--primary-color);
            font-weight: bold;
            animation: scorePopup 0.3s ease;
        }
        #wordSummary {
    margin: 20px 0;
    max-height: 200px;
    overflow-y: auto;
    width: 100%;
}

#finalWordList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    padding: 10px;
}

#finalWordList p {
    background: #f8f9fa;
    padding: 8px;
    border-radius: 8px;
    margin: 0;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.popup {
    max-height: 80vh;
    overflow-y: auto;
}

.score-display {
    font-size: clamp(18px, 4vw, 24px);
    color: var(--primary-color);
    font-weight: bold;
    margin: 10px 0;
    animation: scoreUpdate 0.3s ease;
}

@keyframes scoreUpdate {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.popup-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 20px;
    animation: floatUp 1.5s ease-out;
    z-index: 1000;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
}

@keyframes floatUp {
    0% { opacity: 0; transform: translate(-50%, -40%); }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, -60%); }
}

.theme-counter {
    position: fixed;
    top: 100px;  /* Position it below streak counter */
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 100;
    cursor: pointer;
    transition: opacity 0.2s;
}

.theme-counter:hover {
    opacity: 0.8;
}

@media (max-width: 480px) {
    .theme-counter {
        top: auto;
        bottom: 100px;  /* Position above streak counter on mobile */
    }
}

#shareButton {
    font-size: 18px;
    padding: 12px 30px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.3s ease;
}

.streak-counter {
    position: fixed;
    top: 60px;  /* Position it below the high score */
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 100;
}

#gameHeader {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
}

#gameHeader button {
    padding: 5px 10px;
    background-color: #ffcccc;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

@media (max-width: 480px) {
    .streak-counter {
        top: auto;
        bottom: 60px;  /* Position above the high score on mobile */
    }
}
#shareButton:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
}

    </style>
</head>
<body>
    <div class="success-flash"></div>
    <div class="high-score">High Score: <span id="highScoreDisplay">0</span> with letters <span id="highScoreLetters">AB</span></div>
    <div class="streak-counter">
        <span>🔥 Daily Streak: <span id="streakDisplay">0</span></span>
    </div>
    <div class="theme-counter">
        <span class="theme-button" onclick="cycleTheme()">🎨 Theme</span>
    </div>
    <div class="container">
        <img src="dinas-word-game-small.svg" alt="DWG Logo" id="homeLogo" class="logo"onclick="toggleWordOfDay()">
        <div id="wordOfDayPopup" class="word-of-day-popup">
            Word of the Day: <span id="dailyWord"></span> ✨
        </div>
        <div class="intro-container" id="introScreen">
            <h1>Welcome to Dina's <br> Word Game!</h1>
            <p>Create as many words as possible using the two letters.<br>You have 90 seconds to play.</p>
            <button class="play-button" onclick="startGame()">Play</button>
        </div>

        <div id="game" class="game-container">
            <h1 id="letters">AB</h1>
            <p id="timer">Time left: 90</p>
            <p id="currentScore" class="score-display">Score: 0</p>
            <div class="progress-container">
                <div class="progress-bar" id="timeProgress"></div>
            </div>
            <div id="gameHeader">
                <button onclick="returnToHome()">🏠 Return to Home</button>
            </div>            
            <input type="text" id="wordInput" placeholder="Enter word" autocomplete="off">
            <div id="errorMessage"></div>
            <button id="submitButton" onclick="submitWord()">Submit</button>
            <div id="wordsList"></div>
        </div>

        <div id="endScreen">
            <div class="popup">
                <h2>Game Over!</h2>
                <p>Your Score: <span id="finalScore"></span></p>
                <p>Today's Best: <span id="todaysBestScore">0</span></p>
                <div id="wordSummary">
                    <h3>Your Words:</h3>
                    <div id="finalWordList"></div>
                </div>
                <button onclick="closeEndScreen()">Play Again</button>
                <button id="shareButton" onclick="shareScore()">Share Your Score</button>
            </div>
        </div>
    </div>
    <script src="javascriptlettora.js"></script>
</body>
</html>
