// Get references to elements
const menu = document.getElementById('menu');
const gameInfo = document.getElementById('gameInfo');
const gameBoard = document.getElementById('gameBoard');
const feedback = document.getElementById('feedback');
const scoreDisplay = document.getElementById('scoreDisplay');
const startBtn = document.getElementById('startBtn');
const levelDisplay = document.getElementById('levelDisplay');
const checkBtn = document.getElementById('checkBtn');

// Pipe tile types
const PIPE_TYPES = [
    'straight', // ─
    'corner',   // └
    'start',    // Start tile
    'finish'    // Finish tile
];

// Each tile has a type and a rotation (0, 90, 180, 270)
function createTile(type, rotation) {
    return { type, rotation };
}

// Example level: 5x5 grid with start (top-left) and finish (bottom-right)
const level1 = [
    [createTile('start', 0), createTile('straight', 0), createTile('corner', 1), createTile('straight', 0), createTile('corner', 2)],
    [createTile('straight', 1), createTile('corner', 2), createTile('straight', 0), createTile('corner', 3), createTile('straight', 1)],
    [createTile('corner', 1), createTile('straight', 0), createTile('corner', 0), createTile('straight', 1), createTile('corner', 2)],
    [createTile('straight', 0), createTile('corner', 3), createTile('straight', 1), createTile('corner', 0), createTile('straight', 0)],
    [createTile('corner', 2), createTile('straight', 1), createTile('corner', 1), createTile('straight', 0), createTile('finish', 0)],
];

// Helper to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to create a level with a shorter set path and randomize the initial rotation
function generateLevelWithPath(size) {
    // Create empty grid with random pipes and random rotations
    const grid = [];
    for (let row = 0; row < size; row++) {
        const gridRow = [];
        for (let col = 0; col < size; col++) {
            const type = Math.random() < 0.5 ? 'straight' : 'corner';
            const rotation = getRandomInt(0, 3);
            gridRow.push(createTile(type, rotation));
        }
        grid.push(gridRow);
    }

    // Create a shorter set solution path: from top-left to bottom-right, only moving right and down
    // Example: (0,0) → (0,2) → (2,2) → (2,4) → (4,4)
    const solutionPath = [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 2, col: 2 },
        { row: 2, col: 4 },
        { row: 4, col: 4 }
    ];

    // Place start and finish tiles
    grid[solutionPath[0].row][solutionPath[0].col] = createTile('start', 0);
    grid[solutionPath[solutionPath.length - 1].row][solutionPath[solutionPath.length - 1].col] = createTile('finish', 0);

    // Set correct pipe types and rotations along the solution path
    // We will save the correct solution in a separate array
    const solutionTiles = [];
    for (let i = 1; i < solutionPath.length - 1; i++) {
        const prev = solutionPath[i - 1];
        const curr = solutionPath[i];
        const next = solutionPath[i + 1];
        let type, rotation;

        // Determine direction from prev to curr and curr to next
        const dr1 = curr.row - prev.row;
        const dc1 = curr.col - prev.col;
        const dr2 = next.row - curr.row;
        const dc2 = next.col - curr.col;

        // For this path, only right/down and down/right turns
        if ((dr1 === 0 && dr2 === 0) || (dc1 === 0 && dc2 === 0)) {
            // Straight segment
            type = 'straight';
            rotation = dr1 === 0 ? 0 : 1; // 0 for horizontal, 1 for vertical
        } else {
            // Corner segment
            type = 'corner';
            if (dr1 === 0 && dc1 > 0 && dr2 > 0 && dc2 === 0) rotation = 0; // right then down
            else if (dr1 > 0 && dc1 === 0 && dr2 === 0 && dc2 > 0) rotation = 1; // down then right
            else rotation = 0; // fallback
        }
        // Set the grid tile to the correct type and rotation
        grid[curr.row][curr.col] = createTile(type, rotation);
        // Save the correct solution type and rotation for win checking
        solutionTiles.push({ row: curr.row, col: curr.col, type, rotation });
    }

    // Now randomize the rotation of the solution path tiles for challenge
    // Save the correct solution before randomizing the grid
    for (let i = 0; i < solutionTiles.length; i++) {
        const pos = solutionTiles[i];
        // The correct type and rotation are already saved in solutionTiles
        // Now randomize the tile's rotation for gameplay
        grid[pos.row][pos.col].rotation = getRandomInt(0, 3);
    }

    // Mark the solution path tiles in the grid for visual debugging (optional for beginners)
    // You can uncomment this to see the solution path in the browser:
    // for (let i = 0; i < solutionTiles.length; i++) {
    //     const pos = solutionTiles[i];
    //     grid[pos.row][pos.col].isSolution = true;
    // }

    return { grid, solutionPath, solutionTiles };
}

