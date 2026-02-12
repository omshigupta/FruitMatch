// First, let's add sound effect constants at the top of the file with your other constants
const board = document.getElementById("game-board");
const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");
const progressTextEl = document.getElementById("progress-text");
const resultModal = document.getElementById("result-modal");
const resultMsg = document.getElementById("result-message");
const timeTakenEl = document.getElementById("time-taken");
const encouragementMessageEl = document.getElementById("encouragement-message");

// --- Web Audio API Sound Generation ---
let audioCtx = null; // AudioContext needs to be created after user interaction
let masterGainNode = null; // To control global volume/mute

// --- MODIFICATION START: Load sound state from localStorage ---
let isSoundOn;
const savedSoundState = localStorage.getItem('gameSoundState');
// Default to true (sound on) if nothing is saved, otherwise parse the saved string
isSoundOn = savedSoundState === null ? true : (savedSoundState === 'true');
// --- MODIFICATION END ---

// Function to initialize or resume the AudioContext (vital for browser autoplay policies)
function initAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioCtx.createGain();
      masterGainNode.connect(audioCtx.destination);
      // Use the potentially loaded isSoundOn state for initial volume
      masterGainNode.gain.setValueAtTime(isSoundOn ? 0.5 : 0, audioCtx.currentTime);
      console.log("AudioContext created.");
    } catch (e) {
      console.error("Web Audio API is not supported in this browser", e);
      return false; // Indicate failure
    }
  }
  // Check if context is suspended and resume it (needed after user interaction)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log("AudioContext resumed.");
    });
  }
  return true; // Indicate success or already initialized
}

// Function to play a simple tone
function playTone(frequency = 440, duration = 0.1, type = 'sine') {
  // Ensure AudioContext is ready (call after first user click ideally)
  if (!audioCtx && !initAudioContext()) {
      console.log("Cannot play tone, AudioContext not available.");
      return; // Exit if context couldn't be initialized
  }
  // Double-check resume state just before playing
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }

  if (!masterGainNode) return; // Safety check

  try {
      const oscillator = audioCtx.createOscillator();
      oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime); // Value in hertz

      // Connect oscillator to master gain, then to output
      oscillator.connect(masterGainNode);

      const now = audioCtx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration); // Stop after specified duration in seconds
  } catch(e) {
      console.error("Error playing tone:", e);
  }
}

// Define simple sounds using tones
const matchAudio = new Audio("https://github.com/JimLynchCodes/Game-Sound-Effects/raw/refs/heads/master/Sounds/Banner.wav");
const errorAudio = new Audio("https://github.com/JimLynchCodes/Game-Sound-Effects/raw/refs/heads/master/Sounds/click_error.wav");
const winAudio = new Audio("https://github.com/JimLynchCodes/Game-Sound-Effects/raw/refs/heads/master/Sounds/cat_star_collect.wav");
const loseAudio = new Audio("https://github.com/JimLynchCodes/Game-Sound-Effects/raw/refs/heads/master/Sounds/coin.wav");

// Pre-load all of them
matchAudio.load();
errorAudio.load();
winAudio.load();
loseAudio.load();

// Define simple sounds
const sounds = {
    // 1. Correct Match
    correct: () => {
        matchAudio.currentTime = 0;
        matchAudio.play().catch(e => console.log("Audio block:", e));
    },

    // 2. Incorrect Match (Updated)
    wrong: () => {
        errorAudio.currentTime = 0;
        errorAudio.play().catch(e => console.log("Audio block:", e));
    },

    // 3. Winner Sound (Updated)
    win: () => {
        winAudio.currentTime = 0;
        winAudio.play().catch(e => console.log("Audio block:", e));
    },

    // 4. Lose / Time Up (Updated)
    lose: () => {
        loseAudio.currentTime = 0;
        loseAudio.play().catch(e => console.log("Audio block:", e));
    }
};

// No preloading needed for synthesized sounds
function preloadSounds() {
    // This function is now empty or can be removed
}

// Play sound function now calls the appropriate function from the sounds object
function playSound(soundName) {
  // Initialize audio context on the first attempt to play sound
  if (!audioCtx) {
      if (!initAudioContext()) return; // Attempt init, exit if failed
  } else if (audioCtx.state === 'suspended') {
      audioCtx.resume(); // Ensure it's running if already created
  }


  if (sounds[soundName] && typeof sounds[soundName] === 'function') {
      // Check sound toggle state BEFORE playing
      if (isSoundOn) {
          sounds[soundName]();
      }
  } else {
      console.log(`Sound function missing for: ${soundName}`);
  }
}

