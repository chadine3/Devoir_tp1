import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Zap, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';

const ControlsPanel = ({
  boardSize,
  conflicts,
  isSolving,
  isPaused,
  statusMessage,
  BOARD_SIZE_MIN,
  BOARD_SIZE_MAX,
  handleBoardSizeChange,
  handleStart,
  handlePauseResume,
  handleReset,
  handleStep,
}) => {
  const isSolved = conflicts === 0 && !isSolving;

  return (
    <>
      <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-6">
        Contrôles N-Reines RL
      </h2>

      <div className="space-y-3">
        <Label htmlFor="board-size" className="themed-label flex justify-between items-center">
          <span>Taille (N): {boardSize}</span>
          <span className="themed-label-sm">({BOARD_SIZE_MIN}-{BOARD_SIZE_MAX})</span>
        </Label>
        <Slider
          id="board-size"
          min={BOARD_SIZE_MIN}
          max={BOARD_SIZE_MAX}
          step={1}
          value={[boardSize]}
          onValueChange={(value) => handleBoardSizeChange(value[0])}
          disabled={isSolving}
          className="themed-slider"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <Button
          onClick={handleStart}
          disabled={isSolving}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:scale-100"
        >
          <Play className="mr-2 h-4 w-4" /> Démarrer
        </Button>
        <Button
          onClick={handlePauseResume}
          disabled={!isSolving}
          variant="secondary"
          className={`font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:scale-100 ${
            isPaused
              ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white'
              : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white'
          }`}
        >
          {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {isPaused ? 'Reprendre' : 'Pause'}
        </Button>
        <Button
          onClick={handleStep}
          disabled={isSolving && !isPaused}
          variant="secondary"
          className="bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg col-span-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <SkipForward className="mr-2 h-4 w-4" /> Étape Suivante
        </Button>
        <Button
          onClick={handleReset}
          variant="destructive"
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg col-span-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
        </Button>
      </div>

      <div className="pt-6 space-y-3 text-center">
        <h3 className="themed-status-title">Statut</h3>
        <p className="status-box">
          {statusMessage}
        </p>
        <div className="conflict-display">
          <Zap className={`conflict-icon ${conflicts > 0 ? 'conflict-icon-active' : ''} ${isSolved ? 'conflict-icon-solved' : 'text-yellow-500 dark:text-yellow-400'}`} />
          <span>Conflits: {conflicts}</span>
        </div>
      </div>
    </>
  );
};

export default ControlsPanel;