// Store current level and grid
let currentLevel = 1;
let grid = [];
let solutionPath = [];
let solutionTiles = [];
let timerInterval = null;
let elapsedSeconds = 0;

// Start the game
startBtn.onclick = () => {
    menu.style.display = 'none';
    gameInfo.style.display = 'flex';
    gameBoard.style.display = 'block';
    feedback.style.display = 'none';
    checkBtn.style.display = 'block';
    levelDisplay.textContent = `Level: ${currentLevel}`;
    scoreDisplay.style.display = 'none';
    elapsedSeconds = 0;
    updateElapsedTime();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateElapsedTime();
    }, 1000);
    // Generate a level with a set solution path
    const levelObj = generateLevelWithPath(5);
    grid = levelObj.grid;
    solutionPath = levelObj.solutionPath;
    solutionTiles = levelObj.solutionTiles;
    renderGrid();
};

// Update the elapsed time display
function updateElapsedTime() {
    const elapsedTime = document.getElementById('elapsedTime');
    elapsedTime.textContent = `Time: ${elapsedSeconds}s`;
}

// Load a level grid
function loadLevel(levelGrid) {
    grid = JSON.parse(JSON.stringify(levelGrid)); // Deep copy
    renderGrid();
}

// Render the grid as clickable tiles
function renderGrid() {
    gameBoard.innerHTML = ''; // Clear previous board
    const table = document.createElement('table');
    table.style.margin = '0 auto';
    table.style.borderCollapse = 'collapse';
    for (let row = 0; row < grid.length; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < grid[row].length; col++) {
            const td = document.createElement('td');
            td.className = 'pipe-tile';
            td.style.width = '60px';
            td.style.height = '60px';
            td.style.border = '1px solid #8BD1CB';
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            td.style.background = '#e0f7fa';
            td.style.cursor = grid[row][col].type === 'start' || grid[row][col].type === 'finish' ? 'default' : 'pointer';
            td.textContent = getPipeSymbol(grid[row][col]);
            // Highlight start and finish tiles
            if (grid[row][col].type === 'start') {
                td.style.background = '#FFC907';
                td.style.color = '#2E9DF7';
                td.style.fontWeight = 'bold';
            }
            if (grid[row][col].type === 'finish') {
                td.style.background = '#4FCB53';
                td.style.color = '#fff';
                td.style.fontWeight = 'bold';
            }
            // Only allow rotation for pipe tiles (not start/finish)
            if (grid[row][col].type !== 'start' && grid[row][col].type !== 'finish') {
                td.onclick = () => {
                    grid[row][col].rotation = (grid[row][col].rotation + 1) % 4;
                    td.textContent = getPipeSymbol(grid[row][col]);
                    checkWin();
                };
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    gameBoard.appendChild(table);
}

// Get pipe symbol for display
function getPipeSymbol(tile) {
    // Use Unicode for visually connecting pipes
    // ─ │ ┌ ┐ └ ┘
    if (tile.type === 'straight') {
        // Horizontal (─) or vertical (│)
        return tile.rotation % 2 === 0 ? '─' : '│';
    } else if (tile.type === 'corner') {
        // Corners: 0=└, 1=┌, 2=┐, 3=┘
        const symbols = ['└', '┌', '┐', '┘'];
        return symbols[tile.rotation % 4];
    } else if (tile.type === 'start') {
        return 'S'; // Start tile
    } else if (tile.type === 'finish') {
        return 'F'; // Finish tile
    }
    return '';
}

// Check if the solution path tiles are in the correct orientation
function checkWin() {
    let solved = true;
    // Only check the tiles in the solutionTiles array
    for (let i = 0; i < solutionTiles.length; i++) {
        const pos = solutionTiles[i];
        const tile = grid[pos.row][pos.col];
        // Compare type and rotation to the saved solution
        if (tile.type !== pos.type || tile.rotation !== pos.rotation) {
            solved = false;
            break;
        }
    }
    if (solved) {
        showLevelCompleteMenu();
    } else {
        feedback.style.display = 'none';
    }
}

// Add a function to show the level complete menu
function showLevelCompleteMenu() {
    // Clear previous feedback
    feedback.innerHTML = '';
    feedback.style.display = 'block';
    // Show level complete message
    const msg = document.createElement('div');
    msg.textContent = `Level ${currentLevel} completed!`;
    msg.style.fontSize = '1.4rem';
    msg.style.marginBottom = '16px';
    msg.style.color = '#2E9DF7';
    feedback.appendChild(msg);

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.marginRight = '12px';
    continueBtn.onclick = () => {
        currentLevel++;
        levelDisplay.textContent = `Level: ${currentLevel}`;
        feedback.style.display = 'none';
        // Generate a new level
        const levelObj = generateLevelWithPath(5);
        grid = levelObj.grid;
        solutionPath = levelObj.solutionPath;
        solutionTiles = levelObj.solutionTiles;
        renderGrid();
        elapsedSeconds = 0;
        updateElapsedTime();
    };
    feedback.appendChild(continueBtn);

    // Quit button
    const quitBtn = document.createElement('button');
    quitBtn.textContent = 'Quit';
    quitBtn.onclick = () => {
        location.reload(); // For beginners, reload the page
    };
    feedback.appendChild(quitBtn);
}

// Helper to get which directions a tile connects to
function getConnections(tile) {
    // Returns array of direction names
    if (tile.type === 'straight') {
        // Horizontal or vertical
        // rotation 0 or 2: left/right, rotation 1 or 3: up/down
        return tile.rotation % 2 === 0 ? ['left', 'right'] : ['up', 'down'];
    }
    if (tile.type === 'corner') {
        // Four corner shapes
        // rotation 0: down/right
        // rotation 1: up/right
        // rotation 2: up/left
        // rotation 3: down/left
        if (tile.rotation === 0) return ['down', 'right'];
        if (tile.rotation === 1) return ['up', 'right'];
        if (tile.rotation === 2) return ['up', 'left'];
        if (tile.rotation === 3) return ['down', 'left'];
    }
    if (tile.type === 'start') {
        // Always connects to right
        return ['right'];
    }
    if (tile.type === 'finish') {
        // Always connects to left
        return ['left'];
    }
    return [];
}

// This function checks if there is a connected path from start to finish
function checkConnection() {
    // Directions: [row offset, col offset]
    const directions = [
        { name: 'up', dr: -1, dc: 0 },
        { name: 'right', dr: 0, dc: 1 },
        { name: 'down', dr: 1, dc: 0 },
        { name: 'left', dr: 0, dc: -1 }
    ];

    // Helper to get the opposite direction
    function getOpposite(dir) {
        if (dir === 'up') return 'down';
        if (dir === 'down') return 'up';
        if (dir === 'left') return 'right';
        if (dir === 'right') return 'left';
        return '';
    }

    // Setup visited array
    const visited = [];
    for (let i = 0; i < grid.length; i++) {
        visited.push(new Array(grid[0].length).fill(false));
    }

    // Each queue entry tracks the path taken so far
    let queue = [{ row: 0, col: 0, path: [{ row: 0, col: 0 }] }];
    visited[0][0] = true;
    let found = false;
    let winningPath = [];

    while (queue.length > 0) {
        const current = queue.shift();
        const { row, col, path } = current;
        const tile = grid[row][col];
        const connections = getConnections(tile);

        // If we've reached the finish tile, stop and highlight the path
        if (row === grid.length - 1 && col === grid[0].length - 1) {
            found = true;
            winningPath = path;
            break;
        }

        for (const dir of connections) {
            // Find direction offset
            const d = directions.find(x => x.name === dir);
            const newRow = row + d.dr;
            const newCol = col + d.dc;
            // Check bounds
            if (newRow < 0 || newRow >= grid.length || newCol < 0 || newCol >= grid[0].length) continue;
            // Check if already visited
            if (visited[newRow][newCol]) continue;
            // Check if the neighbor connects back to us
            const neighbor = grid[newRow][newCol];
            const neighborConnections = getConnections(neighbor);
            const opposite = getOpposite(dir);
            // Both tiles must connect to each other
            if (neighborConnections.includes(opposite)) {
                visited[newRow][newCol] = true;
                // Add the new position to the path
                queue.push({ row: newRow, col: newCol, path: [...path, { row: newRow, col: newCol }] });
            }
        }
    }

    // Highlight only the successful path, if found
    highlightPath(winningPath);

    // Show feedback
    if (found) {
        feedback.textContent = 'Pipes are connected! 🎉';
        feedback.style.display = 'block';
    } else {
        feedback.textContent = 'Pipes are NOT connected. Try rotating tiles!';
        feedback.style.display = 'block';
    }
}

// Highlight the path in the grid for visual feedback
function highlightPath(pathArr) {
    // Get all table cells
    const table = gameBoard.querySelector('table');
    if (!table) return;
    // First, clear all highlights
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            table.rows[row].cells[col].style.boxShadow = '';
        }
    }
    // Highlight only the cells in the pathArr
    if (Array.isArray(pathArr)) {
        for (const pos of pathArr) {
            table.rows[pos.row].cells[pos.col].style.boxShadow = '0 0 8px 2px #2E9DF7';
        }
    }
}

// When the check button is clicked, check connection
checkBtn.onclick = () => {
    checkConnection();
};

// ...existing code for other buttons and logic...
