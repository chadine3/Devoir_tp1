import { motion } from 'framer-motion';

const MiniChessboard = ({ solution, boardSize }) => {
  if (!solution || !Array.isArray(solution)) return null;

  return (
    <div className="mt-4">
      <div 
        className="grid gap-px bg-gray-300 dark:bg-gray-700 p-1 rounded-md shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          width: `${boardSize * 1.5}rem`,  // Adjusted for compact size
          height: `${boardSize * 1.5}rem`,
        }}
      >
        {solution.map((col, row) => (
          <div
            key={`${row}-${col}`}
            className={`relative flex items-center justify-center ${
              (row + col) % 2 === 0 
                ? 'bg-[var(--square-light)]' 
                : 'bg-[var(--square-dark)]'
            }`}
          >
            {col !== undefined && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl text-yellow-500 dark:text-yellow-300 drop-shadow-md"
              >
                ♕
              </motion.span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniChessboard;