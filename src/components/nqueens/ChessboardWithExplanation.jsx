import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const ChessboardWithExplanation = ({
  boardSize = 4,
  queens = [],
  attackedSquares = {},
  conflicts = 0,
  explorationRate = 0.5,
  lastMove = null,
  isExploring = false
}) => {
  const [prevQueens, setPrevQueens] = useState(queens);
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState([]);

  useEffect(() => {
    setPrevQueens(queens);
  }, [queens]);

  // Mise en évidence des mouvements et zones affectées
  useEffect(() => {
    if (lastMove) {
      const { row, col } = lastMove;
      const newHighlights = [];
      
      // Case du dernier mouvement
      newHighlights.push(`${row}-${col}`);
      
      // Ligne entière
      for (let c = 0; c < boardSize; c++) {
        if (c !== col) newHighlights.push(`${row}-${c}`);
      }
      
      // Colonne entière
      for (let r = 0; r < boardSize; r++) {
        if (r !== row) newHighlights.push(`${r}-${col}`);
      }
      
      // Diagonales
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
    if (isLastMove) return 'bg-yellow-400/60';
    if (isHighlighted || isAttacked) return 'bg-blue-400/30';
    return (row + col) % 2 === 0
      ? 'bg-amber-100 dark:bg-gray-700'
      : 'bg-amber-800 dark:bg-gray-600';
  };

  return (
    <div className="relative">
      {/* Échiquier */}
      <div
        className="relative w-full rounded overflow-hidden shadow-lg"
        style={{ paddingBottom: '100%' }}
      >
        {Array(boardSize).fill(0).map((_, row) =>
          Array(boardSize).fill(0).map((_, col) => {
            const hasQueen = queens[row] === col;
            const isAttacked = attackedSquares[`${row}-${col}`];
            const prevPos = prevQueens[row] !== -1 ? getQueenPosition(row, prevQueens[row]) : null;
            const currentPos = getQueenPosition(row, col);
            const isLastMove = lastMove?.row === row && lastMove?.col === col;

            return (
              <motion.div
                key={`${row}-${col}`}
                className={`absolute ${getCellBackground(row, col)}`}
                style={{
                  width: `${100 / boardSize}%`,
                  height: `${100 / boardSize}%`,
                  left: `${col * (100 / boardSize)}%`,
                  top: `${row * (100 / boardSize)}%`
                }}
              >
                <AnimatePresence>
                  {(isAttacked && !hasQueen) && (
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
          })
        )}
      </div>

      {/* Contrôles et indicateurs */}
      <div className="flex justify-between items-center my-4 px-2">
        <div className="flex items-center">
          <span className="text-xs mr-1">🔍</span>
          <div className="w-24 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${explorationRate * 100}%` }}
            />
          </div>
          <span className="text-xs ml-1">💡</span>
        </div>

        <button
          onClick={() => setExplanationVisible(!explanationVisible)}
          className="text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {explanationVisible ? 'Masquer détails' : 'Afficher détails'}
        </button>
      </div>

      {/* Panneau d'explication */}
      <AnimatePresence>
        {explanationVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-inner mb-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <strong className="flex items-center">
                  <span className="mr-1">🔍</span>
                  Exploration ({Math.round(explorationRate * 100)}%)
                </strong>
                <p className="mt-1">Teste des positions aléatoires pour découvrir de meilleures solutions.</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <strong className="flex items-center">
                  <span className="mr-1">💡</span>
                  Exploitation ({Math.round((1 - explorationRate) * 100)}%)
                </strong>
                <p className="mt-1">Utilise les positions connues pour optimiser les résultats.</p>
              </div>
            </div>
            
            {lastMove && (
              <div className="mt-3 text-center italic">
                Dernier mouvement: {isExploring ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Exploration (rangée {lastMove.row + 1}, colonne {lastMove.col + 1})
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Exploitation (rangée {lastMove.row + 1}, colonne {lastMove.col + 1})
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Légende */}
      <div className="flex flex-wrap justify-center gap-3 text-xs mt-3">
        <div className="flex items-center bg-white/80 dark:bg-gray-700/80 px-2 py-1 rounded-full">
          <div className="w-3 h-3 bg-green-400/80 mr-1.5 rounded-sm" />
          <span>Reine valide</span>
        </div>
        <div className="flex items-center bg-white/80 dark:bg-gray-700/80 px-2 py-1 rounded-full">
          <div className="w-3 h-3 bg-red-400/80 mr-1.5 rounded-sm" />
          <span>Reine en conflit</span>
        </div>
      
      </div>
    </div>
  );
};

export default ChessboardWithExplanation;