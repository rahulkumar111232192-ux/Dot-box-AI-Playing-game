
export function getRobotMove1(state, config) {
    //console.log(' getRobotMove called. currentPlayer:', state.currentPlayer, 'robotPlayerId:', config.robotPlayerId);

    if (state.currentPlayer !== config.robot1PlayerId) {
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
            newState.horizontalLines[move.row][move.col] = { player: config.robotPlayerId };
        } else if (move.type === 'vertical') {
            newState.verticalLines[move.row][move.col] = { player: config.robotPlayerId };
        }
        return newState;
    }

    function isBoxCompleted(state, row, col) {
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


    function heuristicApproach(state, config) {
        const possibleMoves = getPossibleMoves(state, config);
        if (possibleMoves.length === 0) {
            console.log(" No possible moves.");
            return null;
        }

        possibleMoves.forEach(move => {
            move.profit = profit(state, move);
            move.cost = cost(state, move);

        });

        const profitableMoves = possibleMoves.filter(m => m.profit > 0);
        if (profitableMoves.length) {
            const best = profitableMoves[Math.floor(Math.random() * profitableMoves.length)];
            //console.log(" Profitable Move Chosen:", best);
            return best;
        }

        // Else return move with least cost
        const minCost = Math.min(...possibleMoves.map(m => m.cost));
        let minCostMoves = possibleMoves.filter(m => m.cost === minCost);
        const safest = minCostMoves[Math.floor(Math.random() * minCostMoves.length)];
        //console.log(" Safe Move Chosen (min cost):", safest);
        return safest;
    }


    const bestMove = heuristicApproach(state, config);
    if (bestMove) {
        const simulated = applyMove(state, bestMove, config);

    } else {
        console.log(" No move selected by robot.");
    }

    return bestMove;
}
