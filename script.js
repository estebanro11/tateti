const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const statusMessage = document.getElementById('status-message');
const resetButton = document.getElementById('reset-button');
const xQueueElement = document.getElementById('x-queue');
const oQueueElement = document.getElementById('o-queue');

const state = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  history: {
    X: [],
    O: [],
  },
  winner: null,
  winningCells: [],
};

function buildBoard() {
  boardElement.innerHTML = '';

  state.board.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = String(index);
    cell.setAttribute('aria-label', `Casilla ${index + 1}`);
    cell.addEventListener('click', () => handleMove(index));

    const content = document.createElement('span');
    content.className = 'cell-content';
    content.textContent = value ?? '';
    cell.appendChild(content);

    if (value) {
      cell.classList.add(value.toLowerCase());
      cell.disabled = true;
    }

    if (state.winningCells.includes(index)) {
      cell.classList.add('highlight');
    }

    if (state.winner) {
      cell.disabled = true;
    }

    boardElement.appendChild(cell);
  });
}

function checkWinner(player) {
  return winningLines.find((line) => line.every((index) => state.board[index] === player)) || null;
}

function renderQueues() {
  const formatQueue = (player) => {
    const moves = state.history[player].map((index) => index + 1);
    return moves.length ? moves.join(' → ') : '—';
  };

  xQueueElement.textContent = `X: ${formatQueue('X')}`;
  oQueueElement.textContent = `O: ${formatQueue('O')}`;
}

function renderStatus() {
  turnIndicator.textContent = state.currentPlayer;

  if (state.winner) {
    statusMessage.textContent = `Ganó ${state.winner}`;
    return;
  }

  statusMessage.textContent = 'Jugando';
}

function render() {
  buildBoard();
  renderQueues();
  renderStatus();
}

function handleMove(index) {
  if (state.board[index] || state.winner) {
    return;
  }

  const player = state.currentPlayer;
  const playerHistory = state.history[player];

  if (playerHistory.length === 3) {
    const oldestMove = playerHistory.shift();
    state.board[oldestMove] = null;
  }

  state.board[index] = player;
  playerHistory.push(index);

  const winningLine = checkWinner(player);

  if (winningLine) {
    state.winner = player;
    state.winningCells = winningLine;
  } else {
    state.currentPlayer = player === 'X' ? 'O' : 'X';
  }

  render();
}

function resetGame() {
  state.board = Array(9).fill(null);
  state.currentPlayer = 'X';
  state.history = {
    X: [],
    O: [],
  };
  state.winner = null;
  state.winningCells = [];
  render();
}

resetButton.addEventListener('click', resetGame);

render();
