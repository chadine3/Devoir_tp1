import numpy as np
import random
from typing import List, Tuple, Dict
import math
import config  # Make sure config.py defines the constants used below

class QLearningAgent:
    def __init__(self, state_space_size: int, action_space_size: int,
                 learning_rate: float = config.LEARNING_RATE, 
                 discount_factor: float = config.DISCOUNT_FACTOR,
                 exploration_rate: float = config.EXPLORATION_RATE, 
                 exploration_decay: float = config.EXPLORATION_DECAY):
        self.state_space_size = state_space_size
        self.action_space_size = action_space_size
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.exploration_rate = exploration_rate
        self.base_exploration_rate = exploration_rate
        self.exploration_decay = exploration_decay
        self.q_table = {}
        self.visited_states = set()
    
    def get_state_key(self, state: List[int]) -> Tuple[int]:
        """Convert state to a hashable key"""
        return tuple(state)
    
    def get_q_value(self, state: List[int], action: Tuple[int, int]) -> float:
        """Get Q-value for state-action pair"""
        state_key = self.get_state_key(state)
        return self.q_table.get((state_key, action), 0.0)
    
    def choose_action(self, state: List[int]) -> Tuple[int, int]:
        """Choose action using ε-greedy policy with decay"""
        state_key = self.get_state_key(state)
    
    # Decay exploration rate but keep minimum
        self.exploration_rate = max(
            config.MIN_EXPLORATION_RATE,
            self.exploration_rate * self.exploration_decay
        )
    
        if random.random() < self.exploration_rate or state_key not in self.visited_states:
        # Exploration with preference for less conflicted moves
            row = random.randint(0, self.state_space_size - 1)
            possible_cols = [c for c in range(self.action_space_size) if c != state[row]]
        
            if not possible_cols:
                return (0, 0)  # Fallback if no possible moves
        
        # Score each possible move by potential conflict reduction
            scored_cols = []
            for col in possible_cols:
                temp_state = list(state)
                temp_state[row] = col
            # Calculate conflicts using the environment's method
                conflicts = self._count_conflicts_if_change(row, col)
                scored_cols.append((col, conflicts))
        
        # Prefer moves with lower conflicts
            scored_cols.sort(key=lambda x: x[1])
            new_col = scored_cols[0][0] if scored_cols else state[row]
        
            return (row, new_col)
        else:
        # Exploitation: best known action
            best_value = -math.inf
            best_actions = []
        
        # Evaluate all possible actions
            for row in range(self.state_space_size):
                current_col = state[row]
                for new_col in range(self.action_space_size):
                    if new_col != current_col:  # Only consider moves
                        action = (row, new_col)
                        value = self.get_q_value(state, action)
                    
                        if value > best_value:
                            best_value = value
                            best_actions = [action]
                        elif value == best_value:
                            best_actions.append(action)
        
            return random.choice(best_actions) if best_actions else (0, 0)

    def _count_conflicts_if_change(self, row: int, col: int) -> int:
        """Count conflicts if a queen were placed at (row, col)"""
    # Create a temporary state with the proposed move
        temp_state = list(self.env.queens)
        temp_state[row] = col
    
    # Calculate conflicts using the same method as the environment
        queens = np.array(temp_state)
        rows = np.arange(len(queens))

    # Column conflicts
        _, counts = np.unique(queens, return_counts=True)
        col_conflicts = int(np.sum(counts * (counts - 1) // 2))

    # Diagonal conflicts
        diag1 = rows - queens
        diag2 = rows + queens
        _, counts1 = np.unique(diag1, return_counts=True)
        _, counts2 = np.unique(diag2, return_counts=True)
        diag_conflicts = int(np.sum(counts1 * (counts1 - 1) // 2) +
                         np.sum(counts2 * (counts2 - 1) // 2))

        return col_conflicts + diag_conflicts

    def learn(self, state: List[int], action: Tuple[int, int],
              reward: float, new_state: List[int], done: bool) -> None:
        """Update Q-table using Bellman equation"""
        state_key = self.get_state_key(state)
        self.visited_states.add(state_key)
        
        current_q = self.get_q_value(state, action)
        
        if done:
            max_future_q = 0
        else:
            max_future_q = max(
                [self.get_q_value(new_state, (r, c))
                 for r in range(self.state_space_size)
                 for c in range(self.action_space_size)
                 if new_state[r] != c],
                default=0
            )
        
        # Bellman equation with learning rate
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_future_q - current_q
        )
        
        # Update Q-table
        self.q_table[(state_key, action)] = new_q
