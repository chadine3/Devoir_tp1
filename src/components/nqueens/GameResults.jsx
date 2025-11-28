// src/components/nqueens/GameResults.jsx
import { Button } from '@/components/ui/button';

export const GameResults = ({ time, moves, winner, onRematch }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-2xl font-bold mb-4 dark:text-white">Game Over!</h3>
      <p className="text-lg mb-2">Winner: <span className="font-bold">{winner}</span></p>
      <p className="mb-2">Time: {time} seconds</p>
      <p className="mb-6">Moves: {moves}</p>
      <Button onClick={onRematch} className="w-full">
        Play Again
      </Button>
    </div>
  );
};