// --- End of Web Audio API specific changes ---


const icons = [
  "lemon.png",
  "watermelon.png",
  "strawberry.png",
  "dragonfruit.png",
  "coconut.png",
  "orange.png",
  "mango.png",
  "cherry.png"
];
const rows = 6;
const cols = 6;
let grid = [];
let selected = [];
let matched = 0;
let timeLeft = 100; // Initial time
const totalTime = 100; // Store initial time
let timerInterval = null; // To store interval ID
let timeStart = null;
let canvas, ctx;
let encouragementTimeout = null; // To clear previous message timeouts

const userDpEl = document.getElementById("user-dp");
const dpInputEl = document.getElementById("dp-input");
const updateDpBtn = document.getElementById("update-dp");
const userNameEl = document.getElementById("user-name");
const updateNameBtn = document.getElementById("update-name");
let userProfile = {
    dp: "", // Default DP blank
    name: ""  // Default Name blank
};
let dpUpdated = false;
let nameUpdated = false;

const finalUserDpEl = document.getElementById("final-user-dp");

const encouragementTexts = ["Yeah! 🥳", "Great! 👍", "Superb! ✨", "You're close! 😉", "Keep going! 💪", "Awesome! 😎"];

const winningMessages = [
    { time: 40, messages: ["Wow you're super fast @username! 🚀"] },
    { time: 50, messages: ["Amazing speed, @username! ✨"] },
    { time: Infinity, messages: ["Great job, @username! 🎉"] }
];

function getWinningMessage(timeTaken, username) {
  for (const group of winningMessages) {
    if (timeTaken <= group.time) {
      let message = group.messages[Math.floor(Math.random() * group.messages.length)];
      message = message.replace("@username", username || "Player"); // Use Player if name is empty
      return message;
    }
  }
    return `Great job, ${username || "Player"}! 🎉`; // Fallback
}


function loadUserProfile() {
    userProfile.dp = localStorage.getItem("userDp") || "assets/icons/default-dp.png";
    userProfile.name = localStorage.getItem("userName") || "";
    dpUpdated = localStorage.getItem("dpUpdated") === 'true';
    nameUpdated = localStorage.getItem("nameUpdated") === 'true';

    userDpEl.src = userProfile.dp;
    userDpEl.onerror = () => { userDpEl.src = 'assets/icons/default-dp.png'; };
    userNameEl.value = userProfile.name;

    if (dpUpdated && userProfile.dp !== "assets/icons/default-dp.png") {
        updateDpBtn.classList.add("updated");
    } else {
        updateDpBtn.classList.remove("updated");
    }

    if (nameUpdated) {
        updateNameBtn.classList.add("updated");
    } else {
        updateNameBtn.classList.remove("updated");
    }
}

