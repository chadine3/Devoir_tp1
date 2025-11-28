import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const Chessboard = ({ 
  boardSize = 4, 
  queens = [],
  conflicts = 0,
  onSquareClick,
  interactive = true,
  lastMove = null,
  isExploring = false,
  attackedSquares = {}
}) => {
  const [prevQueens, setPrevQueens] = useState(queens);
  const [highlightedCells, setHighlightedCells] = useState([]);

  // Track queen movements for animation
  useEffect(() => {
    setPrevQueens(queens);
  }, [queens]);

  // Highlight last move and affected squares
  useEffect(() => {
    if (lastMove) {
      const { row, col } = lastMove;
      const newHighlights = [];
      
      // Highlight the moved piece
      newHighlights.push(`${row}-${col}`);
      
      // Highlight entire row
      for (let c = 0; c < boardSize; c++) {
        if (c !== col) newHighlights.push(`${row}-${c}`);
      }
      
      // Highlight entire column
      for (let r = 0; r < boardSize; r++) {
        if (r !== row) newHighlights.push(`${r}-${col}`);
      }
      
      // Highlight diagonals
      for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
          if (Math.abs(r - row) === Math.abs(c - col) && !(r === row && c === col)) {
            newHighlights.push(`${r}-${c}`);
          }
        }
      }
      
      setHighlightedCells(newHighlights);
      const timer = setTimeout(() => setHighlightedCells([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastMove, boardSize]);

  const getQueenPosition = (row, col) => ({
    x: col * (100 / boardSize) + (50 / boardSize),
    y: row * (100 / boardSize) + (50 / boardSize)
  });

  const getCellBackground = (row, col) => {
    const isQueen = queens[row] === col;
    const isHighlighted = highlightedCells.includes(`${row}-${col}`);
    const isLastMove = lastMove?.row === row && lastMove?.col === col;
    const isAttacked = attackedSquares[`${row}-${col}`];

    if (isQueen) return conflicts > 0 ? 'bg-red-400/80' : 'bg-green-400/80';
    if (isLastMove) return isExploring ? 'bg-blue-400/60' : 'bg-yellow-400/60';
    if (isHighlighted || isAttacked) return 'bg-blue-400/30';
    return (row + col) % 2 === 0
      ? 'bg-amber-100 dark:bg-gray-700'
      : 'bg-amber-800 dark:bg-gray-600';
  };

  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const hasQueen = queens[row] === col;
        const isAttacked = attackedSquares[`${row}-${col}`] && !hasQueen;
        const prevPos = prevQueens[row] !== -1 ? getQueenPosition(row, prevQueens[row]) : null;
        const currentPos = getQueenPosition(row, col);
        const isLastMove = lastMove?.row === row && lastMove?.col === col;

        squares.push(
          <motion.div
            key={`${row}-${col}`}
            className={`absolute ${getCellBackground(row, col)} ${
              interactive ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
            }`}
            style={{
              width: `${100 / boardSize}%`,
              height: `${100 / boardSize}%`,
              left: `${col * (100 / boardSize)}%`,
              top: `${row * (100 / boardSize)}%`,
            }}
            onClick={() => interactive && onSquareClick?.(row, col)}
            whileHover={interactive ? { scale: 1.05 } : {}}
            whileTap={interactive ? { scale: 0.95 } : {}}
          >
            <AnimatePresence>
              {isAttacked && (
                <motion.div
                  className="absolute inset-0 bg-red-500/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>

            {hasQueen && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={prevPos ? {
                  x: `${prevPos.x - currentPos.x}%`,
                  y: `${prevPos.y - currentPos.y}%`,
                  scale: 1.2
                } : { scale: 0 }}
                animate={{ x: '0%', y: '0%', scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                  duration: 0.5
                }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.span
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ♕
                </motion.span>
              </motion.div>
            )}

            {isLastMove && (
              <motion.div
                className="absolute inset-0 border-2 border-yellow-500"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="relative w-full" style={{ paddingBottom: '100%' }}>
      {renderBoard()}
    </div>
  );
};

Chessboard.propTypes = {
  boardSize: PropTypes.number,
  queens: PropTypes.arrayOf(PropTypes.number),
  conflicts: PropTypes.number,
  onSquareClick: PropTypes.func,
  interactive: PropTypes.bool,
  lastMove: PropTypes.shape({
    row: PropTypes.number,
    col: PropTypes.number,
    type: PropTypes.string,
    from_row: PropTypes.number,
    from_col: PropTypes.number
  }),
  isExploring: PropTypes.bool,
  attackedSquares: PropTypes.object
};

Chessboard.defaultProps = {
  queens: [],
  conflicts: 0,
  interactive: true,
  attackedSquares: {}
};