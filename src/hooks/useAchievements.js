import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const ACHIEVEMENTS = {
  FIRST_MOVE: {
    name: "First Move",
    description: "Make your first queen move",
    icon: "🚀",
    unlocked: false
  },
  CONFLICT_CRUSHER: {
    name: "Conflict Crusher",
    description: "Solve a board with 0 conflicts",
    icon: "💪",
    unlocked: false
  },
  SPEED_SOLVER: {
    name: "Speed Solver",
    description: "Solve a board in under 30 seconds",
    icon: "⏱️",
    unlocked: false
  }
};

export const useAchievements = (stepCounter, conflicts, isSolving) => {
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const { toast } = useToast();
  const [timer, setTimer] = useState(0);

  // Track solving time
  useEffect(() => {
    let interval;
    if (isSolving) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSolving]);

  // Check achievements
  useEffect(() => {
    const newAchievements = { ...achievements };

    // First move achievement
    if (stepCounter > 0 && !newAchievements.FIRST_MOVE.unlocked) {
      newAchievements.FIRST_MOVE.unlocked = true;
      toast({
        title: `${newAchievements.FIRST_MOVE.icon} Achievement Unlocked!`,
        description: newAchievements.FIRST_MOVE.name
      });
    }

    // Conflict crusher
    if (conflicts === 0 && stepCounter > 0 && !newAchievements.CONFLICT_CRUSHER.unlocked) {
      newAchievements.CONFLICT_CRUSHER.unlocked = true;
      toast({
        title: `${newAchievements.CONFLICT_CRUSHER.icon} Achievement Unlocked!`,
        description: newAchievements.CONFLICT_CRUSHER.name
      });
    }

    // Speed solver
    if (conflicts === 0 && timer > 0 && timer < 30 && !newAchievements.SPEED_SOLVER.unlocked) {
      newAchievements.SPEED_SOLVER.unlocked = true;
      toast({
        title: `${newAchievements.SPEED_SOLVER.icon} Achievement Unlocked!`,
        description: newAchievements.SPEED_SOLVER.name
      });
    }

    setAchievements(newAchievements);
  }, [stepCounter, conflicts, timer]);

  return { achievements };
};