function createBoard() {
  board.innerHTML = ''; // Clear previous board
  let totalCells = rows * cols;
  let iconPairs = [];

    let availableIcons = [...icons];
    while (iconPairs.length < totalCells) {
        if (availableIcons.length === 0) availableIcons = [...icons];
        let icon = availableIcons.splice(Math.floor(Math.random() * availableIcons.length), 1)[0];
        iconPairs.push(icon, icon);
    }

  iconPairs = shuffle(iconPairs.slice(0, totalCells));
  grid = [];
  matched = 0;
  selected = [];

    if (canvas) canvas.remove(); // Remove old canvas
  canvas = document.createElement("canvas");
  board.appendChild(canvas); // Add canvas first
  ctx = canvas.getContext("2d");

  // Create cells and add them AFTER the canvas
  for (let r = 0; r < rows; r++) {
    let rowData = [];
    for (let c = 0; c < cols; c++) {
      let cell = document.createElement("div");
      cell.className = "cell";
      let icon = iconPairs.pop();
      cell.dataset.icon = icon;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.innerHTML = `<img src="assets/icons/${icon}" alt="${icon.split('.')[0]}" />`; // Better alt text
      board.appendChild(cell); // Append cells after canvas
      rowData.push({ icon, element: cell, matched: false });

      // Use touch events to handle simultaneous touches better
      cell.addEventListener("pointerdown", (e) => {
        // Try to initialize AudioContext on first interaction
        if (!audioCtx) initAudioContext();
        e.preventDefault(); // Prevent default to avoid delayed clicks
        selectCell(r, c);
      });
    }
    grid.push(rowData);
  }

  // Set canvas size after grid is potentially sized by CSS
  requestAnimationFrame(() => {
        const boardRect = board.getBoundingClientRect();
        canvas.width = boardRect.width;
        canvas.height = boardRect.height;
    });


  updateProgress();
  updateTimerDisplay();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Queue to track pairs that need processing
let processingQueue = [];
let isProcessing = false;

// --- selectCell Function START ---
function selectCell(r, c) {
  let cellData = grid[r][c];

  // Ignore clicks on already matched cells, cells being processed, or the exact same cell if it's already selected
  if (cellData.matched ||
      cellData.element.classList.contains("processing") ||
      selected.some(sel => sel.r === r && sel.c === c)) {
      return;
  }

  cellData.element.classList.add("selected");
  selected.push({ r, c });

  // Process when we have exactly two cells
  if (selected.length === 2) {
    // Create a copy of the current selection for processing
    const pairToProcess = [...selected];

    // Add to processing queue
    processingQueue.push(pairToProcess);

    // Mark these cells as being processed
    pairToProcess.forEach(pos => {
      grid[pos.r][pos.c].element.classList.add("processing");
    });

    // Reset selection to allow new selections while processing
    selected = [];

    // Start processing if not already processing
    if (!isProcessing) {
      processNextPair();
    }
  }
}

// Process the next pair in the queue
function processNextPair() {
  if (processingQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const pairToProcess = processingQueue.shift();
  processSelectedPair(pairToProcess);
}

// Modified processSelectedPair to call the new playSound function
function processSelectedPair(pair) {
  let [a, b] = pair;
  let cellA = grid[a.r][a.c];
  let cellB = grid[b.r][b.c];

  let path = findConnectionPath(a, b); // Find path first

  if (cellA.icon === cellB.icon && path.length > 0) { // Check if path exists
    // --- Match ---
    playSound('correct'); // Play synthesized sound

    cellA.matched = true;
    cellB.matched = true;
    // path variable already contains the path
    drawPath(path, "green"); // Draw the logical path
    addEncouragement(); // Show positive message

    cellA.element.classList.add("correct");
    cellB.element.classList.add("correct");

    setTimeout(() => {
      cellA.element.style.visibility = "hidden";
      cellB.element.style.visibility = "hidden";

      // Clean up classes
      cellA.element.classList.remove("correct", "selected", "processing");
      cellB.element.classList.remove("correct", "selected", "processing");

      matched += 2;
      updateProgress();
      checkWin();
      clearCanvas();

      // Process next pair
      processNextPair();
    }, 500); // Increased delay slightly to see path and numbers
  } else {
    // --- No Match ---
    playSound('wrong'); // Play synthesized sound

    cellA.element.classList.add("shake", "wrong");
    cellB.element.classList.add("shake", "wrong");
    showEncouragementMessage("Try again!", 1000);

    setTimeout(() => {
      // Clean up classes
      cellA.element.classList.remove("shake", "wrong", "selected", "processing");
      cellB.element.classList.remove("shake", "wrong", "selected", "processing");
      clearCanvas(); // Clear canvas even on wrong match (if any temporary drawing was planned)

      // Process next pair
      processNextPair();
    }, 500); // Delay for shake/feedback
  }
}
// --- MODIFIED selectCell Function END ---

// --- Path finding functions (No changes needed here for audio) ---
function isConnectable(start, end) {
    if (start.r === end.r && start.c === end.c) return false;
    // Find path directly and check its length
    const path = findConnectionPath(start, end);
    return path.length > 0;
}

// This function is no longer needed as isConnectable now calls findConnectionPath
// function checkPath(p1, p2, maxTurns) {
//       const path = findPathBFS(p1, p2, maxTurns);
//       return path !== null;
// }

function findPathBFS(start, end, maxTurns) {
    const queue = [{ r: start.r, c: start.c, path: [start], turns: 0, dir: null }]; // dir: 0=horizontal, 1=vertical
    const visited = new Map(); // Use Map for more complex state: key=`${r},${c},${turns},${dir}` -> cost (path length)
    visited.set(`${start.r},${start.c},0,null`, 0);

    const directions = [
        { dr: 0, dc: 1, dir: 0 }, { dr: 0, dc: -1, dir: 0 }, // Horizontal
        { dr: 1, dc: 0, dir: 1 }, { dr: -1, dc: 0, dir: 1 }  // Vertical
    ];

    let foundPath = null;

    while (queue.length > 0) {
        const current = queue.shift();

        // Optimization: If we already found a path and current path is longer, skip
        if (foundPath && current.path.length >= foundPath.length) continue;
        // Optimization: If current turns exceed maxTurns, skip
        if (current.turns > maxTurns) continue;


        // Explore neighbors by extending in each direction
        for (const move of directions) {
            let nextR = current.r + move.dr;
            let nextC = current.c + move.dc;
            let segmentPath = []; // Track points added in this straight line segment

            // Continue in the same direction
            while (nextR >= -1 && nextR <= rows && nextC >= -1 && nextC <= cols) {
                const isTarget = nextR === end.r && nextC === end.c;
                const newTurns = (current.dir !== null && current.dir !== move.dir) ? current.turns + 1 : current.turns;

                // Check if this move is valid
                if (newTurns > maxTurns) {
                    break; // Too many turns for this path segment
                }

                // If it's the target
                if (isTarget) {
                    const finalPath = [...current.path, ...segmentPath, { r: nextR, c: nextC }];
                       // If this is the first path found OR a shorter path with the same turns OR fewer turns
                       if (!foundPath || newTurns < (foundPath.turns || Infinity) || (newTurns === foundPath.turns && finalPath.length < foundPath.path.length)) {
                           foundPath = { path: finalPath, turns: newTurns };
                       }
                    break; // Found target along this segment, no need to go further
                }

                // Check if blocked by another non-matched piece
                if (nextR >= 0 && nextR < rows && nextC >= 0 && nextC < cols) {
                    if (grid[nextR]?.[nextC] && !grid[nextR][nextC].matched) {
                       break; // Blocked by an existing piece
                    }
                }
                // Bounds check (redundant due to while condition, but safe)
                // else if (nextR < -1 || nextR > rows || nextC < -1 || nextC > cols) {
                //     break;
                // }

                // Add the intermediate point for path drawing
                const currentPoint = { r: nextR, c: nextC };
                segmentPath.push(currentPoint);

                 // Check visited state
                 const visitedKey = `${nextR},${nextC},${newTurns},${move.dir}`;
                 const existingCost = visited.get(visitedKey);
                 const newCost = current.path.length + segmentPath.length;

                 if (existingCost === undefined || newCost < existingCost) {
                     visited.set(visitedKey, newCost);
                     queue.push({
                         r: nextR,
                         c: nextC,
                         path: [...current.path, ...segmentPath], // Pass the full path so far
                         turns: newTurns,
                         dir: move.dir
                     });
                 }


                // Continue in the same direction
                nextR += move.dr;
                nextC += move.dc;
            } // end while (straight line segment)
        } // end for (directions)
    } // end while (queue)

    return foundPath ? foundPath.path : null; // Return only the path array
}


function findConnectionPath(start, end) {
    for (let turns = 0; turns <= 3; turns++) {
        const path = findPathBFS(start, end, turns);
        if (path) {
            // We need the full path including turns outside the grid, so no filtering here.
            // The BFS already constructs the logical path.
            return path;
        }
    }
    return []; // Return empty array if no path found within 3 turns
}
// --- End of path finding ---


function clearCanvas() {
    if(ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}


// --- UPDATED drawPath Function ---
function drawPath(path, color) {
    if (!path || path.length < 2 || !ctx || !canvas) return;
    const boardRect = board.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) return;

    // Adjust canvas size if needed (should match board)
    if (canvas.width !== boardRect.width || canvas.height !== boardRect.height) {
        canvas.width = boardRect.width;
        canvas.height = boardRect.height;
    }

    // Function to get coordinates, handling off-grid points
    const getCoords = (point) => {
        const r = point.r;
        const c = point.c;
        const cellWidth = boardRect.width / cols;
        const cellHeight = boardRect.height / rows;

        // Calculate center based on grid position, even if off-grid
        const x = c * cellWidth + cellWidth / 2;
        const y = r * cellHeight + cellHeight / 2;

        return { x, y };
    };

    ctx.strokeStyle = color;
    ctx.lineWidth = 4; // Slightly thicker
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // ctx.setLineDash([5, 5]); // Optional: Dashed line style
    ctx.beginPath();

    // --- Draw the path line segments ---
    const startCoords = getCoords(path[0]);
    ctx.moveTo(startCoords.x, startCoords.y);

    for (let i = 1; i < path.length; i++) {
        const pointCoords = getCoords(path[i]);
        ctx.lineTo(pointCoords.x, pointCoords.y);
    }
    ctx.stroke();
    // ctx.setLineDash([]); // Reset line dash if it was set

    // --- Draw turn numbers ---
    let turnCount = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; // Black text for numbers
    ctx.font = "bold 16px sans-serif"; // Font for numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 1; i < path.length - 1; i++) { // Iterate through intermediate points
        const prevPoint = path[i - 1];
        const currentPoint = path[i];
        const nextPoint = path[i + 1];

        // Calculate direction vectors for the segments before and after the current point
        const dr1 = currentPoint.r - prevPoint.r;
        const dc1 = currentPoint.c - prevPoint.c;
        const dr2 = nextPoint.r - currentPoint.r;
        const dc2 = nextPoint.c - currentPoint.c;

        // Check if direction changes (horizontal to vertical or vice versa)
        const isTurn = (dr1 === 0 && dc2 === 0) || (dc1 === 0 && dr2 === 0);

        if (isTurn) {
            turnCount++;
            const turnCoords = getCoords(currentPoint);

            // Draw a small background circle for the number
            ctx.beginPath();
            ctx.arc(turnCoords.x, turnCoords.y, 10, 0, Math.PI * 2); // 10px radius circle
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // Semi-transparent white background
            ctx.fill();

            // Draw the turn number
            ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; // Dark text
            ctx.fillText(turnCount.toString(), turnCoords.x, turnCoords.y + 1); // +1 for slight vertical adjustment

            if (turnCount >= 3) break; // Max 3 turns allowed/numbered
        }
    }
}
// --- END OF UPDATED drawPath Function ---


function updateProgress() {
  let totalCells = rows * cols;
    if (totalCells === 0) return;
  let percent = Math.floor((matched / totalCells) * 100);
  progressEl.style.width = `${percent}%`;
  progressTextEl.innerText = `Completed: ${percent}%`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // Clear existing

  timeLeft = totalTime;
  timeStart = new Date();
    updateTimerDisplay(); // Initial display

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(); // Update text only

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showResult(null); // Time's up
    }
  }, 1000);
}

