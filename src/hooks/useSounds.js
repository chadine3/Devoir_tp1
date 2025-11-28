import { useEffect } from 'react';

export const useSounds = () => {
  const playSound = (type) => {
    if (typeof window === 'undefined') return;
    
    const sounds = {
      move: '/sounds/move.mp3',
      conflict: '/sounds/conflict.mp3',
      solve: '/sounds/success.mp3'
    };

    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  return { playSound };
};