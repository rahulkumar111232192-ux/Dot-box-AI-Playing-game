export function getRobotMove(state, config) {
    console.log(' getRobotMove called. currentPlayer:', state.currentPlayer, 'robotPlayerId:', config.robotPlayerId);

    if (state.currentPlayer !== config.robotPlayerId) {
        console.log(' Not robot turn. Returning null.');
        return null;
    }

    function getPossibleMoves(state, config) {
        const moves = [];
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols - 1; col++) {
                if (!state.horizontalLines[row][col]) {
                    moves.push({ type: 'horizontal', row, col });
                }
            }
        }
        for (let row = 0; row < config.rows - 1; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (!state.verticalLines[row][col]) {
                    moves.push({ type: 'vertical', row, col });
                }
            }
        }
        return moves;
    }

    function applyMove(state, move, config) {
        const newState = JSON.parse(JSON.stringify(state));
        if (move.type === 'horizontal') {
            newState.horizontalLines[move.row][move.col] = { player: state.currentPlayer };
            // Check box above
            if (move.row > 0 && isBoxCompleted(newState, move.row - 1, move.col)) {
                newState.boxes[move.row - 1][move.col] = state.currentPlayer;
            }
            // Check box below
            if (move.row < config.rows - 1 && isBoxCompleted(newState, move.row, move.col)) {
                newState.boxes[move.row][move.col] = state.currentPlayer;
            }
        } else if (move.type === 'vertical') {
            newState.verticalLines[move.row][move.col] = { player: state.currentPlayer };
            // Check box to the left
            if (move.col > 0 && isBoxCompleted(newState, move.row, move.col - 1)) {
                newState.boxes[move.row][move.col - 1] = state.currentPlayer;
            }
            // Check box to the right
            if (move.col < config.cols - 1 && isBoxCompleted(newState, move.row, move.col)) {
                newState.boxes[move.row][move.col] = state.currentPlayer;
            }
        }
        // Print simplified state for better readability
        const simplifiedState = {
            ...newState,
            horizontalLines: newState.horizontalLines.map(row => row.map(cell => cell ? cell.player : false)),
            verticalLines: newState.verticalLines.map(row => row.map(cell => cell ? cell.player : false)),
            boxes: newState.boxes
        };
        //console.log("state after move", simplifiedState);
        return newState;
    }

    function isBoxCompleted(state, row, col) {
        if (row < 0 || col < 0 || row >= config.rows - 1 || col >= config.cols - 1) {
            return false;
        }
        return (
            !!state.horizontalLines[row][col] &&
            !!state.horizontalLines[row + 1][col] &&
            !!state.verticalLines[row][col] &&
            !!state.verticalLines[row][col + 1]
        );
    }

    function countCompletedBoxes(newState, oldState) {
        let completed = 0;
        for (let row = 0; row < config.rows - 1; row++) {
            for (let col = 0; col < config.cols - 1; col++) {
                const oldBox = isBoxCompleted(oldState, row, col);
                const newBox = isBoxCompleted(newState, row, col);
                if (!oldBox && newBox) {
                    completed++;
                }
            }
        }
        return completed;
    }

    function profit(state, move) {
        const newState = applyMove(state, move, config);
        return countCompletedBoxes(newState, state);
    }

    function cost(state, move) {
        let currentState = JSON.parse(JSON.stringify(state));
        let currentMove = move;
        let opponentMaxProfit = 0;

        do {
            currentState = applyMove(currentState, currentMove, config);

            const opponentMoves = getPossibleMoves(currentState, config);
            if (opponentMoves.length === 0) break;

            let profitableMoves = opponentMoves
                .map(m => ({ move: m, profit: profit(currentState, m) }))
                .filter(entry => entry.profit > 0);

            if (profitableMoves.length === 0) break;

            // Get the move with highest profit — opponent's best move
            const best = profitableMoves.reduce((a, b) => (a.profit > b.profit ? a : b));
            opponentMaxProfit++;
            currentMove = best.move;

        } while (true);

        return opponentMaxProfit; // Robot's move cost = opponent's potential gains
    }

    function greedyApproach(state, config) {
        // this approach check if cost of rejecting profit is less then the cost of rejecting profit for next move when accepting profit
        const possibleMoves = getPossibleMoves(state, config);
        possibleMoves.forEach(move => {
            move.profit = profit(state, move);
            move.cost = move.profit >= 1 ? 0 : cost(state, move);
        });
        let uniqueCosts = [...new Set(possibleMoves.map(m => m.cost))].sort((a, b) => a - b);
        let SecondlowestCost = uniqueCosts.length > 1 ? uniqueCosts[1] : uniqueCosts[0];
        console.log("SecondlowestCost", SecondlowestCost);
        // sort the possible moves based on the cost
        possibleMoves.sort((a, b) => a.cost - b.cost);
        const minCost = Math.min(...possibleMoves.map(m => m.cost));
        let minCostMoves = possibleMoves.filter(m => m.cost === minCost);
        const safest = minCostMoves[Math.floor(Math.random() * minCostMoves.length)];
        // filter out the possible move have Profit more than 0 

        const profitableMoves = possibleMoves.filter(m => m.profit > 0);
        if (profitableMoves.length !== 0) {
            console.log("profitableMoves", profitableMoves);
            // get minimum SecondlowestCost on applying of each possible move
            const minSecondlowestCost = profitableMoves.map(m => {
                let newState = applyMove(state, m, config);
                let newPossibleMoves = getPossibleMoves(newState, config);
                newPossibleMoves.forEach(move => {
                    move.profit = profit(newState, move);
                    move.cost = move.profit >= 1 ? 0 : cost(newState, move);
                });
                const zeroProfitMoves = newPossibleMoves.filter(m => m.profit === 0);
                const minZeroProfitCost = Math.min(...zeroProfitMoves.map(m => m.cost));
                return zeroProfitMoves.length === 0 ? 0 : minZeroProfitCost;

            });

            console.log("profitable move cost ", Math.min(...minSecondlowestCost));
            if (SecondlowestCost < Math.min(...minSecondlowestCost)) {
                // return the Math.min(...minSecondlowestCost)
                return possibleMoves.find(m => m.cost === SecondlowestCost);
            }
            else {
                // return the SeconflowestCost move
                console.log("profitable move chosen");
                return profitableMoves[minSecondlowestCost.indexOf(Math.min(...minSecondlowestCost))] === undefined || profitableMoves[minSecondlowestCost.indexOf(Math.min(...minSecondlowestCost))] === null ? profitableMoves[0] : profitableMoves[minSecondlowestCost.indexOf(Math.min(...minSecondlowestCost))];
            }
        }
        return safest;

    }

    let real_move = greedyApproach(state, config)


    return real_move;
}
