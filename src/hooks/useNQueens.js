import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { useSounds } from './useSounds';

const FRONTEND_CONFIG = {
  BOARD_SIZE_MIN: 4,
  BOARD_SIZE_MAX: 8,
  STEP_INTERVAL_MS: 1500,
  MAX_LOG_ENTRIES: 100,
};

export const useNQueens = (initialSize = FRONTEND_CONFIG.BOARD_SIZE_MIN) => {
  const [boardSize, setBoardSize] = useState(initialSize);
  const [queens, setQueens] = useState([]);
  const [conflicts, setConflicts] = useState(0);
  const [attackedSquares, setAttackedSquares] = useState({});
  const [isSolving, setIsSolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Cliquez sur "Démarrer" pour commencer.');
  const { toast } = useToast();
  const { playSound } = useSounds();
  const solverInterval = useRef(null);
  const [stepCounter, setStepCounter] = useState(0);
  const [conflictHistory, setConflictHistory] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [learningParams, setLearningParams] = useState({
    learningRate: 0.1,
    discountFactor: 0.9,
    explorationRate: 0.3,
  });
  const [lastMove, setLastMove] = useState(null);
  const [qLearningParams, setQLearningParams] = useState({
    explorationRate: 0.3,
    isExploring: false
  });
  const startTimeRef = useRef(null);

  // Refs to track latest values
  const isSolvingRef = useRef(isSolving);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isSolvingRef.current = isSolving;
  }, [isSolving]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const api = axios.create({
    baseURL: '',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Helper functions for log formatting
  const formatTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const addLogEntry = (message, type = 'info') => {
    const timestamp = formatTimestamp();
    const formattedEntry = `[${timestamp}] ${message}`;
    
    setActionLog(prev => {
      const newLog = [formattedEntry, ...prev];
      return newLog.slice(0, FRONTEND_CONFIG.MAX_LOG_ENTRIES);
    });

    return formattedEntry;
  };

  const parseMoveDetails = (message) => {
    const moveMatch = message.match(/row (\d+) to column (\d+)/i);
    return moveMatch ? { row: parseInt(moveMatch[1]), col: parseInt(moveMatch[2]) } : null;
  };

  const handleMove = (action) => {
    setLastMove(action);
    setQLearningParams(prev => ({
      ...prev,
      isExploring: Math.random() < prev.explorationRate
    }));
  };

  const checkConnection = useCallback(async () => {
    try {
      const response = await api.get('/api/health');
      if (!isConnected && response.data?.ready) {
        toast({ title: 'Connecté', description: 'Connexion au backend établie' });
        setIsConnected(true);
        addLogEntry('✅ Connexion au backend établie', 'success');
      }
      return true;
    } catch (error) {
      console.error('Connection error:', error.message);
      if (isConnected) {
        toast({
          variant: 'destructive',
          title: 'Connexion perdue',
          description: 'Impossible de se connecter au backend',
        });
        addLogEntry('❌ Connexion au backend perdue', 'error');
      }
      setIsConnected(false);
      return false;
    }
  }, [isConnected, toast]);

  const resetBoard = useCallback(async (size) => {
    setIsLoading(true);
    setStatusMessage('Réinitialisation du plateau...');
    try {
      const response = await api.post('/api/reset', { size });
      const data = response.data;

      if (!data.queens || !Array.isArray(data.queens)) {
        throw new Error('Format de réponse invalide');
      }

      setQueens(data.queens);
      setConflicts(data.conflicts);
      setAttackedSquares(data.attackedSquares || {});
      setIsSolving(false);
      setIsPaused(false);
      setStatusMessage(data.message || 'Plateau réinitialisé');
      setStepCounter(0);
      setConflictHistory([]);
      setLastMove(null);
      setQLearningParams(prev => ({ ...prev, isExploring: false }));
      
      addLogEntry(`🔄 Plateau ${size}x${size} réinitialisé | Conflits: ${data.conflicts}`, 'system');
      startTimeRef.current = performance.now();

      if (solverInterval.current) {
        clearInterval(solverInterval.current);
        solverInterval.current = null;
      }
    } catch (error) {
      console.error('Reset error:', error);
      setStatusMessage('Échec de la réinitialisation');
      addLogEntry(`❌ Échec de la réinitialisation: ${error.message}`, 'error');
      toast({
        variant: 'destructive',
        title: 'Erreur de réinitialisation',
        description: error.response?.data?.message || error.message || 'Échec de la réinitialisation du plateau',
      });
    } finally {
      setIsLoading(false);
    }
  }, [api, toast]);

  const handlePauseResume = useCallback(() => {
    if (!isSolvingRef.current) return;
    const pausing = !isPausedRef.current;
    setIsPaused(pausing);
    isPausedRef.current = pausing;

    if (pausing) {
      playSound('pause');
      setStatusMessage('En pause');
      addLogEntry('⏸️ Algorithme en pause', 'system');
      toast({ title: '⏸️ En pause', description: 'Algorithme en pause' });
    } else {
      playSound('resume');
      setStatusMessage('Reprise...');
      addLogEntry('▶️ Algorithme repris', 'system');
      toast({ title: '▶️ Reprise', description: 'Algorithme repris' });
    }
  }, [toast, playSound]);

  const handleStart = async () => {
    if (isSolving || isLoading) return;
    setIsLoading(true);
    setStatusMessage('Démarrage du solveur...');
    startTimeRef.current = performance.now();

    try {
      const resetResponse = await api.post('/api/reset', { size: boardSize });
      setQueens(resetResponse.data.queens);
      setConflicts(resetResponse.data.conflicts);
      setAttackedSquares(resetResponse.data.attackedSquares || {});

      await api.post('/api/start', {
        boardSize,
        learningRate: learningParams.learningRate,
        discountFactor: learningParams.discountFactor,
        explorationRate: learningParams.explorationRate,
      });

      setIsSolving(true);
      isSolvingRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
      playSound('start');

      addLogEntry(
        `🚀 Démarrage apprentissage | Taille: ${boardSize}x${boardSize} | α=${learningParams.learningRate} γ=${learningParams.discountFactor} ε=${learningParams.explorationRate}`,
        'system'
      );

      if (solverInterval.current) {
        clearInterval(solverInterval.current);
      }

      solverInterval.current = setInterval(async () => {
        if (isPausedRef.current || !isSolvingRef.current) return;

        try {
          const stepResponse = await api.post('/api/step');
          const stepData = stepResponse.data;

          setQueens(stepData.queens || []);
          setConflicts(stepData.conflicts ?? 0);
          setAttackedSquares(stepData.attackedSquares || {});
          setStatusMessage(stepData.message || 'Étape exécutée');
          setStepCounter(stepData.step || 0);

          setConflictHistory(prev => [
            ...prev.slice(-49),
            { step: stepData.step, conflicts: stepData.conflicts },
          ]);

          // Parse and log move details
          const moveDetails = parseMoveDetails(stepData.message);
          if (moveDetails) {
            handleMove(moveDetails);
            addLogEntry(
              `♛ Étape ${stepData.step}: Reine rangée ${moveDetails.row} → colonne ${moveDetails.col} | Conflits: ${stepData.prevConflicts || '?'} → ${stepData.conflicts}`,
              'move'
            );
          } else {
            addLogEntry(stepData.message, 'info');
          }

          if (stepData.reward !== undefined) {
            addLogEntry(`💰 Récompense: ${stepData.reward.toFixed(2)}`, 'reward');
          }

          playSound(stepData.conflicts > 0 ? 'conflict' : 'move');

          if (stepData.done) {
            playSound('success');
            clearInterval(solverInterval.current);
            solverInterval.current = null;
            setIsSolving(false);
            isSolvingRef.current = false;
            
            const solvingTime = ((performance.now() - startTimeRef.current) / 1000).toFixed(2);
            addLogEntry(
              `🎉 Solution trouvée en ${stepData.step} étapes (${solvingTime}s)`,
              'success'
            );
            
            toast({
              title: '🎉 Solution trouvée !',
              description: `Solution trouvée en ${stepData.step} étapes (${solvingTime}s)`,
            });
          }
        } catch (error) {
          playSound('error');
          console.error('Step error:', error);
          setStatusMessage('Échec de l\'étape - ' + error.message);
          addLogEntry(`❌ Erreur d'étape: ${error.message}`, 'error');
          clearInterval(solverInterval.current);
          solverInterval.current = null;
          setIsSolving(false);
          isSolvingRef.current = false;
        }
      }, FRONTEND_CONFIG.STEP_INTERVAL_MS);

    } catch (error) {
      playSound('error');
      console.error('Start error:', error);
      setStatusMessage('Échec du démarrage - ' + error.message);
      addLogEntry(`❌ Échec du démarrage: ${error.message}`, 'error');
      toast({
        variant: 'destructive',
        title: 'Erreur de démarrage',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = useCallback(async () => {
    playSound('reset');
    await resetBoard(boardSize);
    addLogEntry('🔄 Plateau réinitialisé', 'system');
    toast({ title: '🔄 Réinitialisation', description: 'Le plateau a été réinitialisé' });
  }, [boardSize, resetBoard, toast, playSound]);

  const handleStep = useCallback(async () => {
    if (!isSolving) {
      await handleStart();
      handlePauseResume();
      return;
    }

    if (!isPaused) {
      handlePauseResume();
    } else {
      try {
        const response = await api.post('/api/step');
        const data = response.data;

        setQueens(data.queens);
        setConflicts(data.conflicts);
        setAttackedSquares(data.attackedSquares || {});
        setStatusMessage(data.message);
        setStepCounter(data.step);

        const moveDetails = parseMoveDetails(data.message);
        if (moveDetails) {
          handleMove(moveDetails);
          addLogEntry(
            `♛ Étape manuelle ${data.step}: Reine rangée ${moveDetails.row} → colonne ${moveDetails.col} | Conflits: ${data.prevConflicts || '?'} → ${data.conflicts}`,
            'move'
          );
        }

        if (data.reward !== undefined) {
          addLogEntry(`💰 Récompense: ${data.reward.toFixed(2)}`, 'reward');
        }

        setConflictHistory(prev => [...prev, {
          step: data.step,
          conflicts: data.conflicts,
        }]);

        playSound(data.conflicts > 0 ? 'conflict' : 'move');

        if (data.done) {
          playSound('success');
          setIsSolving(false);
          const solvingTime = ((performance.now() - startTimeRef.current) / 1000).toFixed(2);
          addLogEntry(
            `🎉 Solution trouvée en ${data.step} étapes (${solvingTime}s)`,
            'success'
          );
          toast({
            title: '🎉 Solution trouvée !',
            description: `Solution trouvée en ${data.step} étapes (${solvingTime}s)`,
          });
        }

        toast({
          title: 'Étape manuelle',
          description: 'Étape manuelle exécutée',
        });
      } catch (error) {
        playSound('error');
        addLogEntry(`❌ Erreur d'étape manuelle: ${error.message}`, 'error');
        toast({
          variant: 'destructive',
          title: 'Erreur d\'étape',
          description: error.response?.data?.message || 'Échec de l\'exécution de l\'étape',
        });
      }
    }
  }, [isSolving, isPaused, handleStart, handlePauseResume, api, toast, playSound]);

  useEffect(() => {
    const init = async () => {
      if (await checkConnection()) {
        const emptyBoard = Array(boardSize).fill(-1);
        setQueens(emptyBoard);
        setStatusMessage('Prêt - Cliquez sur "Démarrer" pour commencer');
        addLogEntry('✅ Système prêt', 'system');
      }
    };
    init();
    return () => {
      if (solverInterval.current) {
        clearInterval(solverInterval.current);
      }
    };
  }, [checkConnection, boardSize]);

  useEffect(() => {
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    boardSize,
    queens,
    conflicts,
    attackedSquares,
    isSolving,
    isPaused,
    isLoading,
    isConnected,
    statusMessage,
    BOARD_SIZE_MIN: FRONTEND_CONFIG.BOARD_SIZE_MIN,
    BOARD_SIZE_MAX: FRONTEND_CONFIG.BOARD_SIZE_MAX,
    conflictHistory,
    actionLog,
    stepCounter,
    learningParams,
    setLearningParams,
    lastMove,
    qLearningParams,
    clearLog: () => setActionLog([]),
    maxLogEntries: FRONTEND_CONFIG.MAX_LOG_ENTRIES,
    handleBoardSizeChange: (newSize) => {
      if (!isSolving) {
        setBoardSize(newSize);
        resetBoard(newSize);
      } else {
        toast({
          variant: 'destructive',
          title: 'Action bloquée',
          description: 'Veuillez réinitialiser avant de changer la taille du plateau',
        });
      }
    },
    handleStart,
    handlePauseResume,
    handleReset,
    handleStep,
    solutionFound: conflicts === 0 && stepCounter > 0 && !isSolving,
  };
};