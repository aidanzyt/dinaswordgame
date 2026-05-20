// =========================================================
// DINA'S WORD GAME — Improved game logic
// =========================================================

// ===== State =====
let letters = getDailyLetters();
let timeLeft = 60;
let score = 0;
let words = [];
let currentTheme = 0;
let gameRunning = false;
let isPaused = false;
let manuallyExited = false;
let timerInterval;
let comboCount = 0;
let comboMultiplier = 1;
let comboDecayTimer = null;
let comboTimeRemaining = 0;
let comboMaxTime = 6000;
let soundEnabled = true;
let hintUsed = false;
let streak = parseInt(localStorage.getItem('gameStreak')) || 0;
let lastPlayDate = localStorage.getItem('lastPlayDate');
let todaysBest = parseInt(localStorage.getItem('todaysBest')) || 0;

// ===== Scrabble-style letter points =====
const LETTER_POINTS = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,
  K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,
  U:1,V:4,W:4,X:8,Y:4,Z:10
};

// ===== Themes (editorial palettes) =====
const colorThemes = [
  { name: '☕ Cafe', bg: '#F5EFE4',  primary: '#2E7D5B', accent: '#E8784A', cardBg: '#FFFCF6' },
  { name: '🌊 Coastal', bg: '#E8F0F2',  primary: '#2C5F7D', accent: '#E89B4A', cardBg: '#FAFCFD' },
  { name: '🌅 Sunset', bg: '#FBE8DC',  primary: '#A8385E', accent: '#E85A2B', cardBg: '#FFF8F2' },
  { name: '🌿 Forest', bg: '#E8EFE2',  primary: '#3A6B3E', accent: '#C97843', cardBg: '#FBFCF8' },
  { name: '🌌 Midnight', bg: '#1A1F2C',  primary: '#7BB3FF', accent: '#FFB677', cardBg: '#252B3A',
    textPrimary: '#F5EFE4', textSecondary: '#A8B0C4', textMuted: '#6A7280', borderSoft: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.18)' },
  { name: '🃏 Cambio', bg: '#E8F2EB',  primary: '#166D16', accent: '#3DBF78', cardBg: '#F8FBF9' },
  { name: '🍫 Nutella', bg: '#F0E2D2',  primary: '#5A392C', accent: '#C8A981', cardBg: '#FAF3E8' },
  { name: '🧿 Evil Eye', bg: '#E3F4FD',  primary: '#003F91', accent: '#0095EB', cardBg: '#F4FAFE' },
  { name: '💞 Anniversary', bg: '#FBE6EC',  primary: '#A8385E', accent: '#F1B48D', cardBg: '#FEF6F8' }
];

// ===== Web Audio (subtle SFX, no files needed) =====
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  return audioCtx;
}

