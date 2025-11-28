// components/nqueens/MultiplayerPanel.jsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Users, Trophy } from 'lucide-react';

export const MultiplayerPanel = ({ boardSize }) => {
  const [mode, setMode] = useState(null); // 'collaborative' or 'competitive'
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('waiting'); // 'waiting' | 'playing' | 'finished'

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('wss://your-backend-url/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'player_joined':
          setPlayers(prev => [...prev, data.player]);
          break;
        case 'move_made':
          // Update board state
          break;
        case 'game_started':
          setGameState('playing');
          break;
        case 'game_ended':
          setGameState('finished');
          break;
      }
    };

    return () => ws.close();
  }, []);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setGameState('playing');
    // Initialize game via API
  };

  const makeMove = (row, col) => {
    // Send move to server
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="text-blue-500" /> Multiplayer Mode
      </h3>
      
      {!mode ? (
        <div className="space-y-4">
          <Button 
            onClick={() => startGame('collaborative')}
            className="w-full"
          >
            Collaborative Mode
          </Button>
          <Button 
            onClick={() => startGame('competitive')}
            className="w-full"
            variant="secondary"
          >
            Competitive Mode
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Mode:</span>
            <span className="capitalize">{mode}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="text-yellow-500" />
            <span>Time Left: {timeLeft}s</span>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="text-green-500" /> Players
            </h4>
            <div className="space-y-1">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2">
                  <span>{player.name}</span>
                  {player.score && (
                    <span className="ml-auto flex items-center gap-1">
                      <Trophy className="text-yellow-500" />
                      {player.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {gameState === 'finished' && (
            <Button 
              onClick={() => setMode(null)}
              className="w-full mt-4"
              variant="outline"
            >
              Return to Lobby
            </Button>
          )}
        </div>
      )}
    </div>
  );
};