function checkWin() {
    let totalCells = rows * cols;
  if (matched === totalCells) {
    if (timerInterval) clearInterval(timerInterval);
    let timeEnd = new Date();
    let timeTaken = (timeEnd - timeStart) / 1000;
    showResult(timeTaken);
  }
}

// Modified showResult to call the new playSound function
function showResult(timeTaken) {
    let message = "";
    let timeTakenMessage = "";

    if (timeTaken !== null) {
        // Player won
        playSound('win'); // Play synthesized sound

        const username = userProfile.name || "Player";
        message = getWinningMessage(timeTaken, username);
        timeTakenMessage = `Time taken: ${timeTaken.toFixed(1)} seconds`;
    } else {
        // Player lost (time's up)
        playSound('lose'); // Play synthesized sound

        message = "Time's up! You lose 😔";
        timeTakenMessage = `Completed: ${Math.floor((matched / (rows * cols)) * 100)}%`;
    }

    const finalDpSize = "clamp(40px, 8vmin, 60px)";
    if (dpUpdated && userProfile.dp && userProfile.dp !== 'assets/icons/default-dp.png') {
        finalUserDpEl.innerHTML = `<img src="${userProfile.dp}" alt="User DP" style="width: ${finalDpSize}; height: ${finalDpSize}; border-radius: 50%; object-fit: cover; border: 1px solid white;">`;
    } else {
        finalUserDpEl.innerHTML = ``;
    }

    resultMsg.innerText = message;
    timeTakenEl.innerText = timeTakenMessage;
    resultModal.classList.add("show");
}

