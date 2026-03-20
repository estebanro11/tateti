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

const computerPlayer = 'O';
const humanPlayer = 'X';
const preferredMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
const searchDepth = 7;

function createInitialState() {
  return {
    board: Array(9).fill(null),
    currentPlayer: humanPlayer,
    history: {
      X: [],
      O: [],
    },
    winner: null,
    winningCells: [],
  };
}

function cloneState(state) {
  return {
    board: [...state.board],
    currentPlayer: state.currentPlayer,
    history: {
      X: [...state.history.X],
      O: [...state.history.O],
    },
    winner: state.winner,
    winningCells: [...state.winningCells],
  };
}

function getAvailableMoves(state) {
  return state.board.flatMap((value, index) => (value === null ? [index] : []));
}

function findWinningLine(board, player) {
  return winningLines.find((line) => line.every((index) => board[index] === player)) || null;
}

function serializeState(state) {
  return JSON.stringify({
    board: state.board,
    currentPlayer: state.currentPlayer,
    history: state.history,
    winner: state.winner,
  });
}

function applyMove(state, index, player = state.currentPlayer) {
  if (state.winner || state.board[index] !== null) {
    return state;
  }

  const nextState = cloneState(state);
  const playerHistory = nextState.history[player];

  if (playerHistory.length === 3) {
    const oldestMove = playerHistory.shift();
    nextState.board[oldestMove] = null;
  }

  nextState.board[index] = player;
  playerHistory.push(index);

  const winningLine = findWinningLine(nextState.board, player);

  if (winningLine) {
    nextState.winner = player;
    nextState.winningCells = winningLine;
  } else {
    nextState.currentPlayer = player === humanPlayer ? computerPlayer : humanPlayer;
    nextState.winningCells = [];
  }

  return nextState;
}

function scoreLine(board, line) {
  let computerCount = 0;
  let humanCount = 0;

  line.forEach((index) => {
    if (board[index] === computerPlayer) {
      computerCount += 1;
    }

    if (board[index] === humanPlayer) {
      humanCount += 1;
    }
  });

  if (computerCount > 0 && humanCount > 0) {
    return 0;
  }

  if (computerCount === 0 && humanCount === 0) {
    return 1;
  }

  if (computerCount > 0) {
    return 10 ** computerCount;
  }

  return -(10 ** humanCount);
}

function evaluateBoard(state, depth) {
  if (state.winner === computerPlayer) {
    return 1000 + depth;
  }

  if (state.winner === humanPlayer) {
    return -1000 - depth;
  }

  return winningLines.reduce((total, line) => total + scoreLine(state.board, line), 0);
}

function minimax(state, depth, alpha, beta, visitedStates) {
  const key = serializeState(state);

  if (state.winner || depth === 0 || visitedStates.has(key)) {
    return evaluateBoard(state, depth);
  }

  const nextVisitedStates = new Set(visitedStates);
  nextVisitedStates.add(key);
  const moves = getAvailableMoves(state);

  if (state.currentPlayer === computerPlayer) {
    let bestScore = -Infinity;

    for (const move of moves) {
      const nextState = applyMove(state, move, computerPlayer);
      const score = minimax(nextState, depth - 1, alpha, beta, nextVisitedStates);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);

      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of moves) {
    const nextState = applyMove(state, move, humanPlayer);
    const score = minimax(nextState, depth - 1, alpha, beta, nextVisitedStates);
    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);

    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function getComputerMove(state) {
  const moves = getAvailableMoves(state);
  let bestMove = moves[0] ?? null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const nextState = applyMove(state, move, computerPlayer);
    const score = minimax(nextState, searchDepth, -Infinity, Infinity, new Set());
    const currentPreference = preferredMoves.indexOf(move);
    const bestPreference = preferredMoves.indexOf(bestMove);

    if (
      score > bestScore ||
      (score === bestScore && currentPreference !== -1 && currentPreference < bestPreference)
    ) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

if (typeof document !== 'undefined') {
  const boardElement = document.getElementById('board');
  const turnIndicator = document.getElementById('turn-indicator');
  const statusMessage = document.getElementById('status-message');
  const resetButton = document.getElementById('reset-button');
  const xQueueElement = document.getElementById('x-queue');
  const oQueueElement = document.getElementById('o-queue');
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  let state = createInitialState();
  let computerThinking = false;

  function getStoredTheme() {
    return localStorage.getItem('tateti-theme') || 'dark';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('tateti-theme', theme);
  }

  function isBoardLocked() {
    return computerThinking || (!!state.currentPlayer && state.currentPlayer === computerPlayer && !state.winner);
  }

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
      }

      if (state.winningCells.includes(index)) {
        cell.classList.add('highlight');
      }

      if (value || state.winner || isBoardLocked()) {
        cell.disabled = true;
      }

      boardElement.appendChild(cell);
    });
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

    if (state.winner === humanPlayer) {
      statusMessage.textContent = '¡Ganaste!';
      return;
    }

    if (state.winner === computerPlayer) {
      statusMessage.textContent = 'Ganó la computadora';
      return;
    }

    if (computerThinking) {
      statusMessage.textContent = 'La computadora está pensando...';
      return;
    }

    statusMessage.textContent = state.currentPlayer === humanPlayer ? 'Tu turno' : 'Turno de la computadora';
  }

  function render() {
    buildBoard();
    renderQueues();
    renderStatus();
  }

  function runComputerTurn() {
    if (state.winner || state.currentPlayer !== computerPlayer) {
      return;
    }

    computerThinking = true;
    render();

    window.setTimeout(() => {
      const move = getComputerMove(state);

      if (move !== null) {
        state = applyMove(state, move, computerPlayer);
      }

      computerThinking = false;
      render();
    }, 350);
  }

  function handleMove(index) {
    if (isBoardLocked() || state.board[index] || state.winner) {
      return;
    }

    state = applyMove(state, index, humanPlayer);
    render();
    runComputerTurn();
  }

  function resetGame() {
    state = createInitialState();
    computerThinking = false;
    render();
  }

  themeToggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  resetButton.addEventListener('click', resetGame);

  setTheme(getStoredTheme());
  render();
}

if (typeof module !== 'undefined') {
  module.exports = {
    applyMove,
    createInitialState,
    getAvailableMoves,
    getComputerMove,
  };
}
