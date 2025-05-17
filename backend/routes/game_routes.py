from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import random
from database import get_user_by_id, get_jackpot, update_jackpot, update_user_bet

game_routes = Blueprint('game', __name__)

def get_player_state():
    return current_app.player_state

def get_statistics_manager():
    return current_app.statistics_manager

def get_config():
    from app import CONFIG
    return CONFIG

def get_symbols():
    from app import SYMBOLS
    return SYMBOLS

def get_combinations():
    from app import COMBINATIONS
    return COMBINATIONS

def get_bets():
    from app import bets
    return bets

def get_combination_manager():
    from flask import current_app
    return current_app.combination_manager

def get_lines_config():
    from app import LINES_CONFIG
    return LINES_CONFIG

@game_routes.route('/balance')
@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    player_state = get_player_state()
    balance = player_state.get_balance(user_id)
    freespins = player_state.get_freespins(user_id)
    
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
        
    return jsonify({
        "balance": balance,
        "freespins": freespins
    })

@game_routes.route('/spin', methods=['POST'])
@jwt_required()
def spin():
    # Получаем текущее значение джекпота из базы данных
    current_jackpot = get_jackpot()
    
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    data = request.get_json()
    bets_list = get_bets()
    bet = data.get('bet', min(bets_list) if bets_list else 100000)
    
    player_state = get_player_state()
    statistics_manager = get_statistics_manager()
    config = get_config()
    combination_manager = get_combination_manager()
    lines_config = get_lines_config()

    # Проверяем наличие фриспинов
    if player_state.has_freespins(user_id):
        success, error = player_state.use_freespin(user_id)
        if not success:
            return jsonify({"error": error}), 400
    else:
        success, error = player_state.deduct_bet(user_id, bet)
        if not success:
            return jsonify({"error": error}), 400

    # Генерация результата
    symbols = get_symbols()
    if config.get("always_win"):
        # Выбираем случайную комбинацию
        win_combo = random.choice(get_combinations())
        result = ['*'] * 5  # Инициализируем пустой результат
        
        if win_combo.get('anywhere'):
            # Для anywhere комбинаций (например, scatter)
            pattern = win_combo['pattern']
            # Размещаем требуемые символы в случайных позициях
            positions = random.sample(range(5), len(pattern))
            for pos, symbol in zip(positions, pattern):
                result[pos] = symbol
            # Заполняем оставшиеся позиции случайными символами
            for i in range(5):
                if result[i] == '*':
                    result[i] = random.choice([s['id'] for s in symbols])
        else:
            # Для линейных комбинаций
            line_id = win_combo.get('line_id')
            if line_id:
                # Находим конфигурацию линии
                line_config = next((line for line in lines_config['lines'] if line['id'] == line_id), None)
                if line_config:
                    # Создаем матрицу 3x5 для результата
                    matrix = [['*'] * 5 for _ in range(3)]
                    # Заполняем символы на выигрышной линии
                    pattern = win_combo['pattern']
                    for i, (x, y) in enumerate(line_config['positions']):
                        if i < len(pattern):
                            matrix[y][x] = pattern[i]
                        else:
                            matrix[y][x] = random.choice([s['id'] for s in symbols])
                    
                    # Заполняем оставшиеся позиции случайными символами
                    for y in range(3):
                        for x in range(5):
                            if matrix[y][x] == '*':
                                matrix[y][x] = random.choice([s['id'] for s in symbols])
                    
                    # Преобразуем всю матрицу в одномерный список
                    result = []
                    for x in range(5):  # Сначала по столбцам
                        for y in range(3):  # Затем по строкам
                            result.append(matrix[y][x])
    elif config.get("win_chance", 0) > 0 and random.random() < config["win_chance"]:
        win_combo = random.choice(get_combinations())
        if win_combo.get("line") == "center":
            result = win_combo["pattern"]
        elif win_combo.get("anywhere"):
            result = [win_combo["pattern"][0]] * len(win_combo["pattern"])
            while len(result) < 5:
                result.append(random.choice([s['id'] for s in symbols if s['id'] != win_combo["pattern"][0]]))
        else:
            result = [random.choice([s['id'] for s in symbols]) for _ in range(5)]
    else:
        symbols_ids = [s['id'] for s in symbols]
        result = [random.choice(symbols_ids) for _ in range(5)]

    # Проверка выигрыша с помощью CombinationManager
    win_result = combination_manager.check_win(result, bet, bets_list, current_jackpot)
    
    # Обновляем состояние игрока
    player_state.add_win(user_id, win_result.payout, bet, return_bet=win_result.payout > 0)
    if win_result.freespins_won > 0:
        player_state.add_freespins(user_id, win_result.freespins_won)

    # Обновляем джекпот
    if win_result.is_jackpot:
        update_jackpot(config.get('initial_jackpot', 5000))
    else:
        new_jackpot = current_jackpot + int(bet * 0.01)
        update_jackpot(new_jackpot)

    # Обновляем статистику
    statistics_manager.update_statistics(
        user_id, bet, win_result.payout,
        is_jackpot=win_result.is_jackpot,
        combo_name=win_result.combo_name,
        pattern=result
    )
    
    balance = player_state.get_balance(user_id)
    freespins = player_state.get_freespins(user_id)

    return jsonify({
        "result": result,
        "payout": win_result.payout,
        "freespins": freespins,
        "balance": balance,
        "combo_id": win_result.combo_id,
        "combo_name": win_result.combo_name,
        "jackpot_win": win_result.is_jackpot,
        "winning_lines": [
            {
                "id": line.line_id,
                "name": line.line_name,
                "multiplier": line.multiplier,
                "symbols": line.symbols
            }
            for line in win_result.winning_lines
        ]
    })