function playTone(freq, duration = 0.08, type = 'sine', volume = 0.08) {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function sfxSuccess(tier) {
  if (tier === 'legendary') {
    playTone(523, 0.08, 'triangle', 0.1);
    setTimeout(() => playTone(659, 0.08, 'triangle', 0.1), 80);
    setTimeout(() => playTone(784, 0.15, 'triangle', 0.1), 160);
  } else if (tier === 'rare') {
    playTone(523, 0.08, 'triangle', 0.09);
    setTimeout(() => playTone(659, 0.12, 'triangle', 0.09), 70);
  } else if (tier === 'great') {
    playTone(523, 0.1, 'sine', 0.08);
  } else {
    playTone(440, 0.06, 'sine', 0.06);
  }
}

function sfxFail() { playTone(150, 0.12, 'square', 0.05); }
function sfxTick() { playTone(880, 0.04, 'sine', 0.04); }
function sfxGameEnd() {
  playTone(440, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(349, 0.15, 'sine', 0.08), 100);
  setTimeout(() => playTone(293, 0.2, 'sine', 0.08), 250);
}

// ===== Init =====
window.onload = function() {
  updateHighScoreDisplay();
  initializeStreak();
  renderIntroLetters();
  loadSoundPref();
  applyTheme(getInitialTheme(), false);

  window.startGame = function() {
    // Resume audio context (autoplay policy)
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    resetGame();
    document.getElementById("introScreen").style.display = "none";
    document.getElementById("game").style.display = "flex";
    gameRunning = true;
    isPaused = false;
    document.getElementById("pauseOverlay").style.display = "none";

    renderLetterTiles();
    document.getElementById("wordInput").focus();
    startTimer();
  };

  window.submitWord = async function() {
    if (!gameRunning || isPaused) return;

    const input = document.getElementById("wordInput");
    const word = input.value.toLowerCase().trim();

    if (!word) return;

    if (words.includes(word)) {
      showError("You've already used that word");
      sfxFail();
      input.classList.add("invalid");
      setTimeout(() => input.classList.remove("invalid"), 400);
      return;
    }

    if (await isValidWord(word)) {
      const baseScore = calculateWordScore(word);
      const tier = getWordTier(word, baseScore);
      const finalPoints = Math.round(baseScore * comboMultiplier);

      score += finalPoints;
      words.push(word);
      bumpCombo();
      updateScoreDisplay();
      displayWord(word, finalPoints, tier);
      showWordPraise(word, tier);
      checkSpecialWords(word);
      sfxSuccess(tier);

      input.value = "";
      input.classList.remove("invalid");
    } else {
      sfxFail();
      input.classList.add("invalid");
      breakCombo();
      setTimeout(() => input.classList.remove("invalid"), 400);
    }

    input.focus();
  };

  window.closeEndScreen = function() {
    document.getElementById("endScreen").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("introScreen").style.display = "flex";
  };

  document.getElementById("wordInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") submitWord();
  });
};

// ===== Word validation =====
async function isValidWord(word) {
  if (!word.includes(letters[0].toLowerCase()) || !word.includes(letters[1].toLowerCase())) {
    showError(`Word must contain both "${letters[0]}" and "${letters[1]}"`);
    return false;
  }

  if (word.length < 3) {
    showError("Word must be at least 3 letters");
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
    showError("Error checking word. Try again.");
    return false;
  }
}

// ===== Scoring =====
function calculateWordScore(word) {
  // Base: sum of letter values, length bonus
  const letterScore = word.toUpperCase().split('').reduce((sum, l) => sum + (LETTER_POINTS[l] || 1), 0);
  const lengthBonus = word.length >= 5 ? (word.length - 4) * 2 : 0;
  return letterScore + lengthBonus;
}

function getWordTier(word, score) {
  if (word.length >= 9 || score >= 25) return 'legendary';
  if (word.length >= 7 || score >= 15) return 'rare';
  if (word.length >= 5 || score >= 10) return 'great';
  return 'good';
}

// ===== Combo system =====
function bumpCombo() {
  comboCount++;
  comboMultiplier = Math.min(3, 1 + Math.floor(comboCount / 3) * 0.5);
  comboTimeRemaining = comboMaxTime;
  showCombo();
  startComboDecay();
}

function breakCombo() {
  comboCount = 0;
  comboMultiplier = 1;
  hideCombo();
  if (comboDecayTimer) {
    clearInterval(comboDecayTimer);
    comboDecayTimer = null;
  }
}

function showCombo() {
  const meter = document.getElementById("comboMeter");
  meter.classList.add("active");
  document.getElementById("comboMultiplier").textContent = `×${comboMultiplier.toFixed(1)}`;
  updateComboBar();
}

function hideCombo() {
  document.getElementById("comboMeter").classList.remove("active");
}

function updateComboBar() {
  const pct = (comboTimeRemaining / comboMaxTime) * 100;
  document.getElementById("comboBarFill").style.width = `${pct}%`;
}

function startComboDecay() {
  if (comboDecayTimer) clearInterval(comboDecayTimer);
  comboDecayTimer = setInterval(() => {
    if (isPaused || !gameRunning) return;
    comboTimeRemaining -= 100;
    if (comboTimeRemaining <= 0) {
      breakCombo();
    } else {
      updateComboBar();
    }
  }, 100);
}

