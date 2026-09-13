
import { getRobotMove } from './robot_v1.js';
import { getRobotMove1 } from "./robot.js";
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const resetBtn = document.getElementById('reset-btn');
    const player1Score = document.getElementById('player1-score');
    const player2Score = document.getElementById('player2-score');
    const player1Profile = document.getElementById('player1-profile');
    const player2Profile = document.getElementById('player2-profile');
    const winPopup = document.getElementById('win-popup');
    const winMessage = document.querySelector('.win-popup-content .win-message');
    const closebtn = document.getElementById('win-close-btn');

    const isRobotMode = true;

    // Game configuration
    const config = {
        rows: 5,
        cols: 5,
        dotSize: 12,
        dotColor: '#333',
        lineWidth: 5,
        player1Color: '#FF5252',
        player2Color: '#4CAF50',
        player1Highlight: 'rgba(192, 190, 190, 0.5)',
        player2Highlight: 'rgba(204, 201, 201, 0.5)',
        boundaryOffset: 6,
        robotPlayerId: 2,
        robot1PlayerId: 1,
        robovsrobo: false
    };

    // Game state
    let state = {
        currentPlayer: 1,
        scores: [0, 0],
        horizontalLines: Array(config.rows).fill().map(() => Array(config.cols - 1).fill(false)),
        verticalLines: Array(config.rows - 1).fill().map(() => Array(config.cols).fill(false)),
        boxes: Array(config.rows - 1).fill().map(() => Array(config.cols - 1).fill(0))
    };

    let lastMove = null;

    // New drag state to track dragging
    const dragState = {
        isDragging: false,
        startNode: null,
        currentPos: null,
        selectedNode: null
    };

    // Initialize game
    function init() {
        const size = Math.min(window.innerWidth - 80, window.innerHeight - 240, 600);
        console.log('Initializing game with canvas size:', size);
        canvas.width = size;
        canvas.height = size;
        drawBoard();
        // clearGameMessage();
        hideWinPopup();
        updatePlayerTurn();
        if (config.robovsrobo === true) {
            setTimeout(robotMakeMove, 300);
        }
        if (state.currentPlayer === config.robotPlayerId && isRobotMode) {
            setTimeout(robotMakeMove, 300); // robot ko turant chalne do
        }


    }

    // Function to let robot make a move
    async function robotMakeMove() {
        const playerId = state.currentPlayer;
        let move;
        console.log('robotMakeMove called. currentPlayer:', state.currentPlayer);
        // if (!isRobotMode || state.currentPlayer !== 2) {
        //     console.log('Not robot mode or not robot turn. Exiting robotMakeMove.');
        //     return;
        // }

        console.time(`Robot${playerId}_move_time`);

        if (!config.robovsrobo) {
            move = getRobotMove(state, config);
        }
        else if (playerId === 1) {
            move = getRobotMove1(state, config);
        } else if (playerId === 2) {
            move = getRobotMove(state, config);
        }

        console.timeEnd(`Robot${playerId}_move_time`);
        console.log('Robot move received:', move);
        if (!move) {
            console.log('No move returned by getRobotMove.');
            return; // No moves available
        }

        const cellSize = (canvas.width - 20) / (config.cols - 1);

        // Debug logs to check line state before move

        //console.log('Horizontal line state at', move.row, move.col, ':', state.horizontalLines[move.row][move.col]);

        //console.log('Vertical line state at', move.row, move.col, ':', state.verticalLines[move.row][move.col]);


        let moveMade = false;
        if (move.type === 'horizontal') {
            if (!state.horizontalLines[move.row][move.col]) {
                state.horizontalLines[move.row][move.col] = { player: playerId };
                lastMove = {
                    x1: move.col * cellSize + 10,
                    y1: move.row * cellSize + 10,
                    x2: (move.col + 1) * cellSize + 10,
                    y2: move.row * cellSize + 10,
                    player: 2
                };
                moveMade = true;
            }
        } else if (move.type === 'vertical') {
            if (!state.verticalLines[move.row][move.col]) {
                state.verticalLines[move.row][move.col] = { player: playerId };
                lastMove = {
                    x1: move.col * cellSize + 10,
                    y1: move.row * cellSize + 10,
                    x2: move.col * cellSize + 10,
                    y2: (move.row + 1) * cellSize + 10,
                    player: 2
                };
                moveMade = true;
            }
        }

        if (moveMade) {
            console.log('Move made by robot:', move);
            checkForCompletedBoxes();
            drawBoard();
            if (config.robovsrobo) {
                setTimeout(robotMakeMove, 500);
            }

        } else {
            console.log('Move was not made because line was already drawn:', move);

        }
    }

    // Draw game board
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = (canvas.width - 20) / (config.cols - 1);
        const dotRadius = config.dotSize / 2;

        // Draw lines first (behind dots)
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols - 1; col++) {
                if (state.horizontalLines[row][col]) {
                    drawLine(col * cellSize + 10, row * cellSize + 10,
                        (col + 1) * cellSize + 10, row * cellSize + 10,
                        state.horizontalLines[row][col].player);
                }
            }
        }

        for (let row = 0; row < config.rows - 1; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (state.verticalLines[row][col]) {
                    drawLine(col * cellSize + 10, row * cellSize + 10,
                        col * cellSize + 10, (row + 1) * cellSize + 10,
                        state.verticalLines[row][col].player);
                }
            }
        }

        // Draw boxes with rounded corners
        for (let row = 0; row < config.rows - 1; row++) {
            for (let col = 0; col < config.cols - 1; col++) {
                if (state.boxes[row][col]) {
                    drawBox(col * cellSize + 10, row * cellSize + 10, cellSize, state.boxes[row][col]);
                }
            }
        }

        // Draw dots last (on top of everything)
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const x = col * cellSize + 10;
                const y = row * cellSize + 10;
                drawDot(x, y, dotRadius);
            }
        }

        // // Highlight selected dot with smooth animation
        // if (dragState.selectedNode) {
        //     const x = dragState.selectedNode.col * cellSize + 10;
        //     const y = dragState.selectedNode.row * cellSize + 10;
        //     const pulseRadius = dotRadius + 6 + 4 * Math.sin(Date.now() / 200);
        //     ctx.beginPath();
        //     ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        //     ctx.strokeStyle = state.currentPlayer === 1 ? config.player1Color : config.player2Color;
        //     ctx.lineWidth = 4;
        //     ctx.shadowColor = ctx.strokeStyle;
        //     ctx.shadowBlur = 10;
        //     ctx.stroke();
        //     ctx.shadowBlur = 0;
        // }

        //Highlight last move
        if (lastMove) {
            // Use lastMove coordinates directly without adding +10 offset to avoid double offset
            drawLine(lastMove.x1, lastMove.y1, lastMove.x2, lastMove.y2, lastMove.player, true);
        }
    }

    function drawDot(x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = config.dotColor;
        ctx.fill();
    }

    function drawLine(x1, y1, x2, y2, player, isHighlight = false) {
        // Adjust line endpoints to stop at dot edges
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dotRadius = config.dotSize / 2;
        const offsetX = Math.cos(angle) * dotRadius;
        const offsetY = Math.sin(angle) * dotRadius;

        ctx.beginPath();
        ctx.moveTo(x1 + offsetX, y1 + offsetY);
        ctx.lineTo(x2 - offsetX, y2 - offsetY);

        if (isHighlight) {
            ctx.lineWidth = config.lineWidth + 2;
            ctx.strokeStyle = player === 1 ? config.player1Highlight : config.player2Highlight;
        } else {
            ctx.lineWidth = config.lineWidth;
            ctx.strokeStyle = player === 1 ? config.player1Color : config.player2Color;
        }
        ctx.stroke();
    }

    function drawBox(x, y, size, player) {
        const cornerRadius = 4;
        const padding = config.lineWidth;

        ctx.beginPath();
        ctx.moveTo(x + padding + cornerRadius, y + padding);
        ctx.lineTo(x + size - padding - cornerRadius, y + padding);
        ctx.quadraticCurveTo(x + size - padding, y + padding, x + size - padding, y + padding + cornerRadius);
        ctx.lineTo(x + size - padding, y + size - padding - cornerRadius);
        ctx.quadraticCurveTo(x + size - padding, y + size - padding, x + size - padding - cornerRadius, y + size - padding);
        ctx.lineTo(x + padding + cornerRadius, y + size - padding);
        ctx.quadraticCurveTo(x + padding, y + size - padding, x + padding, y + size - padding - cornerRadius);
        ctx.lineTo(x + padding, y + padding + cornerRadius);
        ctx.quadraticCurveTo(x + padding, y + padding, x + padding + cornerRadius, y + padding);
        ctx.closePath();
        ctx.fillStyle = player === 1 ? config.player1Color : config.player2Color;
        ctx.fill();
    }

    function updatePlayerTurn() {
        player1Profile.classList.toggle('active', state.currentPlayer === 1);
        player2Profile.classList.toggle('active', state.currentPlayer === 2);
    }

    // Draw drag line with animation
    function drawDragLine() {
        if (!dragState.isDragging || !dragState.currentPos) return;

        const cellSize = (canvas.width - 20) / (config.cols - 1);
        const x1 = dragState.startNode.col * cellSize + 10;
        const y1 = dragState.startNode.row * cellSize + 10;
        const x2 = dragState.currentPos.x;
        const y2 = dragState.currentPos.y;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const dotRadius = config.dotSize / 2;
        const offsetX = Math.cos(angle) * dotRadius;
        const offsetY = Math.sin(angle) * dotRadius;

        ctx.beginPath();
        // Adjust drag line endpoints to stop at dot edges like drawLine
        ctx.moveTo(x1 + offsetX, y1 + offsetY);
        ctx.lineTo(x2 - offsetX, y2 - offsetY);
        ctx.lineWidth = config.dotSize / 2;
        ctx.strokeStyle = state.currentPlayer === 1 ?
            config.player1Color + '80' : config.player2Color + '80';
        ctx.stroke();
    }

    function updateScores() {
        player1Score.textContent = state.scores[0];
        player2Score.textContent = state.scores[1];
        checkGameOver();
    }

    function checkForCompletedBoxes() {
        let boxCompleted = false;
        const cellSize = canvas.width / (config.cols - 1);

        for (let row = 0; row < config.rows - 1; row++) {
            for (let col = 0; col < config.cols - 1; col++) {
                if (!state.boxes[row][col] &&
                    state.horizontalLines[row][col] &&
                    state.horizontalLines[row + 1][col] &&
                    state.verticalLines[row][col] &&
                    state.verticalLines[row][col + 1]) {

                    state.boxes[row][col] = state.currentPlayer;
                    state.scores[state.currentPlayer - 1]++;
                    boxCompleted = true;
                }
            }
        }

        if (!boxCompleted) {
            state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
            updatePlayerTurn();
            if (state.currentPlayer === 2 && isRobotMode) {
                canvas.style.pointerEvents = 'none'; // Disable user interaction
                setTimeout(() => {
                    robotMakeMove();
                    canvas.style.pointerEvents = 'auto'; // Re-enable user interaction after robot move
                }, 500);
            } else {
                canvas.style.pointerEvents = 'auto'; // Enable user interaction for player 1
            }
        } else {
            updateScores();
            // If box completed and it's robot's turn, let robot move again
            if (state.currentPlayer === 2 && isRobotMode) {
                canvas.style.pointerEvents = 'none'; // Disable user interaction
                setTimeout(() => {
                    robotMakeMove();
                    canvas.style.pointerEvents = 'auto'; // Re-enable user interaction after robot move
                }, 500);
            } else {
                canvas.style.pointerEvents = 'auto'; // Enable user interaction for player 1
            }
        }
    }
    function checkGameOver() {
        const totalBoxes = (config.rows - 1) * (config.cols - 1);
        const completedBoxes = state.scores[0] + state.scores[1];
        if (completedBoxes === totalBoxes) {
            if (state.scores[0] > state.scores[1]) {
                showWinPopup('You wins!');
            } else if (state.scores[1] > state.scores[0]) {
                showWinPopup('Computer wins!');
            } else {
                showWinPopup("It's a draw!");
            }
        } else {
            hideWinPopup();
        }
    }
    function showWinPopup(message) {
        winMessage.textContent = message;
        winPopup.classList.add('show');
        winPopup.classList.remove('hidden');
    }

    function hideWinPopup() {
        winPopup.classList.remove('show');
        winPopup.classList.add('hidden');
    }
    // function showGameMessage(message) {
    //     gameMessage.textContent = message;
    //     gameMessage.style.color = '#333';
    //     gameMessage.style.fontWeight = 'bold';
    //     gameMessage.style.marginBottom = '10px';
    // }
    // function clearGameMessage() {
    //     gameMessage.textContent = '';
    // }
    function resetGame() {
        state = {
            currentPlayer: 1,
            scores: [0, 0],
            horizontalLines: Array(config.rows).fill().map(() => Array(config.cols - 1).fill(false)),
            verticalLines: Array(config.rows - 1).fill().map(() => Array(config.cols).fill(false)),
            boxes: Array(config.rows - 1).fill().map(() => Array(config.cols - 1).fill(0))
        };
        lastMove = null;
        dragState.isDragging = false;
        dragState.startNode = null;
        dragState.currentPos = null;
        dragState.selectedNode = null;
        updateScores();
        updatePlayerTurn();
        drawBoard();
        if (config.robovsrobo) {
            setTimeout(robotMakeMove, 1000);
        }
    }

    // Remove dragging functionality and add tap-to-select functionality
    // Removed handleTap function as replaced with pointer events handling

    // Helper to find nearest dot to a point
    function findNearestDot(x, y) {
        const cellSize = canvas.width / (config.cols - 1);
        let nearest = null;
        let minDist = Infinity;
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const dotX = col * cellSize;
                const dotY = row * cellSize;
                const dist = Math.hypot(x - dotX, y - dotY);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { row, col, x: dotX, y: dotY };
                }
            }
        }
        return nearest;
    }

    // Helper to check if two dots are adjacent (horizontal or vertical neighbors)
    function areAdjacent(dot1, dot2) {
        const dr = Math.abs(dot1.row - dot2.row);
        const dc = Math.abs(dot1.col - dot2.col);
        return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    }

    // Helper to add line between two dots if not already present
    function addLineBetweenDots(dot1, dot2) {
        const cellSize = (canvas.width - 20) / (config.cols - 1);
        if (dot1.row === dot2.row) {
            // Horizontal line
            const row = dot1.row;
            const col = Math.min(dot1.col, dot2.col);
            if (!state.horizontalLines[row][col]) {
                state.horizontalLines[row][col] = { player: state.currentPlayer };
                lastMove = {
                    x1: col * cellSize + 10,
                    y1: row * cellSize + 10,
                    x2: (col + 1) * cellSize + 10,
                    y2: row * cellSize + 10,
                    player: state.currentPlayer
                };
                checkForCompletedBoxes();
                drawBoard();
                if (isRobotMode && state.currentPlayer === 2) {
                    // If robot's turn after this move, make robot move
                    setTimeout(robotMakeMove, 500);
                }
                return true;
            }
        } else if (dot1.col === dot2.col) {
            // Vertical line
            const col = dot1.col;
            const row = Math.min(dot1.row, dot2.row);
            if (!state.verticalLines[row][col]) {
                state.verticalLines[row][col] = { player: state.currentPlayer };
                lastMove = {
                    x1: col * cellSize + 10,
                    y1: row * cellSize + 10,
                    x2: col * cellSize + 10,
                    y2: (row + 1) * cellSize + 10,
                    player: state.currentPlayer
                };
                checkForCompletedBoxes();
                drawBoard();
                if (isRobotMode && state.currentPlayer === 2) {
                    // If robot's turn after this move, make robot move
                    setTimeout(robotMakeMove, 500);
                }
                return true;
            }
        }
        return false;
    }

    // Pointer event handling for tap and hold to drag line
    let holdTimer = null;

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nearestDot = findNearestDot(x, y);
        if (!nearestDot) return;

        holdTimer = setTimeout(() => {
            // Start dragging after hold
            dragState.isDragging = true;
            dragState.startNode = nearestDot;
            dragState.currentPos = { x, y };
            dragState.selectedNode = nearestDot;
            requestAnimationFrame(animate);
        }, 300);

        dragState.selectedNode = nearestDot;
        drawBoard();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!dragState.isDragging) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        dragState.currentPos = { x, y };
        drawBoard();
        drawDragLine();
    });

    canvas.addEventListener('pointerup', (e) => {
        e.preventDefault();
        clearTimeout(holdTimer);
        if (dragState.isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const nearestDot = findNearestDot(x, y);
            if (nearestDot && areAdjacent(dragState.startNode, nearestDot)) {
                addLineBetweenDots(dragState.startNode, nearestDot);
            }
            dragState.isDragging = false;
            dragState.startNode = null;
            dragState.currentPos = null;
            drawBoard();
        } else {
            // Treat as tap if hold not triggered
            // Just select the dot (already set in pointerdown)
            drawBoard();
        }
    });

    canvas.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        clearTimeout(holdTimer);
        dragState.isDragging = false;
        dragState.startNode = null;
        dragState.currentPos = null;
        drawBoard();
    });

    // Animation loop for drag line
    function animate() {
        if (dragState.isDragging) {
            drawBoard();
            drawDragLine();
            requestAnimationFrame(animate);
        }
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (lineLengthSquared === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLengthSquared;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        return Math.hypot(px - projX, py - projY);
    }

    // Remove old event listeners for click and touchstart
    // Add new event listeners for pointer events above

    resetBtn.addEventListener('click', resetGame);
    closebtn.addEventListener('click', resetGame);
    window.addEventListener('resize', init);

    // Start game
    init();
});