@game_routes.route('/bet', methods=['GET'])
@jwt_required()
def get_bet():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    bets_list = get_bets()
    return jsonify({"bet": user.get('bet', min(bets_list) if bets_list else 100000)})

@game_routes.route('/bet', methods=['POST'])
@jwt_required()
def set_bet():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
        
    data = request.get_json()
    bet = data.get('bet')
    if not isinstance(bet, int) or bet <= 0:
        return jsonify({"error": "Некорректная ставка"}), 400
        
    bets_list = get_bets()
    if bet not in bets_list:
        return jsonify({"error": "Недопустимая ставка"}), 400
        
    update_user_bet(user_id, bet)
    return jsonify({"bet": bet})

@game_routes.route('/restart', methods=['POST'])
@jwt_required()
def restart():
    user_id = get_jwt_identity()
    config = get_config()
    initial_balance = config.get('initial_balance', 1000)
    
    player_state = get_player_state()
    success, result = player_state.reset_state(user_id, initial_balance)
    if success:
        return jsonify(result)
    return jsonify(result), 400

@game_routes.route('/activate_freespins', methods=['POST'])
@jwt_required()
def activate_freespins():
    user_id = get_jwt_identity()
    player_state = get_player_state()
    if player_state.add_freespins(user_id, 10):
        balance = player_state.get_balance(user_id)
        freespins = player_state.get_freespins(user_id)
        return jsonify({
            "balance": balance,
            "freespins": freespins
        })
    return jsonify({"error": "Пользователь не найден"}), 404

@game_routes.route('/jackpot', methods=['GET'])
def get_jackpot_value():
    current_jackpot = get_jackpot()
    return jsonify({"jackpot": current_jackpot})

@game_routes.route('/jackpot', methods=['POST'])
def set_jackpot_value():
    data = request.get_json()
    value = data.get('jackpot')
    if not isinstance(value, int) or value < 0:
        return jsonify({"error": "Некорректное значение джекпота"}), 400
    if update_jackpot(value):
        return jsonify({"jackpot": value})
    return jsonify({"error": "Ошибка при обновлении джекпота"}), 500 