function showEncouragementMessage(message, duration = 1500) {
    if (encouragementTimeout) {
        clearTimeout(encouragementTimeout); // Clear previous timeout
    }
    encouragementMessageEl.innerText = message;
    encouragementMessageEl.classList.add('show'); // Add class to trigger opacity transition

    encouragementTimeout = setTimeout(() => {
        encouragementMessageEl.classList.remove('show'); // Remove class to fade out
    }, duration);
}

function addEncouragement() {
    const message = encouragementTexts[Math.floor(Math.random() * encouragementTexts.length)];
    showEncouragementMessage(message); // Use the centralized function
}


function updateButtonDisplay(button) {
    button.classList.add("updated");
}

function updateTimerDisplay() {
    const displayTime = Math.max(0, timeLeft);
    timerEl.innerText = displayTime;
}

// --- Event Listeners (No changes needed here for audio) ---
updateDpBtn.addEventListener("click", () => {
    if (!audioCtx) initAudioContext(); // Try init audio on interaction
    dpInputEl.click();
});

dpInputEl.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
            userProfile.dp = reader.result;
            userDpEl.src = reader.result;
            localStorage.setItem("userDp", reader.result);
            dpUpdated = true;
            localStorage.setItem("dpUpdated", 'true');
            updateButtonDisplay(updateDpBtn);
            userDpEl.onerror = () => { userDpEl.src = 'assets/icons/default-dp.png'; };
        };
        reader.onerror = () => { console.error("Error reading file."); };
        reader.readAsDataURL(file);
    } else if (file) {
         alert("Please select an image file.");
    }
});

