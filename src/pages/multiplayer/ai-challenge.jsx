import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MultiplayerBoard } from '@/components/nqueens/MultiplayerBoard';
import { GameResults } from '@/components/nqueens/GameResults';
import { Timer, Users, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AIChallengePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [boardSize] = useState(8);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState('waiting');
  const [playerId, setPlayerId] = useState(null);
  const [aiDifficulty] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [boardState, setBoardState] = useState({
    queens: Array(8).fill(-1),
    conflicts: 0,
    current_turn: 0,
    phase: 'placement',
    placed_queens: 0,
    moves: 0,
    winner: null,
    players: []
  });

  const updateGameState = (data) => {
    console.log('Updating game state with:', data);
    setBoardState(prev => ({
      ...prev,
      queens: data.queens || prev.queens,
      conflicts: data.conflicts ?? prev.conflicts,
      current_turn: data.current_turn ?? prev.current_turn,
      phase: data.phase || prev.phase,
      placed_queens: data.placed_queens ?? prev.placed_queens,
      moves: data.moves ?? prev.moves,
      winner: data.winner ?? data.winner_id ?? prev.winner,
      players: data.players || prev.players
    }));
  };

  const setupGame = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!gameId || gameId === 'undefined') {
      // Create new game
        const createRes = await fetch(`${API_BASE}/api/multiplayer/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: boardSize })
        });

        if (!createRes.ok) throw new Error('Failed to create game');
        const { game_id } = await createRes.json();

      // Join as human player (will be assigned ID 0)
        const humanRes = await fetch(`${API_BASE}/api/multiplayer/join/${game_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai: false })
        });

        if (!humanRes.ok) throw new Error('Failed to join as human');
        const humanData = await humanRes.json();
        setPlayerId(humanData.player_id);

      // Add AI opponent (will be assigned ID 1)
        const aiRes = await fetch(`${API_BASE}/api/multiplayer/join/${game_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai: true, difficulty: aiDifficulty })
        });

        if (!aiRes.ok) throw new Error('Failed to add AI opponent');

      // Get updated game state
        const finalStateRes = await fetch(`${API_BASE}/api/multiplayer/state/${game_id}`);
        if (!finalStateRes.ok) throw new Error('Failed to get game state');
      
        const updatedGameState = await finalStateRes.json();
        updateGameState(updatedGameState);
        setGameState('playing');
        navigate(`/multiplayer/ai/${game_id}`, { replace: true });
        return;
      }

    // Join existing game
        console.log('Joining existing game:', gameId);

    // First verify game exists
        const verifyRes = await fetch(`${API_BASE}/api/multiplayer/state/${gameId}`);
        if (!verifyRes.ok) {
          throw new Error('Game not found or expired');
        }

        const verifyData = await verifyRes.json();

    // If game already has 2 players, just observe
        if (verifyData.players?.length >= 2) {
          console.log('Game already full, observing');
          setPlayerId(null); // Observer mode
          updateGameState(verifyData);
          setGameState('playing');
          return;
        }

    // Join as human player
        const joinRes = await fetch(`${API_BASE}/api/multiplayer/join/${gameId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai: false })
        });

        if (!joinRes.ok) {
          const error = await joinRes.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to join game');
        }

        const joinData = await joinRes.json();
        setPlayerId(joinData.player_id);
        console.log('Joined as player:', joinData.player_id);

    // Get updated game state
        const stateRes = await fetch(`${API_BASE}/api/multiplayer/state/${gameId}`);
        if (!stateRes.ok) {
          throw new Error('Failed to get game state');
        }

        const gameState = await stateRes.json();
        console.log('Current game state:', gameState);
        updateGameState(gameState);
        setGameState('playing');

      } catch (err) {
      console.error('Game setup error:', err);
      setError(err.message);
      toast.error(err.message);
      setTimeout(() => navigate('/multiplayer'), 2000);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    setupGame();
    return () => {
      // Cleanup if component unmounts
      if (gameId && gameState !== 'finished' && playerId !== null) {
        console.log('Component unmounting - leaving game...');
        fetch(`${API_BASE}/api/multiplayer/leave/${gameId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: playerId })
        })
        .catch(err => console.log('Cleanup failed (non-critical):', err));
      }
    };
  }, [gameId]);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => setTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleMove = async (row, col, fromRow = null) => {
    try {
      if (!gameId || playerId === null) {
        throw new Error('Game not ready');
      }

      if (boardState.current_turn !== 0) {
        throw new Error("Not your turn");
      }

      const moveData = {
        player_id: 0,
        move: { phase: boardState.phase }
      }; 

      if (boardState.phase === 'placement') {
        moveData.move.row = row;
        moveData.move.col = col;
      } else {
        moveData.move.from_row = fromRow;
        moveData.move.to_row = row;
        moveData.move.to_col = col;
      }

        const response = await fetch(`${API_BASE}/api/multiplayer/move/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Move failed');
      }

      const data = await response.json();
      updateGameState(data);

      if (data.done) {
        setGameState('finished');
        return;
      }

    // If it's now AI's turn, trigger AI move
      if (data.current_turn === 1) {
        setLoading(true);
        pollForAIMove();
      }
    } catch (err) {
      console.error('Move error:', err);
      toast.error(err.message);
      setLoading(false);
    }
  };
  const pollForAIMove = async () => {
    try {
    // First check if it's really AI's turn
      const stateRes = await fetch(`${API_BASE}/api/multiplayer/state/${gameId}`);
      if (!stateRes.ok) {
        setLoading(false);
        return;
      }

      const currentState = await stateRes.json();
    
    // Verify there is an AI player and it's their turn
      const aiPlayer = currentState.players?.find(p => p.is_ai);
      if (!aiPlayer || currentState.current_turn !== aiPlayer.id) {
        setLoading(false);
        return;
      }

    // Request AI to make a move
      const aiMoveRes = await fetch(`${API_BASE}/api/multiplayer/ai-move/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!aiMoveRes.ok) {
        const error = await aiMoveRes.json().catch(() => ({}));
        throw new Error(error.error || 'AI move failed');
      }

      const newState = await aiMoveRes.json();
      updateGameState(newState);
      setLoading(false);

      if (newState.done) {
        setGameState('finished');
      }
    } catch (err) {
      console.error('AI move error:', err);
      setLoading(false);
    
    // Fallback: check state again after delay
      setTimeout(async () => {
        const stateRes = await fetch(`${API_BASE}/api/multiplayer/state/${gameId}`);
        if (stateRes.ok) {
          const state = await stateRes.json();
          updateGameState(state);
          if (state.current_turn === 1) { // Assuming AI is always player 1
            pollForAIMove();
          }
        }
      }, 500);
    }
  };

  const handleRematch = () => {
    navigate('/multiplayer/ai', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500 text-lg">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Try Reconnecting
        </Button>
        <Button onClick={() => navigate('/multiplayer')}>
          Return to Lobby
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => navigate('/multiplayer')} variant="ghost">
          ← Back to Lobby
        </Button>
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> 
          AI Challenge ({aiDifficulty}): {time}s
        </h1>
      </div>

      {gameState === 'finished' ? (
        <GameResults
          time={time}
          moves={boardState.moves}
          winner={boardState.winner === playerId ? 'You' : 'AI'}
          onRematch={handleRematch}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MultiplayerBoard
              boardSize={boardSize}
              queens={boardState.queens}
              conflicts={boardState.conflicts}
              currentTurn={boardState.current_turn}
              playerId={playerId}
              phase={boardState.phase}
              placedQueens={boardState.placed_queens}
              onMove={handleMove}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="text-blue-500" /> Players
              </h3>
              <div className="mt-2 space-y-2">
                {boardState.players?.filter((p, i, arr) => arr.findIndex(t => t.id === p.id) === i).map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <span>
                      {player.is_ai ? `AI (${player.difficulty})` : `You`}
                    </span>
                    {boardState.current_turn === player.id && (
                      <span className="text-sm text-green-500">
                        {player.is_ai ? 'AI thinking...' : 'Your turn!'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold flex items-center gap-2">
                <Timer className="text-purple-500" /> Game Stats
              </h3>
              <div className="mt-2 space-y-2">
                <p>Time: {time} seconds</p>
                <p>Conflicts: {boardState.conflicts}</p>
                <p>Moves: {boardState.moves}</p>
                <p>Phase: {boardState.phase === 'placement' ? 'Placement' : 'Correction'}</p>
                {boardState.phase === 'placement' && (
                  <p>Queens placed: {boardState.placed_queens}/{boardSize}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChallengePage;