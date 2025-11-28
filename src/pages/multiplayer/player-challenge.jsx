import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChessboardWithExplanation from '@/components/nqueens/ChessboardWithExplanation';
import { Timer, Users, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlayerChallengePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState(8);
  const [queens, setQueens] = useState([]);
  const [conflicts, setConflicts] = useState(0);
  const [time, setTime] = useState(0);
  const [playerTimes, setPlayerTimes] = useState({ player1: 0, player2: 0 });
  const [gameState, setGameState] = useState('waiting'); // 'waiting' | 'playing' | 'finished'
  const [currentTurn, setCurrentTurn] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [phase, setPhase] = useState('placement');
  const [placedQueens, setPlacedQueens] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize game
  useEffect(() => {
    const setupGame = async () => {
      try {
        setLoading(true);
        
        if (!gameId) {
          const createResponse = await fetch('/api/multiplayer/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: boardSize })
          });

          if (!createResponse.ok) throw new Error('Failed to create game');
          
          const createData = await createResponse.json();
          navigate(`/multiplayer/player/${createData.game_id}`, { replace: true });
          return;
        }

        // Join existing game
        const joinResponse = await fetch(`/api/multiplayer/join/${gameId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!joinResponse.ok) throw new Error('Failed to join game');
        
        const joinData = await joinResponse.json();
        setPlayerId(joinData.player_id);
        setOpponentId(joinData.opponent_id);
        setQueens(joinData.queens);
        setConflicts(joinData.conflicts);
        setCurrentTurn(joinData.current_turn);
        setPhase(joinData.phase);
        setPlacedQueens(joinData.placed_queens);
        setGameState('playing');
        
        // Set up WebSocket connection for real-time updates
        setupWebSocket(joinData.game_id, joinData.player_id);
      } catch (err) {
        console.error('Game setup error:', err);
        toast.error(err.message);
        setTimeout(() => navigate('/multiplayer'), 2000);
      } finally {
        setLoading(false);
      }
    };

    setupGame();
  }, [gameId, boardSize, navigate]);

  const setupWebSocket = (gameId, playerId) => {
    const ws = new WebSocket(`wss://your-api-url/game/${gameId}/ws?player=${playerId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'move':
          setQueens(data.queens);
          setConflicts(data.conflicts);
          setCurrentTurn(data.current_turn);
          setPhase(data.phase);
          setPlacedQueens(data.placed_queens);
          break;
        case 'game_over':
          setGameState('finished');
          break;
      }
    };
  };

  const handleMove = async (row, col) => {
    if (currentTurn !== playerId || gameState !== 'playing') return;
    
    try {
      const response = await fetch(`/api/multiplayer/move/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          move: { row, col, phase }
        })
      });

      if (!response.ok) throw new Error('Move failed');
      
      const data = await response.json();
      setQueens(data.queens);
      setConflicts(data.conflicts);
      setCurrentTurn(data.current_turn);
      setPhase(data.phase);
      setPlacedQueens(data.placed_queens);
      
      if (data.game_over) setGameState('finished');
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Move failed');
    }
  };

  const handleRematch = () => {
    navigate('/multiplayer/player');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => navigate('/multiplayer')} variant="ghost">
          ← Back to Lobby
        </Button>
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Player Challenge
        </h1>
      </div>

      {gameState === 'finished' ? (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Game Over!</h2>
          <Button onClick={handleRematch}>Rematch</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChessboardWithExplanation
              boardSize={boardSize}
              queens={queens}
              conflicts={conflicts}
              onMove={handleMove}
              isPlayerTurn={currentTurn === playerId}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="text-blue-500" /> Players
              </h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span>You</span>
                  {currentTurn === playerId && (
                    <span className="text-sm text-green-500">Your turn!</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Opponent</span>
                  {currentTurn !== playerId && (
                    <span className="text-sm text-yellow-500">Thinking...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold flex items-center gap-2">
                <Timer className="text-purple-500" /> Game Stats
              </h3>
              <div className="mt-2 space-y-2">
                <p>Phase: {phase === 'placement' ? 'Placement' : 'Correction'}</p>
                {phase === 'placement' && (
                  <p>Queens placed: {placedQueens}/{boardSize}</p>
                )}
                <p>Conflicts: {conflicts}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerChallengePage;