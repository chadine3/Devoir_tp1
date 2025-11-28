import { useEffect } from 'react';
import { Chessboard } from '@/components/nqueens/Chessboard';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export const MultiplayerBoard = ({
  boardSize,
  queens = [],
  conflicts = 0,
  currentTurn,
  playerId,
  phase = 'placement',
  placedQueens = 0,
  onMove,
  lastMove = null,
  isExploring = false
}) => {
  const isYourTurn = currentTurn === playerId;
  const allQueensPlaced = placedQueens >= boardSize;
  
  const getStatusMessage = () => {
    if (conflicts === 0 && allQueensPlaced) return 'Puzzle solved!';
    if (!isYourTurn) return 'AI is thinking...';
    if (phase === 'placement') return `Place your queen (${placedQueens}/${boardSize})`;
    return 'Move a queen to resolve conflicts';
  };

  const handleSquareClick = (row, col) => {
    if (isYourTurn) {
      onMove(row, col);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg relative ${
        isYourTurn ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        <p className="text-center font-medium">
          {getStatusMessage()}
        </p>
      </div>
      
      <Chessboard
        boardSize={boardSize}
        queens={queens}
        conflicts={conflicts}
        onSquareClick={isYourTurn ? handleSquareClick : undefined}
        interactive={isYourTurn}
        lastMove={lastMove}
        isExploring={isExploring}
      />
      
      <div className="text-center">
        <p className="text-lg font-semibold">
          Conflicts: {conflicts}
        </p>
        {conflicts === 0 && allQueensPlaced && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-500 font-bold"
          >
            Solution found!
          </motion.p>
        )}
      </div>
    </div>
  );
};

MultiplayerBoard.propTypes = {
  boardSize: PropTypes.number.isRequired,
  queens: PropTypes.arrayOf(PropTypes.number),
  conflicts: PropTypes.number,
  currentTurn: PropTypes.number,
  playerId: PropTypes.number,
  phase: PropTypes.string,
  placedQueens: PropTypes.number,
  onMove: PropTypes.func,
  lastMove: PropTypes.object,
  isExploring: PropTypes.bool
};

MultiplayerBoard.defaultProps = {
  queens: [],
  conflicts: 0,
  phase: 'placement',
  placedQueens: 0
};