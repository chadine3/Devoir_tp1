// components/nqueens/LiveChessboard.jsx
import { motion } from 'framer-motion';

const LiveChessboard = ({ solutionHistory, currentStep, boardSize, compact = false }) => {
  const currentState = solutionHistory?.[Math.min(currentStep, solutionHistory.length - 1)] || [];

  return (
    <div className={compact ? '' : 'mt-2'}>
      <div
        className="grid gap-px bg-gray-800 p-0.5 rounded-sm mx-auto"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          width: compact ? `${boardSize * 1.25}rem` : `${boardSize * 2.5}rem`,
          height: compact ? `${boardSize * 1.25}rem` : `${boardSize * 2.5}rem`
        }}
      >
        {Array(boardSize).fill(0).map((_, row) =>
          Array(boardSize).fill(0).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className={`relative flex items-center justify-center ${
                (row + col) % 2 === 0 ? 'bg-gray-100 dark:bg-gray-200' : 'bg-gray-300 dark:bg-gray-400'
              }`}
            >
              {currentState[row] === col && currentState[row] !== -1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  className={`${compact ? 'text-lg' : 'text-2xl'} text-yellow-500 drop-shadow-md`}
                >
                  ♕
                </motion.div>
              )}
              {currentState[row] === -1 && (
                <div className={`${compact ? 'text-sm' : 'text-xl'} text-red-500`}>✖</div>
              )}
            </div>
          ))
        )}
      </div>
      {!compact && solutionHistory?.length > 1 && (
        <div className="text-center mt-1 text-xs text-gray-600 dark:text-gray-400">
          Step {Math.min(currentStep + 1, solutionHistory.length)}/{solutionHistory.length}
        </div>
      )}
    </div>
  );
};

export default LiveChessboard;