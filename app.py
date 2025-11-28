from flask import Flask, request, jsonify
from flask_cors import CORS
from nqueens_env import NQueensEnv
from qlearning import QLearningAgent
import config
import time
import logging
from json import JSONEncoder
import numpy as np
import random
import tracemalloc
import uuid
from datetime import datetime

class CustomJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app = Flask(__name__)
app.json_encoder = CustomJSONEncoder

# Enhanced CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
env = None
agent = None
current_state = None
history = []
action_log = []
start_time = None

@app.route('/')
def home():
    return jsonify({
        'status': 'running',
        'message': 'N-Queens RL API is running',
        'endpoints': {
            '/api/health': 'GET - Health check',
            '/api/reset': 'POST - Reset simulation',
            '/api/start': 'POST - Start simulation',
            '/api/step': 'POST - Perform step',
            '/api/config': 'GET - Get configuration',
            '/api/solve/qlearning': 'GET - Q-Learning solver',
            '/api/solve/genetic': 'GET - Genetic algorithm solver',
            '/api/solve/backtracking': 'GET - Backtracking solver'
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'ready': True
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        'BOARD_SIZE_MIN': config.BOARD_SIZE_MIN,
        'BOARD_SIZE_MAX': config.BOARD_SIZE_MAX,
        'LEARNING_RATE': config.LEARNING_RATE,
        'DISCOUNT_FACTOR': config.DISCOUNT_FACTOR,
        'EXPLORATION_RATE': config.EXPLORATION_RATE
    })

@app.route('/api/reset', methods=['POST', 'OPTIONS'])
def reset_simulation():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    global env, agent, current_state, history, action_log, start_time
    
    try:
        data = request.get_json() or {}
        board_size = data.get('size', config.BOARD_SIZE_MIN)
        board_size = max(config.BOARD_SIZE_MIN, min(board_size, config.BOARD_SIZE_MAX))
        
        env = NQueensEnv(board_size)
        agent = QLearningAgent(
            state_space_size=board_size,
            action_space_size=board_size,
            learning_rate=config.LEARNING_RATE,
            discount_factor=config.DISCOUNT_FACTOR,
            exploration_rate=config.EXPLORATION_RATE
        )
        current_state = env.reset()
        history = []
        action_log = []
        start_time = time.time()
        
        logger.info(f"Reset board: size={board_size}, queens={current_state}")
        
        return jsonify({
            'status': 'reset',
            'boardSize': board_size,
            'queens': current_state,
            'conflicts': env.get_conflicts(),
            'attackedSquares': env.get_attacked_squares(),
            'message': f'Reset successful for {board_size}x{board_size} board',
            'step': 0
        })
        
    except Exception as e:
        logger.error(f"Reset error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'message': 'Reset failed'
        }), 500