// ===== Display helpers =====
function renderLetterTiles() {
  const container = document.getElementById("letterTiles");
  container.innerHTML = '';
  letters.forEach(letter => {
    const tile = document.createElement('div');
    tile.className = 'letter-tile';
    tile.textContent = letter;
    const pts = LETTER_POINTS[letter.toUpperCase()] || 1;
    tile.setAttribute('data-points', pts);
    container.appendChild(tile);
  });
}

function renderIntroLetters() {
  const container = document.getElementById('introLetters');
  if (!container) return;
  container.innerHTML = '';
  letters.forEach(letter => {
    const tile = document.createElement('div');
    tile.className = 'letters-preview-tile';
    tile.textContent = letter;
    container.appendChild(tile);
  });
}

function updateScoreDisplay() {
  const el = document.getElementById("currentScore");
  el.textContent = score;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'scoreUpdate 0.3s ease';
}

function displayWord(word, points, tier) {
  const list = document.getElementById("wordsList");
  const chip = document.createElement("div");
  chip.className = `word-chip tier-${tier}`;

  // Highlight key letters
  const l1 = letters[0].toLowerCase();
  const l2 = letters[1].toLowerCase();
  const highlighted = word.split('').map(ch => {
    if (ch === l1 || ch === l2) return `<span class="key-letter">${ch}</span>`;
    return ch;
  }).join('');

  chip.innerHTML = `<span>${highlighted}</span><span class="points">+${points}</span>`;
  list.insertBefore(chip, list.firstChild);
}

// ===== Praise / Bonuses =====
function showPopupMessage(message, tier) {
  const popup = document.createElement('div');
  popup.className = 'popup-message';
  if (tier) popup.classList.add(`tier-${tier}`);
  popup.textContent = message;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1800);
}

function showWordPraise(word, tier) {
  if (tier === 'legendary') {
    const messages = ['LEGENDARY!', 'INCREDIBLE!', 'WORD MASTER!', 'PHENOMENAL!', 'EXTRAORDINARY!'];
    showPopupMessage(messages[Math.floor(Math.random() * messages.length)], 'legendary');
  } else if (tier === 'rare') {
    const messages = ['Excellent!', 'Brilliant!', 'Impressive!', 'Top tier!'];
    showPopupMessage(messages[Math.floor(Math.random() * messages.length)]);
  }
}

function checkSpecialWords(word) {
  const lower = word.toLowerCase();
  if (lower.includes('dina')) {
    score += 50;
    updateScoreDisplay();
    showPopupMessage('💖 Found Dina! +50 bonus 💖', 'legendary');
  }
}

// ===== Hint =====
async function useHint() {
  if (!gameRunning || isPaused) return;
  if (hintUsed) {
    showError("Hint already used this game");
    return;
  }
  if (timeLeft <= 6) {
    showError("Not enough time for a hint");
    return;
  }

  // Cost: 5 seconds
  timeLeft = Math.max(1, timeLeft - 5);
  document.getElementById("timer-value").textContent = timeLeft;
  hintUsed = true;
  document.getElementById("hintBtn").style.opacity = 0.4;
  document.getElementById("hintBtn").disabled = true;

  // Get a valid word that contains both letters
  try {
    // Try common 4-letter words first
    const seedLetters = letters.join('').toLowerCase();
    const url = `https://api.datamuse.com/words?sp=*${letters[0].toLowerCase()}*${letters[1].toLowerCase()}*&max=20`;
    const res1 = await fetch(url);
    const data1 = await res1.json();

    const url2 = `https://api.datamuse.com/words?sp=*${letters[1].toLowerCase()}*${letters[0].toLowerCase()}*&max=20`;
    const res2 = await fetch(url2);
    const data2 = await res2.json();

    const candidates = [...data1, ...data2]
      .map(w => w.word)
      .filter(w => /^[a-z]+$/.test(w) && w.length >= 4 && w.length <= 7 && !words.includes(w));

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const firstLetter = chosen[0].toUpperCase();
      const lenInfo = `${chosen.length} letters`;
      showPopupMessage(`Try a ${lenInfo} word starting with "${firstLetter}"`);
    } else {
      showPopupMessage('No hint found — keep trying!');
    }
  } catch (e) {
    showPopupMessage('Hint unavailable right now');
  }
}

