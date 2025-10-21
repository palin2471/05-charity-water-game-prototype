// Elements
const gameBoard = document.getElementById('gameBoard');
const gameInfo = document.getElementById('gameInfo');
const checkBtn = document.getElementById('checkBtn');
const feedback = document.getElementById('feedback');
const elapsedTimeSpan = document.getElementById('elapsedTime');
const levelDisplay = document.getElementById('levelDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const difficultyButtons = document.querySelectorAll('.difficultyBtn');

let gridSize = 5;
let grid = [];
let level = 1;
let difficulty = 'easy';

// Pipe symbols
const pipeSymbols = {
    'start': 'S',
    'finish': 'F',
    'straight': '─',
    'corner': '┐',
    'empty': ''
};

// Start timer
let startTime;
let timerInterval;

function createGrid(size) {
    grid = [];
    for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size; c++) {
            grid[r][c] = { type: 'empty', rotation: 0 };
        }
    }
}

function generatePath(size) {
    createGrid(size);

    // Start and finish tiles
    grid[0][0] = { type: 'start', rotation: 0 };
    grid[size - 1][size - 1] = { type: 'finish', rotation: 0 };

    let r = 0, c = 0;

    // We'll store the path coordinates for pipe placement
    const path = [{ row: 0, col: 0 }];

    // Generate path (simplified: mix of right/down moves to finish)
    while (r < size - 1 || c < size - 1) {
        if (r === size - 1) {
            c++;
        } else if (c === size - 1) {
            r++;
        } else {
            if (Math.random() < 0.5) c++; else r++;
        }
        path.push({ row: r, col: c });
    }

    // Set pipe types along the path
    for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        const next = path[i + 1];

        const drPrev = curr.row - prev.row;
        const dcPrev = curr.col - prev.col;
        const drNext = next.row - curr.row;
        const dcNext = next.col - curr.col;

        if ((drPrev === 0 && drNext === 0) || (dcPrev === 0 && dcNext === 0)) {
            // Straight pipe
            if (drPrev === 0) {
                // horizontal
                grid[curr.row][curr.col] = { type: 'straight', rotation: 0 };
            } else {
                // vertical
                grid[curr.row][curr.col] = { type: 'straight', rotation: 1 };
            }
        } else {
            // corner pipe
            grid[curr.row][curr.col] = { type: 'corner', rotation: 0 };

            // Determine rotation based on direction changes
            if ((drPrev === 0 && dcPrev === -1 && drNext === 1 && dcNext === 0) ||
                (drNext === 0 && dcNext === -1 && drPrev === 1 && dcPrev === 0)) {
                grid[curr.row][curr.col].rotation = 1; // left -> down
            } else if ((drPrev === -1 && dcPrev === 0 && drNext === 0 && dcNext === -1) ||
                (drNext === -1 && dcNext === 0 && drPrev === 0 && dcPrev === -1)) {
                grid[curr.row][curr.col].rotation = 2; // up -> left
            } else if ((drPrev === 0 && dcPrev === 1 && drNext === -1 && dcNext === 0) ||
                (drNext === 0 && dcNext === 1 && drPrev === -1 && dcPrev === 0)) {
                grid[curr.row][curr.col].rotation = 3; // right -> up
            } else {
                grid[curr.row][curr.col].rotation = 0; // right -> down default
            }
        }
    }
}

function getPipeSymbol(tile) {
    if (!tile) return '';
    if (tile.type === 'start' || tile.type === 'finish') {
        return pipeSymbols[tile.type];
    }
    if (tile.type === 'straight') {
        return tile.rotation % 2 === 0 ? '─' : '│';
    }
    if (tile.type === 'corner') {
        const cornerSymbols = ['┐', '└', '┌', '┘'];
        return cornerSymbols[tile.rotation];
    }
    return '';
}

function renderGrid() {
    gameBoard.innerHTML = '';
    const table = document.createElement('table');

    for (let r = 0; r < gridSize; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < gridSize; c++) {
            const td = document.createElement('td');
            td.classList.add('pipe-tile');

            const tile = grid[r][c];
            td.textContent = getPipeSymbol(tile);

            if (tile.type === 'start') {
                td.style.backgroundColor = '#FFC907';
                td.style.color = '#2E9DF7';
                td.style.fontWeight = 'bold';
            } else if (tile.type === 'finish') {
                td.style.backgroundColor = '#4FCB53';
                td.style.color = 'white';
                td.style.fontWeight = 'bold';
            } else {
                td.style.backgroundColor = '#e0f7fa';
                td.style.color = '#159A48';
                td.style.fontWeight = 'normal';
            }

            if (tile.type !== 'start' && tile.type !== 'finish' && tile.type !== 'empty') {
                td.style.cursor = 'pointer';

                td.onclick = () => {
                    tile.rotation = (tile.rotation + 1) % 4;
                    td.textContent = getPipeSymbol(tile);
                };
            }

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    gameBoard.appendChild(table);
}

function startGame() {
    gameBoard.style.display = 'block';
    gameInfo.style.display = 'flex';
    checkBtn.style.display = 'inline-block';
    feedback.style.display = 'none';

    generatePath(gridSize);
    renderGrid();

    // Reset timer
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        elapsedTimeSpan.textContent = `Time: ${elapsed}s`;
    }, 1000);

    levelDisplay.textContent = `Level: ${level}`;
    scoreDisplay.textContent = `Score: 0`;
}

function randomizeBoard() {
    generatePath(gridSize);
    renderGrid();
    feedback.textContent = '';
    feedback.style.display = 'none';
}

// When check button clicked, randomize the board
checkBtn.onclick = () => {
    randomizeBoard();
};

// Difficulty button handlers
difficultyButtons.forEach(btn => {
    btn.onclick = () => {
        difficulty = btn.dataset.difficulty;
        switch (difficulty) {
            case 'easy':
                gridSize = 5;
                break;
            case 'medium':
                gridSize = 7;
                break;
            case 'hard':
                gridSize = 9;
                break;
            default:
                gridSize = 5;
        }
        startGame();
    };
});

// Start the game initially with easy difficulty
difficulty = 'easy';
gridSize = 5;
startGame();
