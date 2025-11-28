import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NQueensVisualizer from '@/components/NQueensVisualizer';
import MultiplayerPage from '@/pages/Multiplayer';
import AIChallengePage from '@/pages/multiplayer/ai-challenge';
import PlayerChallengePage from '@/pages/multiplayer/player-challenge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";


function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="App relative min-h-screen bg-background text-foreground">
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<NQueensVisualizer />} />
          <Route path="/multiplayer" element={<MultiplayerPage />} />
          <Route path="/multiplayer/ai" element={<AIChallengePage />} /> {/* Add this line */}
          <Route path="/multiplayer/ai/:gameId" element={<AIChallengePage />} />
          <Route path="/multiplayer/player" element={<PlayerChallengePage />} />
          <Route path="/multiplayer/player/:gameId" element={<PlayerChallengePage />} />
        </Routes>
        <Toaster />
        
        <style jsx global>{`
          * {
            transition: background-color 0.3s ease, border-color 0.3s ease;
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}

export default App;