// ===== Sound toggle =====
function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("soundBtn");
  btn.textContent = soundEnabled ? '🔊' : '🔇';
  localStorage.setItem('soundEnabled', soundEnabled ? '1' : '0');
  if (soundEnabled) playTone(660, 0.06, 'sine', 0.07);
}

function loadSoundPref() {
  const stored = localStorage.getItem('soundEnabled');
  if (stored === '0') {
    soundEnabled = false;
    const btn = document.getElementById("soundBtn");
    if (btn) btn.textContent = '🔇';
  }
}

// ===== Pause =====
function togglePause() {
  if (!gameRunning) return;
  isPaused = !isPaused;
  document.getElementById("pauseOverlay").style.display = isPaused ? "flex" : "none";
  if (!isPaused) document.getElementById("wordInput").focus();
}

// ===== Timer =====
function startTimer() {
  clearInterval(timerInterval);
  updateProgressBar(60);
  timerInterval = setInterval(function() {
    if (isPaused) return;
    if (timeLeft > 0 && gameRunning) {
      timeLeft--;
      document.getElementById("timer-value").textContent = timeLeft;
      updateProgressBar(timeLeft);
      if (timeLeft <= 10) {
        document.getElementById("timer-value").classList.add("timer-warning");
        document.getElementById("timeProgress").classList.add("warning");
        if (timeLeft <= 5) sfxTick();
      }
    } else {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function updateProgressBar(timeRemaining) {
  const progress = (timeRemaining / 60);
  document.getElementById('timeProgress').style.transform = `scaleX(${progress})`;
}

// ===== Daily letters =====
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
  return [getLetter(firstLetterIndex), getLetter(secondLetterIndex)];
}

// ===== Word of Day =====
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
  document.getElementById('dailyWord').textContent = getWordOfDay();
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  if (popup.style.display === 'block') {
    setTimeout(() => popup.style.display = 'none', 3000);
  }
}

// ===== Theme =====
function getInitialTheme() {
  const saved = localStorage.getItem('preferredTheme');
  return saved !== null ? Math.min(parseInt(saved), colorThemes.length - 1) : 0;
}

function applyTheme(idx, showName = true) {
  currentTheme = idx;
  const t = colorThemes[idx];
  const root = document.documentElement;
  root.style.setProperty('--background', t.bg);
  root.style.setProperty('--card-bg', t.cardBg);
  root.style.setProperty('--primary-color', t.primary);
  root.style.setProperty('--accent', t.accent);
  if (t.textPrimary) {
    root.style.setProperty('--text-primary', t.textPrimary);
    root.style.setProperty('--text-secondary', t.textSecondary);
    root.style.setProperty('--text-muted', t.textMuted);
    root.style.setProperty('--border-soft', t.borderSoft);
    root.style.setProperty('--border-strong', t.borderStrong);
  } else {
    root.style.setProperty('--text-primary', '#1A1F2C');
    root.style.setProperty('--text-secondary', '#4A5263');
    root.style.setProperty('--text-muted', '#8a8676');
    root.style.setProperty('--border-soft', 'rgba(26, 31, 44, 0.08)');
    root.style.setProperty('--border-strong', 'rgba(26, 31, 44, 0.18)');
  }
  if (showName) showPopupMessage(t.name);
  localStorage.setItem('preferredTheme', idx);
}

function cycleTheme() {
  applyTheme((currentTheme + 1) % colorThemes.length, true);
}

// ===== Error display =====
function showError(message) {
  const el = document.getElementById("errorMessage");
  el.textContent = message;
  clearTimeout(window._errTimeout);
  window._errTimeout = setTimeout(() => el.textContent = "", 2200);
}

// ===== Return to home =====
function returnToHome() {
  manuallyExited = true;
  clearInterval(timerInterval);
  if (comboDecayTimer) clearInterval(comboDecayTimer);
  document.getElementById("game").style.display = "none";
  document.getElementById("introScreen").style.display = "flex";
  gameRunning = false;
}

// ===== High score =====
function updateHighScoreDisplay() {
  const highScore = localStorage.getItem("lettoraHighScore") || 0;
  if (document.getElementById('highScoreDisplay')) {
    document.getElementById('highScoreDisplay').textContent = highScore;
  }
}

// ===== Game end =====
async function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  if (comboDecayTimer) clearInterval(comboDecayTimer);
  sfxGameEnd();

  if (!manuallyExited) {
    document.getElementById("finalScore").textContent = score;
    document.getElementById("statWordsCount").textContent = words.length;
    const longest = words.reduce((a, b) => a.length >= b.length ? a : b, '');
    document.getElementById("statLongest").textContent = longest || '—';

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

    const finalWordList = document.getElementById("finalWordList");
    finalWordList.innerHTML = '';

    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    sortedWords.forEach(word => {
      const wordElement = document.createElement("p");
      const wordScore = calculateWordScore(word);
      wordElement.innerHTML = `${word} <span style="color: var(--primary-color); font-family: var(--font-mono); font-size: 11px;">+${wordScore}</span>`;
      finalWordList.appendChild(wordElement);
    });

    // Streak
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
    if (window._dwgLoadLeaderboard) await window._dwgLoadLeaderboard(letters);
  } catch(e) { console.error('Load leaderboard failed', e); }
}

// ===== Reset =====
function resetGame() {
  timeLeft = 60;
  score = 0;
  words = [];
  comboCount = 0;
  comboMultiplier = 1;
  hintUsed = false;
  document.getElementById("wordsList").innerHTML = "";
  document.getElementById("timer-value").textContent = "60";
  document.getElementById("timer-value").classList.remove("timer-warning");
  document.getElementById("timeProgress").classList.remove("warning");
  document.getElementById("wordInput").value = "";
  document.getElementById("wordInput").classList.remove("invalid");
  document.getElementById("errorMessage").textContent = "";
  document.getElementById("currentScore").textContent = "0";
  document.getElementById("hintBtn").style.opacity = 1;
  document.getElementById("hintBtn").disabled = false;
  hideCombo();
  updateHighScoreDisplay();
}

function initializeStreak() {
  const s = parseInt(localStorage.getItem('gameStreak')) || 0;
  if (document.getElementById('streakDisplay')) {
    document.getElementById('streakDisplay').textContent = s;
  }
}

// ===== Confetti =====
function createConfetti() {
  const colors = ['#2E7D5B', '#E8784A', '#F2C84B', '#A8385E'];
  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(confetti);
    const animation = confetti.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${Math.random() * 400 - 200}px, ${window.innerHeight + 50}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
    ], {
      duration: Math.random() * 2000 + 1500,
      easing: 'cubic-bezier(.25,.46,.45,.94)'
    });
    animation.onfinish = () => confetti.remove();
  }
}

// ===== Share =====
function shareScore() {
  const currentScore = score;
  const lettersText = letters.join('');
  let performanceEmoji;
  if (currentScore < 50) performanceEmoji = "🌱";
  else if (currentScore < 100) performanceEmoji = "🌿";
  else if (currentScore < 150) performanceEmoji = "🌳";
  else if (currentScore < 200) performanceEmoji = "🏆";
  else performanceEmoji = "👑";

  const longest = words.reduce((a, b) => a.length >= b.length ? a : b, '');
  const shareText = `Dina's Word Game ${performanceEmoji}\nLetters: ${lettersText}\nScore: ${currentScore}\nWords: ${words.length}${longest ? `\nLongest: ${longest.toUpperCase()}` : ''}`;
  const shareUrl = window.location.href;
  const fullShareText = shareText + "\nPlay at: " + shareUrl;

  if (navigator.share) {
    navigator.share({ title: "Dina's Word Game", text: fullShareText })
      .catch(error => console.error("Error sharing:", error));
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

// Score update animation keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes scoreUpdate {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); color: var(--accent); }
  100% { transform: scale(1); }
}`;
document.head.appendChild(styleSheet);