updateNameBtn.addEventListener("click", () => {
    if (!audioCtx) initAudioContext(); // Try init audio on interaction
    const newName = userNameEl.value.trim();
    userProfile.name = newName;
    localStorage.setItem("userName", newName);
    nameUpdated = true;
    localStorage.setItem("nameUpdated", 'true');
    updateButtonDisplay(updateNameBtn);
    if(newName === "") {
       userNameEl.placeholder = "Your name";
    }
});


// --- Initial Setup ---
function initializeGame() {
    loadUserProfile();
    // preloadSounds(); // Not needed for synthesized sounds
    createBoard();
    startTimer();
    // Don't init AudioContext here, wait for user interaction
}

// --- Resize listener (No changes needed here for audio) ---
window.addEventListener('resize', () => {
     if(canvas && board) {
       requestAnimationFrame(() => { // Use rAF for smoother resize handling
            const boardRect = board.getBoundingClientRect();
            // Check if dimensions actually changed to avoid unnecessary redraws
            if (canvas.width !== boardRect.width || canvas.height !== boardRect.height) {
                canvas.width = boardRect.width;
                canvas.height = boardRect.height;
                // No need to clear canvas here, happens naturally on redraw or path drawing
            }
       });
     }
});

// Add sound toggle capability (Modified for Web Audio API GainNode and Persistence)
function createSoundToggle() {
    const soundToggle = document.createElement('button');
    soundToggle.id = 'sound-toggle';
    // isSoundOn is now loaded from localStorage or defaulted at the top
    soundToggle.className = isSoundOn ? 'sound-on' : 'sound-off';
    soundToggle.innerHTML = isSoundOn ? '🔊' : '🔇';
    soundToggle.title = 'Toggle Sound';
    // (Keep existing styles)
    soundToggle.style.position = 'absolute';
    soundToggle.style.top = '5px';
    soundToggle.style.right = '5px';
    soundToggle.style.padding = '3px 6px';
    soundToggle.style.border = 'none';
    soundToggle.style.borderRadius = '2px';
    soundToggle.style.backgroundColor = 'rgba(255,255,255,0.1)';
    soundToggle.style.cursor = 'pointer';
    soundToggle.style.fontSize = '12px'; // Keeping font size small

    soundToggle.addEventListener('click', () => {
        // Ensure AudioContext exists before toggling volume
        if (!audioCtx) {
            if (!initAudioContext()) return; // Try init, exit if failed
        } else if (audioCtx.state === 'suspended') {
            audioCtx.resume(); // Resume if suspended
        }

        if (!masterGainNode) return; // Safety check

        isSoundOn = !isSoundOn; // Toggle the global state

        // --- MODIFICATION START: Save sound state to localStorage ---
        localStorage.setItem('gameSoundState', isSoundOn.toString());
        // --- MODIFICATION END ---


        // Update visual indicator and ACTUAL volume control
        if (isSoundOn) {
            soundToggle.innerHTML = '🔊';
            soundToggle.className = 'sound-on';
            // Set gain smoothly to avoid clicks (optional, but good practice)
            masterGainNode.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.01);
        } else {
            soundToggle.innerHTML = '🔇';
            soundToggle.className = 'sound-off';
            masterGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01); // Mute
        }
    });

    document.body.appendChild(soundToggle);
}

// Call sound toggle creation after body is loaded
window.addEventListener('DOMContentLoaded', () => {
    createSoundToggle(); // Creates the button using the loaded/defaulted isSoundOn state
    // Add a general interaction listener to help initialize AudioContext early
    document.body.addEventListener('click', initAudioContext, { once: true });
    document.body.addEventListener('touchstart', initAudioContext, { once: true });
});

initializeGame(); // Start the game