@app.route('/api/start', methods=['POST'])
def start_simulation():
    global env, agent, current_state, history, start_time
    
    try:
        data = request.get_json()
        board_size = data.get('boardSize', config.BOARD_SIZE_MIN)
        learning_rate = data.get('learningRate', config.LEARNING_RATE)
        discount_factor = data.get('discountFactor', config.DISCOUNT_FACTOR)
        exploration_rate = data.get('explorationRate', config.EXPLORATION_RATE)

        board_size = max(config.BOARD_SIZE_MIN, min(board_size, config.BOARD_SIZE_MAX))

        env = NQueensEnv(board_size)
        agent = QLearningAgent(
            state_space_size=board_size,
            action_space_size=board_size,
            learning_rate=learning_rate,
            discount_factor=discount_factor,
            exploration_rate=exploration_rate
        )
        agent.env = env
        current_state = env.reset()
        start_time = time.time()
        history = []

        logger.info(f"Started simulation: size={board_size}, queens={current_state}")
        
        return jsonify({
            'queens': current_state,
            'conflicts': env.get_conflicts(),
            'attackedSquares': env.get_attacked_squares(),
            'message': f'Started {board_size}x{board_size} board',
            'step': 0,
            'done': False
        })
    except Exception as e:
        logger.error(f"Start error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/step', methods=['POST', 'OPTIONS'])
def step_simulation():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    global current_state, history, action_log
    
    if env is None or agent is None:
        logger.error("Step attempted without initialization")
        return jsonify({'error': 'Simulation not initialized'}), 400

    try:
        logger.info(f"Current state before step: {current_state}")
        old_conflicts = env.get_conflicts()
        
        action = agent.choose_action(current_state)
        logger.info(f"Chosen action: {action}")
        
        new_state, reward, done = env.step(action)
        logger.info(f"New state: {new_state}, reward: {reward}, done: {done}")

        agent.learn(current_state, action, reward, new_state, done)
        current_state = new_state

        step = len(history) + 1
        time_elapsed = round(time.time() - start_time, 2)
        new_conflicts = env.get_conflicts()
        
        message = (
            f"Étape {step}: "
            f"Déplacé reine rangée {action[0]} vers colonne {action[1]}. "
            f"Conflits: {old_conflicts} → {new_conflicts}. "
            f"Récompense: {reward:.2f}"
        )

        history.append({
            'step': step,
            'conflicts': new_conflicts,
            'queens': env.queens.copy(),
            'reward': reward,
            'time_elapsed': time_elapsed,
            'message': message
        })
        action_log.append(message)

        logger.info(f"Step {step} completed: action={action}, queens={env.queens}, conflicts={new_conflicts}")
        
        return jsonify({
            'queens': env.queens,
            'conflicts': new_conflicts,
            'attackedSquares': env.get_attacked_squares(),
            'step': step,
            'reward': reward,
            'done': done,
            'message': message,
            'solutionFound': done,
            'timeElapsed': time_elapsed
        })

    except Exception as e:
        logger.error(f"Step error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

def count_conflicts(queens):
    conflicts = 0
    n = len(queens)
    for i in range(n):
        for j in range(i+1, n):
            if queens[i] == queens[j] or abs(queens[i] - queens[j]) == abs(i - j):
                conflicts += 1
    return conflicts

# Update the genetic_solve function
def genetic_solve(n, population_size=100, max_generations=1000):
    def fitness(individual):
        return n - count_conflicts(individual)
    
    history = []
    population = [random.sample(range(n), n) for _ in range(population_size)]
    
    for generation in range(max_generations):
        # Track best individual each generation
        best_individual = max(population, key=fitness)
        history.append(best_individual.copy())
        
        if fitness(best_individual) == n:
            return best_individual, generation+1, history
            
        # Selection and crossover
        new_population = []
        for _ in range(population_size):
            parents = random.choices(
                population,
                weights=[fitness(ind) for ind in population],
                k=2
            )
            crossover_point = random.randint(1, n-1)
            child = parents[0][:crossover_point] + [
                gene for gene in parents[1] if gene not in parents[0][:crossover_point]
            ]
            
            # Mutation
            if random.random() < 0.1:
                i, j = random.sample(range(n), 2)
                child[i], child[j] = child[j], child[i]
                
            new_population.append(child)
            
        population = new_population
    
    best_individual = max(population, key=fitness)
    return best_individual, max_generations, history

# Update the backtracking_solve function
def backtracking_solve(n):
    history = []
    stack = [(0, [-1]*n, 0)]  # (row, queens, steps)
    
    while stack:
        row, queens, steps = stack.pop()
        history.append(queens.copy())
        
        if row == n:
            return queens, steps, history
            
        for col in range(n-1, -1, -1):  # Try columns in reverse order
            if all(col != queens[r] and abs(col - queens[r]) != abs(row - r) 
                   for r in range(row)):
                new_queens = queens.copy()
                new_queens[row] = col
                stack.append((row + 1, new_queens, steps + 1))
    
    return None, len(history), history

@app.route('/api/solve/qlearning', methods=['GET'])
def solve_qlearning():
    try:
        n = request.args.get('n', default=8, type=int)
        n = max(config.BOARD_SIZE_MIN, min(n, config.BOARD_SIZE_MAX))

        tracemalloc.start()
        start_time = time.time()

        # Initialize environment and agent
        env = NQueensEnv(n)
        agent = QLearningAgent(
            state_space_size=n,
            action_space_size=n,
            learning_rate=config.LEARNING_RATE,
            discount_factor=config.DISCOUNT_FACTOR,
            exploration_rate=config.EXPLORATION_RATE
        )
        
        # Add environment to agent if needed
        if not hasattr(agent, 'env'):
            agent.env = env

        solution_history = [env.queens.copy()]
        current_state = env.reset()
        steps = 0
        done = False
        max_steps = 1000  # Prevent infinite loops

        while not done and steps < max_steps:
            action = agent.choose_action(current_state)
            new_state, reward, done = env.step(action)
            agent.learn(current_state, action, reward, new_state, done)
            current_state = new_state
            solution_history.append(env.queens.copy())
            steps += 1

            # Early exit if solution found
            if env.get_conflicts() == 0:
                done = True

        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        return jsonify({
            'solution': env.queens,
            'solutionHistory': solution_history,
            'steps': steps,
            'time': round((time.time() - start_time) * 1000, 2),
            'memory': round(peak / 1024, 2),
            'conflicts': env.get_conflicts(),
            'algorithm': 'Q-Learning',
            'success': env.get_conflicts() == 0
        })

    except Exception as e:
        logger.error(f"Q-Learning solve error: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'message': 'Q-Learning failed to find solution',
            'success': False
        }), 500

# Update the genetic algorithm endpoint
@app.route('/api/solve/genetic', methods=['GET'])
def solve_genetic():
    try:
        n = request.args.get('n', default=8, type=int)
        tracemalloc.start()
        start_time = time.time()
        
        solution, steps, history = genetic_solve(n)
        conflicts = count_conflicts(solution) if solution else n*n
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        return jsonify({
            'solution': solution,
            'solutionHistory': history,
            'steps': steps,
            'time': round((time.time() - start_time) * 1000, 2),
            'memory': peak / 1024,
            'conflicts': conflicts,
            'algorithm': 'Genetic',
            'success': conflicts == 0
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Genetic algorithm failed',
            'success': False
        }), 500

# Update the backtracking endpoint
@app.route('/api/solve/backtracking', methods=['GET'])
def solve_backtracking():
    try:
        n = request.args.get('n', default=8, type=int)
        tracemalloc.start()
        start_time = time.time()
        
        solution, steps, history = backtracking_solve(n)
        conflicts = 0 if solution else n*n
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        return jsonify({
            'solution': solution if solution else [-1]*n,
            'solutionHistory': history,
            'steps': steps,
            'time': round((time.time() - start_time) * 1000, 2),
            'memory': peak / 1024,
            'conflicts': conflicts,
            'algorithm': 'Backtracking',
            'success': conflicts == 0
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Backtracking failed',
            'success': False
        }), 500


# Multiplayer Game Endpoints
active_games = {}
leaderboard = []

@app.route('/api/multiplayer/create', methods=['POST'])
def create_multiplayer_game():
    data = request.get_json()
    game_id = str(uuid.uuid4())
    board_size = data.get('size', 8)
    
    active_games[game_id] = {
        'players': [],
        'board_size': board_size,
        'queens': [-1] * board_size,
        'current_turn': 0,
        'start_time': time.time(),
        'conflicts': 0,
        'moves': 0,
        'phase': 'placement',
        'placed_queens': 0,
        'ai_agent': None
    }
    
    logger.info(f"Created new game {game_id} with size {board_size}")
    return jsonify({
        'status': 'success',
        'game_id': game_id,
        'board_size': board_size
    }), 201

@app.route('/api/multiplayer/join/<game_id>', methods=['POST'])
def join_multiplayer_game(game_id):
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing request data'}), 400
    
    is_ai = data.get('ai', False)
    difficulty = data.get('difficulty', 'medium') if is_ai else None
    
    game = active_games[game_id]
    
    # Prevent joining started games
    if game['placed_queens'] > 0:
        return jsonify({'error': 'Game already started'}), 400
        
    # Prevent joining full games
    if len(game['players']) >= 2:
        return jsonify({'error': 'Game is full'}), 400
        
    # Assign player IDs: human is always 0, AI is always 1
    player_id = 1 if is_ai else 0
    
    # Prevent duplicate player IDs
    if any(p['id'] == player_id for p in game['players']):
        return jsonify({'error': 'Player slot already taken'}), 400
    
    game['players'].append({
        'id': player_id,
        'is_ai': is_ai,
        'difficulty': difficulty
    })
    
    # Set initial turn to human player (0)
    if not is_ai:
        game['current_turn'] = 0
    
    return jsonify({
        'player_id': player_id,
        'game_state': {
            'queens': game['queens'],
            'conflicts': game['conflicts'],
            'current_turn': game['current_turn'],
            'phase': game['phase'],
            'placed_queens': game['placed_queens'],
            'players': game['players']
        }
    })

# Add this near the top with other constants
ai_difficulties = {
    'easy': {
        'exploration_rate': 0.7,
        'learning_rate': 0.1,
        'think_delay': 1.5,  # seconds
        'search_depth': 1
    },
    'medium': {
        'exploration_rate': 0.4,
        'learning_rate': 0.2,
        'think_delay': 1.0,
        'search_depth': 2
    },
    'hard': {
        'exploration_rate': 0.1,
        'learning_rate': 0.3,
        'think_delay': 0.5,
        'search_depth': 3
    }
}

@app.route('/api/multiplayer/state/<game_id>', methods=['GET'])
def get_game_state(game_id):
    if game_id not in active_games:
        # Return a special response indicating game ended
        return jsonify({
            'status': 'ended',
            'message': 'Game has concluded'
        }), 200
    
    game = active_games[game_id]
    return jsonify({
        'players': game['players'],
        'queens': game['queens'],
        'conflicts': game['conflicts'],
        'current_turn': game['current_turn'],
        'phase': game['phase'],
        'placed_queens': game['placed_queens'],
        'moves': game['moves'],
        'board_size': game['board_size']
    })

def count_conflicts(queens):
    """Count the number of conflicts in the current board state"""
    conflicts = 0
    n = len(queens)
    for i in range(n):
        if queens[i] == -1:
            continue
        for j in range(i+1, n):
            if queens[j] == -1:
                continue
            if queens[i] == queens[j] or abs(queens[i] - queens[j]) == abs(i - j):
                conflicts += 1
    return conflicts


def is_attacked(row, col, queens):
    """Check if a square is under attack by any queen"""
    for r, c in enumerate(queens):
        if c == -1:
            continue
        if r == row or c == col or abs(r - row) == abs(c - col):
            return True
    return False

def get_ai_move(game_state, difficulty):
    """Generate AI move based on difficulty level"""
    params = ai_difficulties[difficulty]
    is_exploring = random.random() < params['exploration_rate']
    
    if game_state['phase'] == 'placement':
        empty_rows = [r for r in range(game_state['board_size']) 
                     if game_state['queens'][r] == -1]
        
        if not empty_rows:
            return None
            
        row = random.choice(empty_rows)
        safe_cols = [c for c in range(game_state['board_size'])
                    if not is_attacked(row, c, game_state['queens'])]
        
        if safe_cols:
            col = random.choice(safe_cols)
            return {
                'type': 'place',
                'row': row,
                'col': col,
                'is_exploring': True,
                'message': f'AI placed queen at ({row}, {col})'
            }
        # Strategic placement
        best_score = -1
        best_move = None
        
        for row in empty_rows:
            for col in range(game_state['board_size']):
                if not is_attacked(row, col, game_state['queens']):
                    new_queens = game_state['queens'].copy()
                    new_queens[row] = col
                    safe_squares = sum(
                        1 for r in range(game_state['board_size'])
                        for c in range(game_state['board_size'])
                        if new_queens[r] == -1 and not is_attacked(r, c, new_queens)
                    )
                    if safe_squares > best_score:
                        best_score = safe_squares
                        best_move = {'row': row, 'col': col}
        
        if best_move:
            return {
                'type': 'place',
                'row': best_move['row'],
                'col': best_move['col'],
                'is_exploring': False,
                'message': f'AI strategically placed queen at ({best_move["row"]}, {best_move["col"]})'
            }
    
    else:  # Correction phase
        conflicting_queens = [
            r for r in range(game_state['board_size']) 
            if game_state['queens'][r] != -1 and 
            is_attacked(r, game_state['queens'][r], game_state['queens'])
        ]
        
        if not conflicting_queens:
            return None
            
        if is_exploring:
            from_row = random.choice(conflicting_queens)
            valid_moves = []
            for to_row in range(game_state['board_size']):
                if to_row == from_row:
                    continue
                if game_state['queens'][to_row] != -1:
                    continue
                for to_col in range(game_state['board_size']):
                    if not is_attacked(to_row, to_col, game_state['queens']):
                        valid_moves.append((to_row, to_col))
            
            if valid_moves:
                to_row, to_col = random.choice(valid_moves)
                return {
                    'type': 'move',
                    'from_row': from_row,
                    'to_row': to_row,
                    'to_col': to_col,
                    'is_exploring': True,
                    'message': f'AI moved queen from row {from_row} to ({to_row}, {to_col})'
                }
        
        # Strategic move
        best_score = float('inf')
        best_move = None
        
        for from_row in conflicting_queens:
            for to_row in range(game_state['board_size']):
                if to_row == from_row:
                    continue
                if game_state['queens'][to_row] != -1:
                    continue
                for to_col in range(game_state['board_size']):
                    if not is_attacked(to_row, to_col, game_state['queens']):
                        new_queens = game_state['queens'].copy()
                        new_queens[from_row] = -1
                        new_queens[to_row] = to_col
                        conflicts = count_conflicts(new_queens)
                        if conflicts < best_score:
                            best_score = conflicts
                            best_move = {
                                'from_row': from_row,
                                'to_row': to_row,
                                'to_col': to_col
                            }
        
        if best_move:
            return {
                'type': 'move',
                'from_row': best_move['from_row'],
                'to_row': best_move['to_row'],
                'to_col': best_move['to_col'],
                'is_exploring': False,
                'message': f'AI strategically moved queen to reduce conflicts to {best_score}'
            }
    
    return None

@app.route('/api/multiplayer/move/<game_id>', methods=['POST'])
def make_multiplayer_move(game_id):
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    player_id = data.get('player_id')
    move = data.get('move')
    
    game = active_games[game_id]
    board_size = game['board_size']
    
    # Validate it's the player's turn
    if game['current_turn'] != player_id:
        return jsonify({'error': 'Not your turn'}), 400
    
    response = {
        'phase': game['phase'],
        'is_exploring': False,
        'last_move': None,
        'message': '',
        'done': False,
        'winner': None
    }

    # Handle player move
    if game['phase'] == 'placement':
        row = move.get('row')
        col = move.get('col')
        
        # Validate placement move
        if None in (row, col):
            return jsonify({'error': 'Missing row or column'}), 400
        if not (0 <= row < board_size and 0 <= col < board_size):
            return jsonify({'error': 'Invalid position'}), 400
        if game['queens'][row] != -1:
            return jsonify({'error': 'Row already occupied'}), 400
        if is_attacked(row, col, game['queens']):
            return jsonify({'error': 'Position under attack'}), 400
        
        # Place the queen
        game['queens'][row] = col
        game['placed_queens'] += 1
        game['conflicts'] = count_conflicts(game['queens'])
        game['moves'] += 1
        
        response['last_move'] = {
            'type': 'place',
            'row': row,
            'col': col,
            'player_id': player_id,
            'message': f'Player placed queen at ({row}, {col})'
        }
        
        # Check phase transition (only when all queens are placed)
        if game['placed_queens'] == board_size:
            if game['conflicts'] == 0:
                response['done'] = True
                response['winner'] = player_id
                response['message'] = 'Puzzle solved during placement!'
            else:
                game['phase'] = 'correction'
                response['phase'] = 'correction'
                response['message'] = 'Entered correction phase'
    
    else:  # Correction phase
        from_row = move.get('from_row')
        to_row = move.get('to_row')
        to_col = move.get('to_col')
        
        # Validate correction move
        if None in (from_row, to_row, to_col):
            return jsonify({'error': 'Missing move parameters'}), 400
        if not (0 <= from_row < board_size and 0 <= to_row < board_size and 0 <= to_col < board_size):
            return jsonify({'error': 'Invalid position'}), 400
        if game['queens'][from_row] == -1:
            return jsonify({'error': 'No queen in source row'}), 400
        if from_row != to_row and game['queens'][to_row] != -1:
            return jsonify({'error': 'Target row occupied'}), 400
        if is_attacked(to_row, to_col, game['queens']):
            return jsonify({'error': 'Target under attack'}), 400
        
        # Move the queen
        game['queens'][from_row] = -1
        game['queens'][to_row] = to_col
        game['conflicts'] = count_conflicts(game['queens'])
        game['moves'] += 1
        
        response['last_move'] = {
            'type': 'move',
            'from_row': from_row,
            'to_row': to_row,
            'to_col': to_col,
            'player_id': player_id,
            'message': f'Player moved queen from row {from_row} to ({to_row}, {to_col})'
        }
        
        # Check win condition
        if game['conflicts'] == 0:
            response['done'] = True
            response['winner'] = player_id
            response['message'] = 'Puzzle solved!'

    # Update response and switch turns
    response.update({
        'queens': game['queens'],
        'conflicts': game['conflicts'],
        'current_turn': 1 - game['current_turn']
    })
    game['current_turn'] = 1 - game['current_turn']
    
    # Handle AI move if needed (only if game isn't over)
    if not response['done'] and game['players'][game['current_turn']]['is_ai']:
        difficulty = game['players'][game['current_turn']]['difficulty']
        params = ai_difficulties[difficulty]
        
        # Get AI move
        ai_move = get_ai_move({
            'board_size': game['board_size'],
            'queens': game['queens'],
            'phase': game['phase'],
            'placed_queens': game['placed_queens'],
            'players': game['players']
        }, difficulty)
        
        if ai_move:
            # Execute AI move
            if ai_move['type'] == 'place':
                game['queens'][ai_move['row']] = ai_move['col']
                game['placed_queens'] += 1
            else:
                game['queens'][ai_move['from_row']] = -1
                game['queens'][ai_move['to_row']] = ai_move['to_col']
            
            game['conflicts'] = count_conflicts(game['queens'])
            game['moves'] += 1
            
            response.update({
                'queens': game['queens'],
                'conflicts': game['conflicts'],
                'current_turn': 1 - game['current_turn'],
                'last_move': {
                    **ai_move,
                    'player_id': game['current_turn']
                },
                'is_exploring': ai_move['is_exploring']
            })
            
            # Check win conditions after AI move
            if game['phase'] == 'placement' and game['placed_queens'] == board_size:
                if game['conflicts'] == 0:
                    response.update({
                        'done': True,
                        'winner': game['current_turn'],
                        'message': 'Puzzle solved during placement!'
                    })
                else:
                    game['phase'] = 'correction'
                    response['phase'] = 'correction'
                    response['message'] = 'Entered correction phase'
            elif game['conflicts'] == 0:
                response.update({
                    'done': True,
                    'winner': game['current_turn'],
                    'message': 'Puzzle solved!'
                })
            
            game['current_turn'] = 1 - game['current_turn']
    
    if response['done']:
        solve_time = time.time() - game['start_time']
        leaderboard.append({
            'game_id': game_id,
            'winner': response['winner'],
            'time': solve_time,
            'moves': game['moves'],
            'date': datetime.now().isoformat(),
            'against_ai': True,
            'ai_difficulty': difficulty,
            'board_size': board_size
        })
        del active_games[game_id]
        response.update({
            'final_time': solve_time,
            'final_moves': game['moves']
        })
    
    return jsonify(response)

@app.route('/api/multiplayer/leave/<game_id>', methods=['POST'])
def leave_game(game_id):
    if game_id not in active_games:
        # Return success even if game doesn't exist
        return jsonify({'status': 'game_already_removed'})
    
    data = request.get_json()
    player_id = data.get('player_id')
    
    game = active_games[game_id]
    game['players'] = [p for p in game['players'] if p['id'] != player_id]
    
    # If no players left, remove the game
    if not game['players']:
        del active_games[game_id]
        return jsonify({'status': 'game_removed'})
    
    # If human left, end the game
    if not any(not p['is_ai'] for p in game['players']):
        del active_games[game_id]
        return jsonify({'status': 'game_ended'})
    
    return jsonify({'status': 'player_left'})

@app.route('/api/multiplayer/difficulty', methods=['GET'])
def get_difficulty_options():
    return jsonify({
        'difficulties': list(ai_difficulties.keys()),
        'default': 'medium'
    })

@app.route('/api/multiplayer/results/<game_id>', methods=['GET'])
def get_game_results(game_id):
    # Check leaderboard for completed games
    for game in leaderboard:
        if game['game_id'] == game_id:
            return jsonify(game)
    return jsonify({'error': 'Game results not found'}), 404


@app.route('/api/multiplayer/ai-move/<game_id>', methods=['POST'])
def process_ai_move(game_id):
    if game_id not in active_games:
        return jsonify({'error': 'Game not found'}), 404
    
    game = active_games[game_id]
    
    # Find the AI player
    ai_player = next((p for p in game['players'] if p['is_ai']), None)
    if not ai_player:
        return jsonify({'error': 'No AI player in game'}), 400
    
    # Verify it's AI's turn
    if game['current_turn'] != ai_player['id']:
        return jsonify({'error': 'Not AI turn'}), 400
    
    # Get AI move
    difficulty = next(p['difficulty'] for p in game['players'] if p['is_ai'])
    ai_move = get_ai_move({
        'board_size': game['board_size'],
        'queens': game['queens'],
        'phase': game['phase'],
        'placed_queens': game['placed_queens'],
        'players': game['players']
    }, difficulty)
    
    if not ai_move:
        return jsonify({'error': 'No valid AI move'}), 400
    
    # Execute the move
    if ai_move['type'] == 'place':
        game['queens'][ai_move['row']] = ai_move['col']
        game['placed_queens'] += 1
    else:
        game['queens'][ai_move['from_row']] = -1
        game['queens'][ai_move['to_row']] = ai_move['to_col']
    
    game['conflicts'] = count_conflicts(game['queens'])
    game['moves'] += 1
    
    # Check win conditions
    response = {
        'queens': game['queens'],
        'conflicts': game['conflicts'],
        'current_turn': 0,  # Switch back to player
        'last_move': {
            **ai_move,
            'player_id': 1
        },
        'is_exploring': ai_move['is_exploring']
    }
    
    if game['phase'] == 'placement' and game['placed_queens'] == game['board_size']:
        if game['conflicts'] == 0:
            response.update({
                'done': True,
                'winner': 1,
                'message': 'AI solved the puzzle during placement!'
            })
        else:
            game['phase'] = 'correction'
            response['phase'] = 'correction'
    elif game['conflicts'] == 0:
        response.update({
            'done': True,
            'winner': 1,
            'message': 'AI solved the puzzle!'
        })
    
    game['current_turn'] = 0  # Switch back to player
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)