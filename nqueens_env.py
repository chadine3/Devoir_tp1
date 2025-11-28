import numpy as np
from typing import List, Tuple, Dict

class NQueensEnv:
    def __init__(self, board_size: int = 8):
        if not (4 <= board_size <= 8):
            raise ValueError(f"Board size must be between 4 and 8, got {board_size}")
        self.board_size = board_size
        self.queens: List[int] = []
        self.reset()
    
    def reset(self, board_size: int = None) -> List[int]:
        """Reset the board with random queen placements"""
        if board_size is not None:
            self.board_size = board_size
        self.queens = np.random.randint(0, self.board_size, size=self.board_size).tolist()
        return self.queens.copy()
    
    def step(self, action: Tuple[int, int]) -> Tuple[List[int], float, bool]:
        """Execute an action (move a queen to a new column in a row)"""
        row, new_col = action
        if not (0 <= row < self.board_size and 0 <= new_col < self.board_size):
            raise ValueError(f"Invalid action: {action}")
        
        old_col = self.queens[row]
        old_conflicts = self.get_conflicts()
    
    # Make the move
        self.queens[row] = new_col
        new_conflicts = self.get_conflicts()
    
        done = new_conflicts == 0
    
    # Enhanced reward calculation
        if new_conflicts == 0:
            reward = 10.0  # Big reward for solution
        elif new_conflicts < old_conflicts:
            reward = 1.0 * (old_conflicts - new_conflicts)  # Scale reward with improvement
        elif new_conflicts > old_conflicts:
            reward = -1.0 * (new_conflicts - old_conflicts)  # Scale penalty with worsening
        else:
            reward = -0.5  # Stronger penalty for no improvement
        
        return self.queens.copy(), reward, done
    
    def get_conflicts(self) -> int:
        """Optimized conflict calculation using numpy"""
        queens = np.array(self.queens)
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
    
    def _count_conflicts_if_change(self, row: int, col: int) -> int:
        """Count conflicts if a queen were placed at (row, col)"""
        temp = self.queens.copy()
        temp[row] = col
        return self._calculate_conflicts(temp)
    
    def _calculate_conflicts(self, board: List[int]) -> int:
        queens = np.array(board)
        rows = np.arange(len(queens))

        _, counts = np.unique(queens, return_counts=True)
        col_conflicts = int(np.sum(counts * (counts - 1) // 2))

        diag1 = rows - queens
        diag2 = rows + queens
        _, counts1 = np.unique(diag1, return_counts=True)
        _, counts2 = np.unique(diag2, return_counts=True)
        diag_conflicts = int(np.sum(counts1 * (counts1 - 1) // 2) +
                             np.sum(counts2 * (counts2 - 1) // 2))

        return col_conflicts + diag_conflicts
    
    def get_attacked_squares(self) -> Dict[str, bool]:
        """Get all attacked squares with conflict types"""
        attacked = {}
        queen_positions = {(r, c) for r, c in enumerate(self.queens)}
        
        for r, c in enumerate(self.queens):
            # Mark row and column
            for i in range(self.board_size):
                if i != c:
                    attacked[f"{r}-{i}"] = True  # row
                if i != r:
                    attacked[f"{i}-{c}"] = True  # column
            
            # Mark diagonals
            for i in range(1, self.board_size):
                for dr, dc in [(1, 1), (1, -1), (-1, 1), (-1, -1)]:
                    nr, nc = r + i * dr, c + i * dc
                    if 0 <= nr < self.board_size and 0 <= nc < self.board_size:
                        attacked[f"{nr}-{nc}"] = True  # diagonal
        
        # Remove queen positions
        for r, c in queen_positions:
            attacked.pop(f"{r}-{c}", None)
            
        return attacked
