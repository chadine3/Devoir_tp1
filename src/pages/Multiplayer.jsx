import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MultiplayerPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const startAIMatch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ai', size: 8 })
      });
    
      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const data = await response.json();
    // Use game_id from backend response (snake_case)
      navigate(`/multiplayer/ai/${data.game_id}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    // Create a new game ID client-side as fallback
      const fallbackId = `local-${Date.now()}`;
      navigate(`/multiplayer/ai/${fallbackId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startPlayerMatch = async () => {
    setIsLoading(true);
    try {
      // Create game first
      const response = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'player', size: 8 })
      });
      const { gameId } = await response.json();
      navigate(`/multiplayer/player/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      navigate('/multiplayer/player'); // Fallback to basic player challenge
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center dark:text-white">
          Challenge Mode
        </h1>
        
        <div className="space-y-4">
          <Button
            onClick={startAIMatch}
            disabled={isLoading}
            className="w-full py-6 text-lg"
          >
            🏆 Challenge AI
            <p className="text-sm mt-1 font-normal">
              Compete against our RL-powered AI
            </p>
          </Button>
          
          <Button
            onClick={startPlayerMatch}
            disabled={isLoading}
            className="w-full py-6 text-lg"
            variant="secondary"
          >
            👥 Challenge Another Player
            <p className="text-sm mt-1 font-normal">
              Play against a friend in real-time
            </p>
          </Button>

          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="w-full"
          >
            ← Back to Main Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerPage;