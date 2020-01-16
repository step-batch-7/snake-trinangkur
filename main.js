const NUM_OF_COLS = 100;
const NUM_OF_ROWS = 60;

const GRID_ID = 'grid';
const SCORE_BOARD_ID = 'scoreBoard';

const getGrid = () => document.getElementById(GRID_ID);
const getCellId = (colId, rowId) => colId + '_' + rowId;
const getScoreBoard = () => document.getElementById(SCORE_BOARD_ID);

const getCell = (colId, rowId) =>
  document.getElementById(getCellId(colId, rowId));

const createCell = function(grid, colId, rowId) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.id = getCellId(colId, rowId);
  grid.appendChild(cell);
};

const createGrids = function() {
  const grid = getGrid();
  for (let y = 0; y < NUM_OF_ROWS; y++) {
    for (let x = 0; x < NUM_OF_COLS; x++) {
      createCell(grid, x, y);
    }
  }
};

const eraseTail = function(snake) {
  let [colId, rowId] = snake.previousTail;
  const cell = getCell(colId, rowId);
  cell.classList.remove(snake.species);
};

const eraseFood = function(food) {
  let [colId, rowId] = food.position;
  const cell = getCell(colId, rowId);
  cell.classList.remove(food.type);
};

const drawSnake = function(snake) {
  snake.location.forEach(([colId, rowId]) => {
    const cell = getCell(colId, rowId);
    cell.classList.add(snake.species);
  });
};

const drawFood = function(food) {
  let [colId, rowId] = food.position;
  const cell = getCell(colId, rowId);
  cell.classList.add(food.type);
};

const viewScore = function(score) {
  const scoreBoard = getScoreBoard();
  scoreBoard.innerText = `score : ${score}`;
};

const handleKeyPress = (game, event) => {
  const directions = { ArrowLeft: 'Left', ArrowRight: 'Right' };
  const direction = directions[event.key];
  direction && game.turnSnake(direction);
};

const attachEventListeners = game => {
  document.body.onkeydown = () => handleKeyPress(game, event);
};

const initSnake = () => {
  const snakePosition = [
    [40, 25],
    [41, 25],
    [42, 25]
  ];
  return new Snake(snakePosition, new Direction(EAST), 'snake');
};

const initGhostSnake = () => {
  const ghostSnakePosition = [
    [40, 30],
    [41, 30],
    [42, 30]
  ];
  return new Snake(ghostSnakePosition, new Direction(SOUTH), 'ghost');
};

const setup = game => {
  const { snake, ghostSnake, food } = game.getCurrentStat();
  attachEventListeners(game);
  createGrids();

  drawSnake(snake);
  drawSnake(ghostSnake);
  drawFood(food);
};

const renderSnake = function(snake) {
  drawSnake(snake);
  eraseTail(snake);
};

const renderFood = function(previousFood, food) {
  eraseFood(previousFood);
  drawFood(food);
};

const draw = function(game) {
  const {
    snake,
    ghostSnake,
    food,
    previousFood,
    score
  } = game.getCurrentStat();
  renderSnake(snake);
  renderSnake(ghostSnake);
  renderFood(previousFood, food);
  viewScore(score);
};

const main = function() {
  const snake = initSnake();
  const ghostSnake = initGhostSnake();
  const food = new Food(5, 5, 'normalFood');

  const game = new Game(snake, ghostSnake, food, {
    colNum: NUM_OF_COLS - 1,
    rowNum: NUM_OF_ROWS - 1
  });
  setup(game);

  const mainGame = setInterval(() => {
    game.update();
    if (game.isOver()) {
      clearInterval(mainGame);
      clearInterval(ghostSnakeTurner);
      alert('game over');
      return;
    }
    draw(game);
  }, 100);
  const ghostSnakeTurner = setInterval(() => {
    game.guideGhostSnake();
  }, 500);
};
