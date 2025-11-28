// src/hooks/useWebSocket.js
import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (gameId) => {
  const [socket, setSocket] = useState(null);
  const [boardState, setBoardState] = useState(null);
  const [error, setError] = useState(null);

  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        ...message,
        gameId,
        timestamp: Date.now()
      }));
    }
  }, [socket, gameId]);

  useEffect(() => {
    const ws = new WebSocket(`wss://your-backend/ws?gameId=${gameId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'game_state':
          setBoardState(data.state);
          break;
        case 'game_over':
          setBoardState(prev => ({
            ...prev,
            ...data.state,
            winner: data.winner
          }));
          break;
        case 'error':
          setError(data.message);
          break;
      }
    };

    ws.onerror = (error) => {
      setError('WebSocket error');
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [gameId]);

  return { sendMessage, boardState, error };
};