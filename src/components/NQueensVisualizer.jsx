import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Changed from next/link
import { useNQueens } from '@/hooks/useNQueens';
import { useAchievements } from '@/hooks/useAchievements';
import ControlsPanel from '@/components/nqueens/ControlsPanel';
import ChessboardWithExplanation from '@/components/nqueens/ChessboardWithExplanation';
import RewardChart from '@/components/nqueens/RewardChart';
import AgentLog from '@/components/nqueens/AgentLog';
import LearningParamsPanel from '@/components/nqueens/LearningParamsPanel';
import { ComparisonPanel } from '@/components/nqueens/ComparisonPanel';
import { Button } from '@/components/ui/button';

const NQueensVisualizer = () => {
  const {
    boardSize,
    queens,
    conflicts,
    isSolving,
    isPaused,
    isLoading,
    isConnected,
    statusMessage,
    BOARD_SIZE_MIN,
    BOARD_SIZE_MAX,
    conflictHistory,
    actionLog,
    learningParams,
    setLearningParams,
    handleBoardSizeChange,
    handleStart,
    handlePauseResume,
    handleReset,
    handleStep,
    solutionFound,
    stepCounter,
    lastMove,
    qLearningParams,
  } = useNQueens();

  const { achievements } = useAchievements(stepCounter, conflicts, isSolving);

  return (
    <div className="container mx-auto px-4 py-8">
      {!isConnected && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          ❌ Backend non connecté - Vérifiez que le serveur Python est en cours d'exécution
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          <ControlsPanel
            boardSize={boardSize}
            conflicts={conflicts}
            isSolving={isSolving}
            isPaused={isPaused}
            statusMessage={statusMessage}
            BOARD_SIZE_MIN={BOARD_SIZE_MIN}
            BOARD_SIZE_MAX={BOARD_SIZE_MAX}
            handleBoardSizeChange={handleBoardSizeChange}
            handleStart={handleStart}
            handlePauseResume={handlePauseResume}
            handleReset={handleReset}
            handleStep={handleStep}
          />

          {/* Updated Link component */}
          <Link to="/multiplayer">
            <Button variant="outline" className="w-full">
              🎮 Multiplayer Challenge
            </Button>
          </Link>

          <LearningParamsPanel
            params={learningParams}
            setParams={setLearningParams}
            disabled={isSolving}
          />
        </div>

        {/* Center Panel - Chessboard */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center dark:text-white">
            Problème des {boardSize} Reines
          </h1>

          <ChessboardWithExplanation 
            queens={queens}
            conflicts={conflicts}
            boardSize={boardSize}
            explorationRate={qLearningParams.explorationRate}
            lastMove={lastMove}
            isExploring={qLearningParams.isExploring}
          />

          <div className="h-[400px] overflow-y-auto border rounded-lg p-4">
            <RewardChart history={conflictHistory} />
          </div>

          <ComparisonPanel 
            boardSize={boardSize} 
            className={isSolving ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>

        {/* Right Panel - Logs */}
        <div>
          <AgentLog log={actionLog} />
        </div>
      </div>

      {/* Achievements Panel */}
      <div className="fixed bottom-24 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-30 max-w-xs">
        <h3 className="font-bold mb-2 dark:text-white">🏆 Achievements</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.values(achievements).map((achievement) => (
            <motion.div
              key={achievement.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: achievement.unlocked ? 1 : 0.5, y: 0 }}
              className={`flex items-center p-2 rounded ${
                achievement.unlocked
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <span className="mr-2">{achievement.icon}</span>
              <div>
                <p className="font-medium dark:text-white">{achievement.name}</p>
                <p className="text-sm dark:text-gray-300">{achievement.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {solutionFound && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-30"
        >
          🎉 Solution Trouvée ! 🎉
        </motion.div>
      )}
    </div>
  );
};

export default NQueensVisualizer;
